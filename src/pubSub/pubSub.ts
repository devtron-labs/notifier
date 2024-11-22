import {createInbox, JetStreamClient, NatsConnection, NatsError, StreamInfo, StringCodec,
    AckPolicy,
    DeliverPolicy} from "nats";
import {
    GetStreamSubjects,
    NatsConsumerConfig,
    NatsConsumerWiseConfigMapping,
    NatsStreamConfig,
    NatsStreamWiseConfigMapping,
    NatsTopic,
    NatsTopicMapping, numberOfRetries,
} from "./utils";
import {ConsumerOptsBuilderImpl} from "nats/lib/nats-base-client/jsconsumeropts";
import {ConsumerInfo, JetStreamManager, StreamConfig} from "nats/lib/nats-base-client/types";
import { natsHistogram } from "../common/metrics";

const consumerNotFoundErrorCode = 10014;
const streamNotFoundErrorCode = 10059;

export interface PubSubService {
    Subscribe(topic: string, callback: (msg: string) => Promise<void>): void
}

export class PubSubServiceImpl implements PubSubService {
    private nc: NatsConnection
    private js: JetStreamClient
    private jsm: JetStreamManager
    private logger: any


    constructor(conn: NatsConnection, jsm: JetStreamManager, logger: any) {
        this.nc = conn
        this.js = this.nc.jetstream()
        this.jsm = jsm
        this.logger = logger
    }

    // ********** Subscribe function provided by consumer

    async Subscribe(topic: string, callback: (msg: string) => Promise<void>) {
        const natsTopicConfig: NatsTopic = NatsTopicMapping.get(topic)
        const streamName = natsTopicConfig.streamName
        const consumerName = natsTopicConfig.consumerName
        //******* Getting consumer configuration

        const queueName = natsTopicConfig.queueName
        const consumerConfiguration = NatsConsumerWiseConfigMapping.get(consumerName)
        const inbox = createInbox()
        const consumerOptsDetails = new ConsumerOptsBuilderImpl({
            name: consumerName,
            deliver_subject: inbox,
            durable_name: consumerName,
            ack_wait: consumerConfiguration.ack_wait,
            filter_subject: topic,
            deliver_group:queueName,
            ack_policy:AckPolicy.Explicit,
            deliver_policy:DeliverPolicy.Last,
            max_ack_pending:1,
        }).bindStream(streamName).callback(async (err, msg) => {
            const timer = natsHistogram.startTimer()
            try {
                const msgString = getJsonString(msg.data)
                await callback(msgString)
                timer({streamName, consumerName})
            } catch (err) {
                this.logger.error("msg: "+msg.data+" err: "+err);
            }
            msg.ack();
        }).queue(queueName)

        const streamConfiguration = NatsStreamWiseConfigMapping.get(streamName)
        const streamConfigParsed = getStreamConfig(streamConfiguration, streamName)

        const maxAttempts =numberOfRetries ;
        let attempts = 0;

        while (attempts < maxAttempts) { //In the event of an error in the following flow, the notifier retries startup for a specified number of attempts instead of shutting down immediately
            try {
                // *******Creating/Updating stream
                await this.addOrUpdateStream(streamName, streamConfigParsed)

                //******* Getting consumer configuration

                // *** newConsumerFound check the consumer is new or not

                const createNewConsumer = await this.updateConsumer(streamName, consumerName, consumerConfiguration)

                // ********** Creating a consumer

                if (createNewConsumer) {
                    try {
                        await this.jsm.consumers.add(streamName, {
                            name: consumerName,
                            deliver_subject: inbox,
                            durable_name: consumerName,
                            ack_wait: consumerConfiguration.ack_wait,
                            filter_subject: topic,
                            deliver_group:queueName,
                            num_replicas: 0, // by setting this to zero,it will inherit replicas from stream
                            ack_policy:AckPolicy.Explicit,
                            deliver_policy:DeliverPolicy.Last,
                            max_ack_pending:1,
                        })
                        this.logger.info("consumer added successfully")
                    } catch (err) {
                        this.logger.error("error occurred while adding consumer", err)
                    }
                }

                // ****** NATS Subscribe function
                await this.js.subscribe(topic, consumerOptsDetails)
                this.logger.info("subscribed to nats successfully")

                break;
            } catch (err) {
                this.logger.error("unsuccessful in subscribing to NATS", err);
                attempts++;
                if (attempts === maxAttempts) {
                    this.logger.error("Maximum restart attempts reached. Exiting loop.");
                } else {
                    const delayInMilliseconds = 5000; // 5 seconds
                    await new Promise(resolve => setTimeout(resolve, delayInMilliseconds));
                }
            }
        }

    }

    async updateConsumer(streamName: string, consumerName: string, consumerConfiguration: NatsConsumerConfig): Promise<boolean> {
        let updatesDetected: boolean = false
        try {
            const info: ConsumerInfo | null = await this.jsm.consumers.info(streamName, consumerName)
            if (info) {

                if (consumerConfiguration.ack_wait > 0 && info.config.ack_wait != consumerConfiguration.ack_wait) {
                    info.config.ack_wait = consumerConfiguration.ack_wait
                    updatesDetected = true
                }

                const streamInfo: StreamInfo | null = await this.jsm.streams.info(streamName)
                if (streamInfo){
                    if (info.config.num_replicas != streamInfo.config.num_replicas){
                        info.config.num_replicas = streamInfo.config.num_replicas
                        updatesDetected = true
                    }
                }

                if (updatesDetected === true) {

                    await this.jsm.consumers.update(streamName, consumerName, info.config)
                    this.logger.info("consumer updated successfully, consumerName: "+ consumerName)

                }
            }
        } catch (err) {
            if (err instanceof NatsError) {
                this.logger.error("error occurred due to :", err)

                if (err.api_error.err_code === consumerNotFoundErrorCode) { // 10014 error code depicts that consumer is not found
                    return true
                }
            }
        }
        return false

    }

    async addOrUpdateStream(streamName: string, streamConfig: StreamConfig) {
        try {
            const Info: StreamInfo | null = await this.jsm.streams.info(streamName)
            if (Info) {
                if (await this.checkConfigChangeReqd(Info.config, streamConfig)) {
                    await this.jsm.streams.update(streamName, Info.config).catch(
                        (err) => {
                            this.logger.error("error occurred during updating streams", err)
                        }
                    )
                    this.logger.info("streams updated successfully")
                }
            }
        } catch (err) {
            if (err instanceof NatsError) {
                if (err.api_error.err_code === streamNotFoundErrorCode) {
                    streamConfig.name = streamName
                    try {
                        await this.jsm.streams.add(streamConfig)
                        this.logger.info("stream added successfully")
                    } catch (err) {
                        this.logger.error("error occurred during adding streams", err)
                    }
                } else {
                    this.logger.error("error occurred due to :", err)
                }

            }

        }

    }

    async checkConfigChangeReqd(existingStreamInfo: StreamConfig, toUpdateConfig: StreamConfig):Promise<boolean> {
        let configChanged: boolean = false
        if (toUpdateConfig.max_age != 0 && (toUpdateConfig.max_age != existingStreamInfo.max_age)) {
            existingStreamInfo.max_age = toUpdateConfig.max_age
            configChanged = true
        }
        if (!existingStreamInfo.subjects.includes(toUpdateConfig.subjects[0])) { // filter subject if not present already
            // If the value is not in the array, append it
            existingStreamInfo.subjects.push(toUpdateConfig.subjects[0]);
            configChanged = true
        }

        return configChanged
    }

}

function getJsonString(bytes: Uint8Array) {
    const sc = StringCodec();
    return JSON.stringify(sc.decode(bytes))

}

function getStreamConfig(streamConfig: NatsStreamConfig, streamName: string) {

    return {
        max_age: streamConfig.max_age,
        subjects: GetStreamSubjects(streamName),
        //num_replicas: streamConfig.num_replicas, Currently not supporting changing replica count of stream as it can be done from orchestrator side via publish function
    } as StreamConfig
}