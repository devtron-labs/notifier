/*
 * Copyright (c) 2024. Devtron Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {Event, Handler} from '../../notification/service/notificationService';
import Mustache from 'mustache';
import Engine from 'json-rules-engine'
import {EventLogBuilder} from "../../common/eventLogBuilder"
import {EventLogRepository} from '../../repository/notifierEventLogRepository';
import { WebhookConfig } from '../../entities/webhookconfig';
import {NotificationSettings} from "../../entities/notificationSettings";
import { WebhookConfigRepository } from '../../repository/webhookConfigRepository';
import {MustacheHelper} from '../../common/mustacheHelper';
import axios from 'axios';
import {EVENT_TYPE, WebhookParsedEvent} from "../../common/types";
import moment from "moment-timezone";

export class WebhookService implements Handler{
    eventLogRepository: EventLogRepository
    eventLogBuilder: EventLogBuilder
    webhookConfigRepository: WebhookConfigRepository
    logger: any
    mh: MustacheHelper

    constructor(eventLogRepository: EventLogRepository, eventLogBuilder: EventLogBuilder, webhookConfigRepository: WebhookConfigRepository, logger: any, mh: MustacheHelper) {
        this.eventLogRepository = eventLogRepository
        this.eventLogBuilder = eventLogBuilder
        this.webhookConfigRepository = webhookConfigRepository
        this.logger = logger
        this.mh = mh;
    }
    handle(event: Event, templates: WebhookConfig[], setting: NotificationSettings, configsMap: Map<string, boolean>, destinationMap: Map<string, boolean>): boolean{
        let  webhookTemplate: WebhookConfig  = templates.find(t => {
            return t
        })
        if (!webhookTemplate) {
            this.logger.info("no webhook template")
            return
        }
        const providerObjects = setting.config
        const providersSet = new Set(providerObjects);

        providersSet.forEach(p => {
            if (p['dest'] == "webhook" && p['configId']==webhookTemplate.id) {
                let webhookConfigId = p['configId']
                let configKey = p['dest'] + '-' + webhookConfigId
                if (!configsMap.get(configKey)) {
                    this.processNotification(webhookConfigId, event, webhookTemplate, setting, p, destinationMap)
                    configsMap.set(configKey, true)
                }
            }
        });
        return true

    }

    public sendAndLogNotification(event: Event, webhookTemplate: WebhookConfig, setting: NotificationSettings, p: any) {
        const payload=typeof webhookTemplate.payload==="object"?JSON.stringify(webhookTemplate.payload) : webhookTemplate.payload;
        this.sendNotification(event, webhookTemplate.web_hook_url, payload,webhookTemplate.header).then(result => {
            this.saveNotificationEventSuccessLog(result, event, p, setting);
        }).catch((error) => {
            this.logger.error(error.message);
            this.saveNotificationEventFailureLog(event, p, setting);
        });
    }

    private processNotification(webhookConfigId: number, event: Event, webhookTemplate: WebhookConfig, setting: NotificationSettings, p: string, webhookMap: Map<string, boolean>) {
        this.webhookConfigRepository.findByWebhookConfigId(webhookConfigId).then(config => {
            if (!config) {
                this.logger.info('no webhook config found for event')
                this.logger.info(event.correlationId)
                return
            }

            if (!webhookMap.get(config['web_hook_url'])) {
                webhookMap.set(config['web_hook_url'], true)
            } else {
                this.logger.info('duplicate webHook filtered out')
                return
            }
            let engine = new Engine();
            let conditions: string = p['rule']['conditions'];
            if (conditions) {
                engine.addRule({conditions: conditions, event: event});
                engine.run(event).then(e => {
                    this.sendAndLogNotification(event, webhookTemplate, setting, p);
                })
            } else {
                this.sendAndLogNotification(event, webhookTemplate, setting, p);
            }
        })
    }

    public async sendNotification(event: Event, webhookUrl: string, template: string, headers?: Record<string, string>) {
        try {
            if(!template){
                this.logger.error("template is empty")
                return
            }
            let jsons : string = ''
            if (event.eventTypeId == EVENT_TYPE.ScoopNotification){
                const date = moment(event.eventTime);
                event.payload.scoopNotificationConfig.data.interceptedAt = date.unix();
                jsons = Mustache.render(template, event.payload.scoopNotificationConfig.data);
            }else {
                let parsedEvent = this.mh.parseEventForWebhook(event as Event);
                jsons = Mustache.render(template, parsedEvent);
            }

            let j = JSON.parse(jsons);
            const headerConfig = { headers: {} };

            if (headers) {
                headerConfig.headers = headers;
            }
            const res = await axios.post(webhookUrl, j, headerConfig);
            this.logger.info("Notification Sent Successfully");
            console.log(res.data);
            return res.data;
        } catch (error) {
            this.logger.error("webhook sendNotification error", error);
        }
      }

    private saveNotificationEventSuccessLog(result: any, event: Event, p: any, setting: NotificationSettings) {
        
            if (!result || result["status"] == "error") {
                this.saveNotificationEventFailureLog(event, p, setting)
            } else {
                let eventLog = this.eventLogBuilder.buildEventLog(event, p.dest, true, setting);
                this.eventLogRepository.saveEventLog(eventLog);
            }  
    }

    private saveNotificationEventFailureLog(event: Event, p: any, setting: NotificationSettings) {
        let eventLog = this.eventLogBuilder.buildEventLog(event, p.dest, false, setting);
        this.eventLogRepository.saveEventLog(eventLog);
    }

}