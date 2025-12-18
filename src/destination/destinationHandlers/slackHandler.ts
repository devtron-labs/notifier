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
import Mustache from 'mustache';
import Engine from 'json-rules-engine'
import {EventLogBuilder} from "../../common/eventLogBuilder"
import {EventLogRepository} from '../../repository/notifierEventLogRepository';
import {NotificationTemplates} from "../../entities/notificationTemplates";
import {NotificationSettings} from "../../entities/notificationSettings";
import {SlackConfigRepository} from "../../repository/slackConfigRepository";
import {MustacheHelper} from '../../common/mustacheHelper';
import {EVENT_TYPE} from "../../common/types";
import moment from "moment-timezone";
import {CustomError} from "../../entities/events";

//https://github.com/notifme/notifme-sdk/blob/master/src/models/notification-request.js#L132
export class SlackService implements Handler {
    eventLogRepository: EventLogRepository
    eventLogBuilder: EventLogBuilder
    slackConfigRepository: SlackConfigRepository
    logger: any
    mh: MustacheHelper

    constructor(eventLogRepository: EventLogRepository, eventLogBuilder: EventLogBuilder, slackConfigRepository: SlackConfigRepository, logger: any, mh: MustacheHelper) {
        this.eventLogRepository = eventLogRepository
        this.eventLogBuilder = eventLogBuilder
        this.slackConfigRepository = slackConfigRepository
        this.logger = logger
        this.mh = mh;
    }

    async handle(event: Event, templates: NotificationTemplates[], setting: NotificationSettings, configsMap: Map<string, boolean>, destinationMap: Map<string, boolean>): Promise<boolean> {

        let slackTemplate: NotificationTemplates = templates.find(t => {
            return 'slack' == t.channel_type
        })
        if (!slackTemplate) {
            this.logger.info("no slack template for event: ", event)
            return
        }

        const providerObjects = setting.config
        const providersSet = new Set(providerObjects);

        for (const p of providersSet) {
            if (p['dest'] == "slack") {
                let slackConfigId = p['configId']
                let configKey = p['dest'] + '-' + slackConfigId
                if (!configsMap.get(configKey)) {
                    await this.processNotification(slackConfigId, event, slackTemplate, setting, p, destinationMap)
                    configsMap.set(configKey, true)
                }
            }
        }
        return true
    }

    private async processNotification(slackConfigId: number, event: Event, slackTemplate: NotificationTemplates, setting: NotificationSettings, p: string, webhookMap: Map<string, boolean>) {
            const config = await this.slackConfigRepository.findBySlackConfigId(slackConfigId)
            if (!config) {
                this.logger.info('no slack config found for event')
                this.logger.info(event.correlationId)
                return
            }

            if (!webhookMap.get(config['web_hook_url'])) {
                webhookMap.set(config['web_hook_url'], true)
            } else {
                this.logger.info('duplicate webHook filtered out')
                return
            }

            let sdk: NotifmeSdk = new NotifmeSdk({
                channels: {
                    slack: {
                        providers: [{
                            type: 'webhook',
                            webhookUrl: config['web_hook_url']
                        }]
                    }
                }
            });
            let engine = new Engine();
            // let options = { allowUndefinedFacts: true }
            let conditions: string = p["rule"]["conditions"];
            if (conditions) {
              engine.addRule({ conditions: conditions, event: event });
              try {
                await engine.run(event);
                const result = await this.sendNotification(
                  event,
                  sdk,
                  slackTemplate.template_payload
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
              await this.sendAndLogNotification(
                event,
                sdk,
                setting,
                p,
                slackTemplate
              );
            }
    }

    public async sendAndLogNotification(event: Event, sdk: NotifmeSdk, setting: NotificationSettings, p: any, slackTemplate: NotificationTemplates){
        try {
            const result = await this.sendNotification(event, sdk, slackTemplate.template_payload)
            await this.saveNotificationEventSuccessLog(result, event, p, setting);
        } catch(error: any) {
            this.logger.error(error.message);
            this.saveNotificationEventFailureLog(event, p, setting);
        };
    }

    public async sendNotification(event: Event, sdk: NotifmeSdk, template: string) {
        try {

            let jsons: string = ''
            if (event.eventTypeId == EVENT_TYPE.ScoopNotification){
                const date = moment(event.eventTime);
                event.payload.scoopNotificationConfig.data.interceptedAt = date.unix();
                jsons = Mustache.render(template, event.payload.scoopNotificationConfig.data);
            }else{
                let parsedEvent = this.mh.parseEvent(event as Event, true);
                this.logger.info('Parsed event data for Slack:', JSON.stringify(parsedEvent, null, 2));
                jsons = Mustache.render(template, parsedEvent);
            }

            this.logger.info('Rendered Mustache template (before JSON parse):', jsons);
            let j = JSON.parse(jsons)
            this.logger.info('Final Slack payload (after JSON parse):', JSON.stringify(j, null, 2));
            const res = await sdk.send(
                {
                    slack: j
                }
            );
            return res;
        } catch (error) {
            this.logger.error('slack sendNotification error', error)
            throw new CustomError("Unable to send slack notification",500);
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
