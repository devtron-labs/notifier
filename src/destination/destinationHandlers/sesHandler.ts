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

import NotifmeSdk from 'notifme-sdk'
import {Event, Handler} from '../../notification/service/notificationService';
import Mustache from 'mustache'
import Engine from 'json-rules-engine'
import {EventLogBuilder} from "../../common/eventLogBuilder"
import {EventLogRepository} from '../../repository/notifierEventLogRepository';
import {NotificationSettings} from "../../entities/notificationSettings";
import {NotificationTemplates} from "../../entities/notificationTemplates";
import {SESConfigRepository} from "../../repository/sesConfigRepository";
import {UsersRepository} from "../../repository/usersRepository";
import { MustacheHelper } from '../../common/mustacheHelper';
import {EVENT_TYPE} from "../../common/types";
import {CustomError} from "../../entities/events";

//https://github.com/notifme/notifme-sdk/blob/master/src/models/notification-request.js#L132

export class SESService implements Handler {
    eventLogRepository: EventLogRepository
    eventLogBuilder: EventLogBuilder
    sesConfigRepository: SESConfigRepository
    usersRepository: UsersRepository
    logger: any
    mh: MustacheHelper
    sesConfig: {
        region: string
        access_key: string
        secret_access_key: string
        from_email: string
    }
    constructor(eventLogRepository: EventLogRepository, eventLogBuilder: EventLogBuilder, sesConfigRepository: SESConfigRepository, usersRepository: UsersRepository, logger: any, mh: MustacheHelper) {
        this.eventLogRepository = eventLogRepository
        this.eventLogBuilder = eventLogBuilder
        this.sesConfigRepository = sesConfigRepository
        this.usersRepository = usersRepository
        this.logger = logger
        this.mh = mh
    }

    async handle(event: Event, templates: NotificationTemplates[], setting: NotificationSettings, configsMap: Map<string, boolean>, destinationMap: Map<string, boolean>): Promise<boolean> {
        let sesTemplate: NotificationTemplates = templates.find(t => {
            return 'ses' == t.channel_type
        })
        if (!sesTemplate) {
            this.logger.info("no ses template")
            return
        }
        const providerObjects = setting.config
        const providersSet = new Set(providerObjects);
        this.sesConfig = null
        for (const element of providersSet) {
            if ((element['dest'] === "ses") && (element['configId'] != 0)) {
                await this.getConfigById(element['configId'], providersSet, event, sesTemplate, setting, destinationMap, configsMap)
                break
            } else if (element['dest'] === "ses") {
                await this.getDefaultConfig(providersSet, event, sesTemplate, setting, destinationMap, configsMap)
                break
            }
        }
        return true
    }

    private async getDefaultConfig(providersSet, event: Event, sesTemplate: NotificationTemplates, setting: NotificationSettings, emailMap: Map<string, boolean>, configsMap: Map<string, boolean> ){
        try {
            const config = await this.sesConfigRepository.findDefaultSESConfig()
            this.sesConfig = {
                region: config['region'],
                access_key: config['access_key'],
                secret_access_key: config['secret_access_key'],
                from_email: config['from_email']
            }
            if(this.sesConfig && this.sesConfig.from_email){
                for (const p of providersSet) {
                    if (p['dest'] == "ses") {
                        let recipient = p['recipient']
                        let configKey = '';
                        if(recipient) {
                            configKey = p['dest'] + '-' + recipient
                        }
                        if (!configsMap.get(configKey)) {
                            await this.processNotification(recipient, event, sesTemplate, setting, p, emailMap)
                            configsMap.set(configKey, true)
                        }
                    }
                };
            }
        } catch (error) {
            this.logger.error('getDefaultConfig', error)
            throw new CustomError("Unable to send ses notification",500);
        }
    }

    private async getConfigById(id,providersSet, event: Event, sesTemplate: NotificationTemplates, setting: NotificationSettings, emailMap: Map<string, boolean>, configsMap: Map<string, boolean> ){
        try {
            const config = await this.sesConfigRepository.findBySESConfigId(id)
            this.sesConfig = {
                region: config['region'],
                access_key: config['access_key'],
                secret_access_key: config['secret_access_key'],
                from_email: config['from_email']
            }
            if(this.sesConfig && this.sesConfig.from_email){
                for (const p of providersSet) {
                    if (p['dest'] == "ses") {
                        let recipient = p['recipient']
                        let configKey = '';
                        if(recipient) {
                            configKey = p['dest'] + '-' + recipient
                        }
                        if (!configsMap.get(configKey)) {
                            await this.processNotification(recipient, event, sesTemplate, setting, p, emailMap)
                            configsMap.set(configKey, true)
                        }
                    }
                };
            }
        } catch (error) {
            this.logger.error('getDefaultConfig', error)
            throw new CustomError("Unable to send SES notification",500);
        }
    }

    private async preparePayloadAndSend(event: Event, sesTemplate: NotificationTemplates, setting: NotificationSettings, p: string){
        let sdk: NotifmeSdk = new NotifmeSdk({
            channels: {
                email: {
                    providers: [{
                        type: 'ses',
                        region: this.sesConfig['region'],
                        accessKeyId: this.sesConfig['access_key'],
                        secretAccessKey: this.sesConfig['secret_access_key'],
                        //sessionToken: config['session_token'] // optional
                    }]
                }
            }
        });

        event.payload['fromEmail'] = this.sesConfig['from_email']
        let engine = new Engine();
        // let options = { allowUndefinedFacts: true }
        let conditions: string = p['rule']['conditions'];
        if (conditions) {
          engine.addRule({ conditions: conditions, event: event });
          try {
            await engine.run(event);
            const result = await this.sendNotification(
              event,
              sdk,
              sesTemplate.template_payload
            );
            await this.saveNotificationEventSuccessLog(
              result,
              event,
              p,
              setting
            );
          } catch (error: any) {
            this.logger.error(error.message);
            await this.saveNotificationEventFailureLog(event, p, setting);
          }
        } else {
          try {
            const result = await this.sendNotification(
              event,
              sdk,
              sesTemplate.template_payload
            );
            await this.saveNotificationEventSuccessLog(
              result,
              event,
              p,
              setting
            );
          } catch (error: any) {
            this.logger.error(error.message);
            await this.saveNotificationEventFailureLog(event, p, setting);
          }
        }
    }

    private async processNotification(recipient: string, event: Event, sesTemplate: NotificationTemplates, setting: NotificationSettings, p: string, emailMap: Map<string, boolean>) {
        if (!recipient) {
            this.logger.error('recipient is blank')
            return
        }
        await this.sendEmailIfNotDuplicate(recipient, event, sesTemplate, setting, p, emailMap)
    }

    private async sendEmailIfNotDuplicate(recipient : string, event: Event, sesTemplate: NotificationTemplates, setting: NotificationSettings, p: string, emailMap: Map<string, boolean>) {
        if (!emailMap.get(recipient)) {
            emailMap.set(recipient, true)
            event.payload['toEmail'] = recipient
            await this.preparePayloadAndSend(event, sesTemplate, setting, p)
        } else {
            this.logger.info('duplicate email filtered out')
        }
    }

    public async sendNotification(event: Event, sdk: NotifmeSdk, template: string) {
        try {
            let parsedEvent = this.mh.parseEvent(event);
            parsedEvent['fromEmail'] = event.payload['fromEmail'];
            parsedEvent['toEmail'] = event.payload['toEmail'];
            let json: string
            if(event.eventTypeId===4 || event.eventTypeId === EVENT_TYPE.ImagePromotion){
                let commentDisplayStyle = (event.payload.imageComment === "") ? 'none' : 'inline';
                let tagDisplayStyle = (event.payload.imageTagNames === null) ? 'none' : 'inline';
                json = Mustache.render(template, { ...parsedEvent, commentDisplayStyle ,tagDisplayStyle});
            }else if(event.eventTypeId===5){
                let commentDisplayStyle = (event.payload.protectConfigComment === "") ? 'none' : 'inline';
                json = Mustache.render(template, { ...parsedEvent, commentDisplayStyle });
            }
            else{
                json = Mustache.render(template, parsedEvent)
            }

            const res = await sdk.send(
                {
                    email: JSON.parse(json)
                }
            );
            this.logger.info('Notification send')
            this.logger.info(json)
            return res;
        } catch (error) {
            this.logger.error('ses sendNotification error', error)
            throw new CustomError("Unable to send ses notification",500);
        }
    }

    private async saveNotificationEventSuccessLog(result: any, event: Event, p: any, setting: NotificationSettings) {
        if (result["status"] == "error") {
            await this.saveNotificationEventFailureLog(event, p, setting)
        } else {
            let eventLog = this.eventLogBuilder.buildEventLog(event, p.dest, true, setting);
            await this.eventLogRepository.saveEventLog(eventLog);
        }
    }

    private async saveNotificationEventFailureLog(event: Event, p: any, setting: NotificationSettings) {
        let eventLog = this.eventLogBuilder.buildEventLog(event, p.dest, false, setting);
        await this.eventLogRepository.saveEventLog(eventLog);
    }
}
