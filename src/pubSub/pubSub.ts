import {
    AckPolicy,
    createInbox,
    DeliverPolicy,
    JetStreamClient,
    NatsConnection,
    NatsError,
    StreamInfo,
    StringCodec
} from "nats";
import {
    GetStreamSubjects,
    NatsConsumerConfig,
    NatsConsumerWiseConfigMapping,
    NatsStreamConfig,
    NatsStreamWiseConfigMapping,
    NatsTopic,
    NatsTopicMapping,
} from "./utils";

import {ConsumerOptsBuilderImpl} from "nats/lib/nats-base-client/jsconsumeropts";

import {ConsumerInfo, ConsumerUpdateConfig, JetStreamManager, StreamConfig} from "nats/lib/nats-base-client/types";


export interface PubSubService {
    Subscribe(topic: string, callback: (msg: string) => void): void
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

    async Subscribe(topic: string, callback: (msg: string) => void) {
        const natsTopicConfig: NatsTopic = NatsTopicMapping.get(topic)
        const streamName = natsTopicConfig.streamName
        const consumerName = natsTopicConfig.consumerName
        //******* Getting consumer configuration

        const consumerConfiguration = NatsConsumerWiseConfigMapping.get(consumerName)
        const queueName = natsTopicConfig.queueName
        const inbox = createInbox()
        const consumerOptsDetails = new ConsumerOptsBuilderImpl({
            name: consumerName,
            deliver_subject: inbox,
            durable_name: consumerName,
            ack_wait: consumerConfiguration.ack_wait,
            num_replicas: 0,
            filter_subject: topic,
            deliver_group:queueName,
            ack_policy:AckPolicy.Explicit,
            deliver_policy:DeliverPolicy.Last,
           max_ack_pending:1,
        }).bindStream(streamName).callback((err, msg) => {
            try {
                const msgString = getJsonString(msg.data)
                callback(msgString)
            } catch (err) {
                this.logger.error("msg: "+msg.data+" err: "+err);
            }
            msg.ack();
        }).queue(queueName)
        // *******Creating/Updating stream

        const streamConfiguration = NatsStreamWiseConfigMapping.get(streamName)
        const streamConfigParsed = getStreamConfig(streamConfiguration, streamName)
        await this.addOrUpdateStream(streamName, streamConfigParsed)



        // *** newConsumerFound check the consumer is new or not

        const newConsumerFound = await this.updateConsumer(streamName, consumerName, consumerConfiguration)

        // ********** Creating a consumer

        if (newConsumerFound) {
            try {
                await this.jsm.consumers.add(streamName, {
                    name: consumerName,
                    deliver_subject: inbox,
                    durable_name: consumerName,
                    ack_wait: consumerConfiguration.ack_wait,
                    num_replicas: 0,
                    filter_subject: topic,
                    deliver_group:queueName,
                    ack_policy:AckPolicy.Explicit,
                    deliver_policy:DeliverPolicy.Last,
                    max_ack_pending:1,
                })
                this.logger.info("consumer added successfully")
            } catch (err) {
                this.logger.error("error occurred while adding consumer", err)
            }


        }

        // *********  Nats Subscribe() function
        try {
            await this.js.subscribe(topic, consumerOptsDetails)
            this.logger.info("subscribed to nats successfully")

        } catch (err) {
            this.logger.error("error occurred while subscribing", err)
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
                if (updatesDetected === true) {

                    await this.jsm.consumers.update(streamName, consumerName, info.config)
                    this.logger.info("consumer updated successfully, consumerName: ", consumerName)

                }
            }
        } catch (err) {
            if (err instanceof NatsError) {
                this.logger.error("error occurred due to reason:", err)

                if (err.api_error.err_code === 10014) { // 10014 error code depicts that consumer is not found
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
                if (err.api_error.err_code === 10059) {

                    // const cfgToSet = getNewConfig(streamName, streamConfig)
                    streamConfig.name = streamName
                    try {
                        await this.jsm.streams.add(streamConfig)
                        this.logger.info(" stream added successfully")
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
    } as StreamConfig
}

