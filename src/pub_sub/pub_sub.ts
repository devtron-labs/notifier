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
// import * as nats from "deno.land/x/nats/src/mod"
import * as nats from "nats.deno/src/mod"
// import connect from "nats.deno/src/mod" ;



import {sendNotification} from "../tests/notificationTest";
import * as dotenv from 'dotenv';
// import {Subscription} from "nats";
// import {sendNotification} from "./tests/notificationTest";
// import {Event} from "./entities/events";




// const topicName ="NOTIFICATION_EVENT_TOPIC"
// const queueName="NOTIFICATION_EVENT_GROUP"
// const stream= "ORCHESTRATOR"
// const consumer ="NOTIFICATION_EVENT_DURABLE"
// const js = nc.jetstream();
// const c =  js.consumers.get(stream, consumer);
import {NatsConnection } from "nats.deno/nats-base-client/core"
import {JetStreamClient} from "nats.deno/jetstream/types"
import {NotificationService,Event} from "../notification/service/notificationService";
import { connect } from "nats.deno/src/mod"
import {EventRepository} from "../repository/eventsRepository";
import {NotificationSettingsRepository} from "../repository/notificationSettingsRepository";
import {NotificationTemplatesRepository} from "../repository/templatesRepository";
const natsUrl = process.env.NATS_URL;
// const nc =  connect(natsUrl);
let notificationService = new NotificationService(new EventRepository(), new NotificationSettingsRepository(), new NotificationTemplatesRepository(), handlers, logger)

interface PubSubService{
    subscribe(callback :(event :Event)=>void):void
}

class  PubSubServiceImpl implements PubSubService {
    private nc : NatsConnection
    private js: JetStreamClient
    constructor() {
        this.nc=  connect(natsUrl)
        this.js= this.nc.jetstream()

    }


    async  subscribe(callback :(event :Event)=>void) {
        // create the subscription
        const consumer = await this.js.consumers.get(ORCHESTRATOR_STREAM,NOTIFICATION_EVENT_DURABLE)
        while (true) {
            console.log("waiting for messages");
            const messages = await consumer.consume();
            try {
                for await (const m of messages) {
                    console.log(m.seq);
                     const event:Event={
                         appId: 0, envId: 0, eventTime: "", eventTypeId: 0, pipelineId: 0, teamId: 0,
                         payload:m.data
                     }
                     callback(event)
                    m.ack();
                }
            } catch (err) {
                console.log(`consume failed: ${err}`);
            }
        }
    }
}

