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
import {UsersRepository} from "../../repository/usersRepository";
import { SMTPConfigRepository } from '../../repository/smtpConfigRepository';
import { MustacheHelper } from '../../common/mustacheHelper';
import {CustomError} from "../../entities/events";

//https://github.com/notifme/notifme-sdk/blob/master/src/models/notification-request.js#L132
export class SMTPService implements Handler {
    eventLogRepository: EventLogRepository
    eventLogBuilder: EventLogBuilder
    smtpConfigRepository: SMTPConfigRepository
    usersRepository: UsersRepository
    logger: any
    mh: MustacheHelper
    smtpConfig: {
        port: string
        host: string
        auth_user: string
        auth_password: string
        from_email: string
    }

    constructor(eventLogRepository: EventLogRepository, eventLogBuilder: EventLogBuilder, smtpConfigRepository: SMTPConfigRepository, usersRepository: UsersRepository, logger: any, mh: MustacheHelper) {
        this.eventLogRepository = eventLogRepository
        this.eventLogBuilder = eventLogBuilder
        this.smtpConfigRepository = smtpConfigRepository
        this.usersRepository = usersRepository
        this.logger = logger
        this.mh = mh
    }

    async handle(event: Event, templates: NotificationTemplates[], setting: NotificationSettings, configsMap: Map<string, boolean>, destinationMap: Map<string, boolean>): Promise<boolean> {
        let sesTemplate: NotificationTemplates = templates.find(t => {
            return 'ses' == t.channel_type
        })
        if (!sesTemplate) {
            this.logger.info("no smtp template")
            return
        }
        const providerObjects = setting.config
        const providersSet = new Set(providerObjects);
        this.smtpConfig = null
        for (const element of providersSet) {
            if ((element['dest'] === "smtp") && (element['configId'] != 0)) {
                await this.getConfigById(element['configId'], providersSet, event, sesTemplate, setting, destinationMap, configsMap)
                break
            } else if (element['dest'] === "smtp") {
                await this.getDefaultConfig(providersSet, event, sesTemplate, setting, destinationMap, configsMap)
                break
            }
        }
        return true
    }

    private async getDefaultConfig(providersSet, event: Event, sesTemplate: NotificationTemplates, setting: NotificationSettings, emailMap: Map<string, boolean>, configsMap: Map<string, boolean> ){
        try {
            const config = await this.smtpConfigRepository.findDefaultSMTPConfig()
            this.smtpConfig = {
                port: config['port'],
                host: config['host'],
                auth_user: config['auth_user'],
                auth_password: config['auth_password'],
                from_email: config['from_email']
            }
            if(this.smtpConfig && this.smtpConfig.from_email){
                for (const p of providersSet) {
                    if (p['dest'] == "smtp") {
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
                }
            }
        } catch (error) {
            this.logger.error('getDefaultConfig', error)
            throw new CustomError("Unable to send SMTP notification",500);
        }
    }

    private async getConfigById(id,providersSet, event: Event, sesTemplate: NotificationTemplates, setting: NotificationSettings, emailMap: Map<string, boolean>, configsMap: Map<string, boolean> ){
        try {
            const config = await this.smtpConfigRepository.findBySMTPConfigId(id)
            this.smtpConfig = {
                port: config['port'],
                host: config['host'],
                auth_user: config['auth_user'],
                auth_password: config['auth_password'],
                from_email: config['from_email']
            }
            if(this.smtpConfig && this.smtpConfig.from_email){
                for (const p of providersSet) {
                    if (p['dest'] == "smtp") {
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
                }
            }
        } catch (error) {
            this.logger.error('getDefaultConfig', error)
            throw new CustomError("Unable to send SMTP notification",500);
        }
    }

    private async preparePayloadAndSend(event: Event, smtpTemplate: NotificationTemplates, setting: NotificationSettings, p: string){
        const smtpConfig = this.smtpConfig;
        // Create the email provider configuration
        let emailProviderConfig: any = {
          type: "smtp",
          port: smtpConfig["port"],
          host: smtpConfig["host"],
        };

        // Conditionally add the auth object
        if ((smtpConfig["auth_user"]) && (smtpConfig["auth_password"])){
          emailProviderConfig.auth = {
            user: smtpConfig["auth_user"],
            pass: smtpConfig["auth_password"],
          };
        }else {
            emailProviderConfig.tls = {
              // do not fail on invalid certs
              rejectUnauthorized: false,
            };
          }

        // Create the NotifmeSdk instance
        let sdk: NotifmeSdk = new NotifmeSdk({
          channels: {
            email: {
              providers: [emailProviderConfig],
            },
          },
        });
        event.payload['fromEmail'] = this.smtpConfig['from_email']
        let engine = new Engine();
        // let options = { allowUndefinedFacts: true }
        let conditions: string = p['rule']['conditions'];

        if (conditions) {
            engine.addRule({conditions: conditions, event: event});
            try {
                await engine.run(event)
                const result = await this.sendNotification(event, sdk, smtpTemplate.template_payload)
                await this.saveNotificationEventSuccessLog(result, event, p, setting);}
            catch(error: any) {
                this.logger.error(error.message);
                await this.saveNotificationEventFailureLog(event, p, setting);
            }
        } else {
            try {
                const result = this.sendNotification(event, sdk, smtpTemplate.template_payload)
                await this.saveNotificationEventSuccessLog(result, event, p, setting);}
            catch(error: any)  {
                this.logger.error(error.message);
                await this.saveNotificationEventFailureLog(event, p, setting);
            }
        }
    }

    private async processNotification(recipient: string, event: Event, smtpTemplate: NotificationTemplates, setting: NotificationSettings, p: string, emailMap: Map<string, boolean>) {
        if (!recipient) {
            this.logger.error('recipient is blank')
            return
        }
        await this.sendEmailIfNotDuplicate(recipient, event, smtpTemplate, setting, p, emailMap)
    }

    private async sendEmailIfNotDuplicate(recipient : string, event: Event, smtpTemplate: NotificationTemplates, setting: NotificationSettings, p: string, emailMap: Map<string, boolean>) {
        if (!emailMap.get(recipient)) {
            emailMap.set(recipient, true)
            event.payload['toEmail'] = recipient
            await this.preparePayloadAndSend(event, smtpTemplate, setting, p)
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
            if(event.eventTypeId===4){
                let commentDisplayStyle = (event.payload.imageComment === "") ? 'none' : 'inline';
                let tagDisplayStyle = (event.payload.imageTagNames === null) ? 'none' : 'inline';
                json = Mustache.render(template, { ...parsedEvent, commentDisplayStyle ,tagDisplayStyle});
            }else if(event.eventTypeId===5){
                let commentDisplayStyle = (event.payload.protectConfigComment === "") ? 'none' : 'inline';
                json = Mustache.render(template, { ...parsedEvent, commentDisplayStyle });
            }else{
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
            this.logger.error('SMTP sendNotification error', error)
            throw new CustomError("Unable to send SMTP notification",500);
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
