/*
 * Copyright 2018-2019 The NATS Authors
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 */
import {connect, NatsConnection, JetStreamClient, StringCodec, createInbox} from "nats";
import {
    NatsConsumerConfig,
    NatsConsumerWiseConfigMapping,
    NatsTopic,
    NatsTopicMapping,
} from "./utils";
import {ConsumerOptsBuilderImpl} from "nats/lib/nats-base-client/jsconsumeropts";

import { ConsumerUpdateConfig, JetStreamManager} from "nats/lib/nats-base-client/types";


export interface PubSubService{
    Subscribe(topic :string ,callback :(msg :string)=>void):void
    updateConsumer(streamName : string,consumerName :string,existingConsumerInfo :ConsumerUpdateConfig):void
}



export class  PubSubServiceImpl implements PubSubService {
    private nc: NatsConnection
    private js: JetStreamClient
    private jsm: JetStreamManager


    constructor(conn: NatsConnection,jsm:JetStreamManager) {
        this.nc = conn
        this.js = this.nc.jetstream()
        this.jsm = jsm

    }

    // ********** Subscribe function provided by consumer

    async Subscribe(topic: string, callback: (msg: string) => void) {
        const natsTopicConfig: NatsTopic = NatsTopicMapping.get(topic)
        const streamName = natsTopicConfig.streamName
        const consumerName = natsTopicConfig.consumerName
        const queueName = natsTopicConfig.queueName
        const inbox = createInbox()
        const consumerOptsDetails = new ConsumerOptsBuilderImpl({
            name: consumerName,
            deliver_subject: inbox,
            durable_name: consumerName,
            ack_wait: 5 * 1e9,
            filter_subject: topic,


        }).bindStream(streamName).deliverLast().callback((err, msg) => {
            const msgString = getJsonString(msg.data)
            callback(msgString)

        }).queue(queueName)

         //******* Getting consumer configuration

        const consumerConfiguration=NatsConsumerWiseConfigMapping.get(consumerName)
        await this.updateConsumer(streamName,consumerName,consumerConfiguration)

       // ********** Creating a consumer
        const consumerInfo =  this.jsm.consumers.add(streamName,consumerOptsDetails.getOpts());

        // *********  Nats Subscribe() function
        await this.js.subscribe(topic, consumerOptsDetails)

    }


       async updateConsumer(streamName :string , consumerName :string,consumerConfiguration :NatsConsumerConfig){
            let updatesDetected :boolean =false
            const existingConsumerInfo=   await this.jsm.consumers.info(streamName,consumerName)
            if (consumerConfiguration.ack_wait>0 && existingConsumerInfo.config.ack_wait!=consumerConfiguration.ack_wait){
                existingConsumerInfo.config.ack_wait=consumerConfiguration.ack_wait
                updatesDetected=true
            }

            if (consumerConfiguration.num_replicas>0  && existingConsumerInfo.config.num_replicas){
                existingConsumerInfo.config.num_replicas=consumerConfiguration.num_replicas
                updatesDetected=true
            }

            if (updatesDetected==true){
                await  this.jsm.consumers.update(streamName,consumerName,existingConsumerInfo.config)
            }
        }


}

function getJsonString(bytes :Uint8Array)  {
    const sc = StringCodec();
    return JSON.stringify(sc.decode(bytes));
}




