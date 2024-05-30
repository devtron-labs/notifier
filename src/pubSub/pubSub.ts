import {ConsumerConfig, createInbox, JetStreamClient, NatsConnection, NatsError, StreamInfo, StringCodec} from "nats";
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
import {error} from "winston";


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
        const queueName = natsTopicConfig.queueName
        const inbox = createInbox()
        //******* Getting consumer configuration

        const consumerConfiguration = NatsConsumerWiseConfigMapping.get(consumerName)
        const consumerConfigParsed = getConsumerConfig(consumerConfiguration)
        console.log("consumerConfigParsed",consumerConfigParsed)
        const consumerOptsDetails = new ConsumerOptsBuilderImpl({
            name: consumerName,
            deliver_subject: inbox,
            durable_name: consumerName,
            ack_wait: 120 * 1e9,
            num_replicas: consumerConfigParsed.num_replicas,
            filter_subject: topic,


        }).bindStream(streamName).callback((err, msg) => {

            try {
                const msgString = getJsonString(msg.data)
                callback(msgString)
                msg.ack();
            } catch (err) {
                this.logger.error("error occurred due to this:", err);
            }
        })
        // *******Creating/Updating stream

        const streamConfiguration = NatsStreamWiseConfigMapping.get(streamName)
        const streamConfigParsed = getStreamConfig(streamConfiguration, streamName)
        console.log("streamconfig parsed",streamConfigParsed)

        try {
            await this.addOrUpdateStream(streamName, streamConfigParsed)
            this.logger.info("stream updated or added successfully")
            await this.addOrUpdateConsumer(streamName, consumerName, consumerConfiguration,inbox,topic)
            this.logger.info("consumer updated or added successfully")
            await this.js.subscribe(topic, consumerOptsDetails)
            this.logger.info("subscribed to nats successfully")

        } catch (err) {
            this.logger.error("error occurred while subscribing", err)
        }

        // *** newConsumerFound check the consumer is new or not

        //const newConsumerFound = await this.addOrUpdateConsumer(streamName, consumerName, consumerConfiguration)


        // ********** Creating a consumer

        // if (newConsumerFound) {
        //     try {
        //         await this.jsm.consumers.add(streamName, {
        //             name: consumerName,
        //             deliver_subject: inbox,
        //             durable_name: consumerName,
        //             ack_wait: 120 * 1e9,
        //             num_replicas: 0,
        //             filter_subject: topic,
        //
        //         })
        //         this.logger.info("consumer added successfully")
        //     } catch (err) {
        //         this.logger.error("error occurred while adding consumer", err)
        //     }
        //
        //
        // }

        // *********  Nats Subscribe() function



    }


    async addOrUpdateConsumer(streamName: string, consumerName: string, consumerConfiguration: NatsConsumerConfig,inbox: string, topic: string){
        let updatesDetected: boolean = false
        try {
            const info: ConsumerInfo | null = await this.jsm.consumers.info(streamName, consumerName)
            console.log("consumer info",info)
            if (info) {
                if (consumerConfiguration.ack_wait > 0 && info.config.ack_wait != consumerConfiguration.ack_wait) {
                    info.config.ack_wait = consumerConfiguration.ack_wait
                    updatesDetected = true
                }
                if (consumerConfiguration.num_replicas > 0 && info.config.num_replicas!= consumerConfiguration.num_replicas){
                    info.config.num_replicas=consumerConfiguration.num_replicas
                    console.log("num replicas mis match")
                    updatesDetected=true
                }
                if (updatesDetected === true) {

                    await this.jsm.consumers.update(streamName, consumerName, info.config)
                    this.logger.info("consumer updated successfully, consumerName: ", consumerName)

                }
            }
        } catch (err) {
            if (err instanceof NatsError) {
                this.logger.error("error occurred in adding or updating consumer due to reason:", err)

                if (err.api_error.err_code === 10014) { // 10014 error code depicts that consumer is not found
                    //return true
                    const consumerConfig=getConsumerConfig(consumerConfiguration)
                       consumerConfig.durable_name=consumerName
                    consumerConfig.filter_subject=topic
                    consumerConfig.name=consumerName
                        try {
                            await this.jsm.consumers.add(streamName, consumerConfig)
                            this.logger.info("consumer added successfully")
                        } catch (err) {
                            this.logger.error("error occurred while adding consumer", err)
                        }

                }else {
                    throw err
                }

            }else{
                throw err
            }
        }

    }

    async addOrUpdateStream(streamName: string, streamConfig: StreamConfig) {
        try {
            const Info: StreamInfo | null = await this.jsm.streams.info(streamName)
            if (Info) {
                if (await this.checkConfigChangeReqd(Info.config, streamConfig).catch((err)=>{
                    this.logger.error("error occurred during checking config of stream", err)
                    throw err
                })) {
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

                    throw err
                }

            }else{
                throw err
            }


        }

    }

    async checkConfigChangeReqd(existingStreamInfo: StreamConfig, toUpdateConfig: StreamConfig):Promise<boolean> {
        let configChanged: boolean = false
        if (toUpdateConfig.max_age != 0 && (toUpdateConfig.max_age != existingStreamInfo.max_age)) {
            existingStreamInfo.max_age = toUpdateConfig.max_age
            configChanged = true
        }
        if (toUpdateConfig.num_replicas != existingStreamInfo.num_replicas && toUpdateConfig.num_replicas < 5 && toUpdateConfig.num_replicas > 0) {
            if (toUpdateConfig.num_replicas > 0 && toUpdateConfig.num_replicas < 5 && toUpdateConfig.num_replicas != existingStreamInfo.num_replicas) {
                if (toUpdateConfig.num_replicas > 1 && this.nc.info && this.nc.info.cluster !== undefined) {
                    existingStreamInfo.num_replicas = toUpdateConfig.num_replicas
                    configChanged = true
                } else if (toUpdateConfig.num_replicas > 1) {
                    //console.log("replicas >1 is not possible in non-clustered mode")
                   this.logger.error("replicas >1 is not possible in non-clustered mode")
                    throw Error("replicas >1 is not possible in non-clustered mode")
                } else {
                    existingStreamInfo.num_replicas = toUpdateConfig.num_replicas
                    configChanged = true

                }

            }
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
        num_replicas: streamConfig.num_replicas,
        subjects: GetStreamSubjects(streamName),
    } as StreamConfig
}
function getConsumerConfig(consumerConfig: NatsConsumerConfig): ConsumerConfig{
    return {
        ack_wait:  consumerConfig.ack_wait,
        num_replicas: consumerConfig.num_replicas,
    }as ConsumerConfig
}

