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
import {
    connect, consumerOpts,
    createInbox,
    JetStreamClient,
    NatsConnection, NatsError,
    RetentionPolicy,
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
    NOTIFICATION_EVENT_TOPIC,
} from "./utils";
import {ConsumerOptsBuilderImpl} from "nats/lib/nats-base-client/jsconsumeropts";

import {ConsumerInfo, ConsumerUpdateConfig, JetStreamManager, StreamConfig} from "nats/lib/nats-base-client/types";
import * as process from "process";
import {Event} from "../notification/service/notificationService";
import {info} from "winston";


export interface PubSubService{
    Subscribe(topic :string ,callback :(msg :string)=>void):void
    updateConsumer(streamName : string,consumerName :string,existingConsumerInfo :ConsumerUpdateConfig):void
}


 // const natsUrl=process.env.NATS_URL
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
            num_replicas:0
        }).bindStream(streamName).deliverLast().callback((err, msg) => {
            console.log("waiting for messages");
                try {
                    const msgString = getJsonString(msg.data)

                    callback(msgString)
                        msg.ack();

                } catch (err) {
                    console.log(`error occurred: ${err}`);
                }
        }).queue(queueName)

           // *******Creating/Updating stream

           const streamConfiguration=NatsStreamWiseConfigMapping.get(streamName)
          const streamConfigParsed=getStreamConfig(streamConfiguration)
        await this.addAndUpdateStream(streamName,streamConfigParsed).catch(
            (err) =>{
                console.log("error occurred while adding  customer",err)
            }

        )

         //******* Getting consumer configuration

        const consumerConfiguration=NatsConsumerWiseConfigMapping.get(consumerName)
        await this.updateConsumer(streamName,consumerName,consumerConfiguration) .catch(
            (err) =>{
                console.log("error occurred while add customer",err)
            })


       // ********** Creating a consumer

       await this.jsm.consumers.add(streamName,consumerOptsDetails.getOpts())
            .catch(
            (err) =>{
                console.log("error occurred while add customer",err)
            }
        )


        // *********  Nats Subscribe() function
        await this.js.subscribe(topic,consumerOptsDetails).catch(
            (err)=>{
                console.log("error occurred while subscribing",err)
            }
        )
    }


       async  updateConsumer(streamName :string , consumerName :string,consumerConfiguration :NatsConsumerConfig){
            let updatesDetected :boolean =false
           try{
            const info:ConsumerInfo | null =   await this.jsm.consumers.info(streamName,consumerName)
           const existingConsumerInfo=info.config
            if (consumerConfiguration.ack_wait>0 && existingConsumerInfo.ack_wait!=consumerConfiguration.ack_wait){
                existingConsumerInfo.ack_wait=consumerConfiguration.ack_wait
                updatesDetected=true
            }
            if (consumerConfiguration.num_replicas>0 && consumerConfiguration.num_replicas<5 && existingConsumerInfo.num_replicas!=consumerConfiguration.num_replicas){
                existingConsumerInfo.num_replicas=consumerConfiguration.num_replicas
                updatesDetected=true
            }
            if (updatesDetected==true){
                await  this.jsm.consumers.update(streamName,consumerName,existingConsumerInfo)
            }
            }
           catch (err){
              if(err instanceof  NatsError ){
                  if(err.api_error.err_code!=10014){
                       console.log(err)
                  }
              }
           }
        }

        async addAndUpdateStream(streamName:string,streamConfig :StreamConfig ){
             try{
                 const Info:StreamInfo | null = await this.jsm.streams.info(streamName)
                 streamConfig.name=streamName
                 if(Info){
                 if (checkConfigChangeReqd(Info.config,streamConfig)){
                    const si= await this.jsm.streams.update(streamName,Info.config)
                     console.log(si)
                     const val=checkConfigChangeReqd(Info.config,streamConfig)
                     console.log(val)
                   }
                  }
                }
            catch(err) {
                if (err instanceof NatsError) {
                    if(err.api_error.err_code==10059){

                    const cfgToSet = getNewConfig(streamName, streamConfig)
                    const streamInfo = await this.jsm.streams.add(cfgToSet)
                    console.log(streamInfo)
                    console.log(err)
                    }

                  }
                console.log(err)

               }

         }


}

function getJsonString(bytes :Uint8Array)  {
    const sc = StringCodec();
    // const event :Event= JSON.parse(JSON.stringify(sc.decode(bytes)));
    return JSON.stringify(sc.decode(bytes))
    // return event
}
function callBack(msg :Event){
   console.log(msg)
}
function getStreamConfig(streamConfig :NatsStreamConfig){
   const jsonString=  JSON.stringify(streamConfig)
      const  streamConfigParsed :StreamConfig = JSON.parse(jsonString)
    return streamConfigParsed
}
function checkConfigChangeReqd(existingStreamInfo:StreamConfig,toUpdateConfig:StreamConfig){
   let configChanged:Boolean=false
    const newStreamSubjects = GetStreamSubjects(toUpdateConfig.name)

    if ((toUpdateConfig.max_age !=0 && (toUpdateConfig.max_age != existingStreamInfo.max_age))  || (toUpdateConfig.num_replicas != existingStreamInfo.num_replicas && toUpdateConfig.num_replicas<5 && toUpdateConfig.num_replicas>=0)) {

        existingStreamInfo.max_age = toUpdateConfig.max_age
        existingStreamInfo.num_replicas = toUpdateConfig.num_replicas
        configChanged=true
    }
    return configChanged
}
function getNewConfig(stream:string,toUpdateConfig:StreamConfig):(StreamConfig){
   const  cfg :StreamConfig = {
       allow_direct: false,
       allow_rollup_hdrs: false,
       deny_delete: false,
       deny_purge: false,
       discard: undefined,
       discard_new_per_subject: false,
       duplicate_window: 0,
       max_age: 0,
       max_bytes: 0,
       max_consumers: 0,
       max_msg_size: 0,
       max_msgs: 0,
       max_msgs_per_subject: 0,
       mirror_direct: false,
       num_replicas: 0,
       retention: undefined,
       sealed: false,
       storage: undefined,
       subjects:GetStreamSubjects(stream) ,
       name:stream

   }

    if (toUpdateConfig.max_age !=0) {
        cfg.max_age = toUpdateConfig.max_age
    }
    if (toUpdateConfig.num_replicas > 0) {
        cfg.num_replicas = toUpdateConfig.num_replicas
    }
    if (toUpdateConfig.retention != RetentionPolicy.Limits) {
        cfg.retention = toUpdateConfig.retention
    }
    return cfg



}
//
// let conn : NatsConnection
// (async () => {
//     conn = await connect({servers:natsUrl})
//     const jsm = await conn.jetstreamManager()
//     const obj  = new PubSubServiceImpl(conn,jsm)
//     await obj.Subscribe(NOTIFICATION_EVENT_TOPIC,callBack)
// })()




