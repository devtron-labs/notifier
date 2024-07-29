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

import {NotificationSettingsRepository} from "../../repository/notificationSettingsRepository";
import {EventRepository} from "../../repository/eventsRepository";
import {NotificationTemplatesRepository, WebhookConfigRepository} from "../../repository/templatesRepository";
import {NotificationTemplates} from "../../entities/notificationTemplates";
import {NotificationSettings} from "../../entities/notificationSettings";
import { WebhookConfig } from "../../entities/webhookconfig";
import { WebhookService } from "../../destination/destinationHandlers/webhookHandler";
import { SESService } from "../../destination/destinationHandlers/sesHandler";
import { SMTPService } from "../../destination/destinationHandlers/smtpHandler";
import { EVENT_TYPE } from "../../common/types";
import {SlackService} from "../../destination/destinationHandlers/slackHandler";
import {NotifmeSdk} from 'notifme-sdk'
import {CustomError, CustomResponse} from "../../entities/events";

export interface Handler {
    handle(event: Event, templates: (NotificationTemplates[] | WebhookConfig[]), setting: NotificationSettings, configMap: Map<string, boolean>, destinationMap: Map<string, boolean>): boolean

    sendNotification(event: Event, sdk: any, template: string)
}

class NotificationService {
    private eventRepository: EventRepository
    private notificationSettingsRepository: NotificationSettingsRepository
    private templatesRepository: NotificationTemplatesRepository
    private readonly handlers: Handler[]
    private logger: any

    constructor(eventRepository: EventRepository, notificationSettingsRepository: NotificationSettingsRepository, templatesRepository: NotificationTemplatesRepository, handlers: Handler[], logger: any) {
        this.eventRepository = eventRepository
        this.notificationSettingsRepository = notificationSettingsRepository
        this.handlers = handlers
        this.templatesRepository = templatesRepository
        this.logger = logger
    }
    public sendApprovalNotificaton(event:Event){
        try {
            if (!this.isValidEventForApproval(event)) {
                throw new CustomError("Event is not valid for approval ", 400)
            }

            this.logger.info('notificationSettingsRepository.findByEventSource')
            if (!event.payload.providers || event.payload.providers == 0) {
                this.logger.info("no notification settings found for event " + event.correlationId);
                throw new CustomError("no notification settings found for event", 400)
            }
            let destinationMap = new Map();
            let configsMap = new Map();
            this.logger.info("notification settings ");
            this.logger.info(JSON.stringify(event.payload.providers))
            event.payload.providers.forEach((setting) => {
                const providerObjects = setting
                let id = providerObjects['dest'] + '-' + providerObjects['configId']
                configsMap.set(id, false)
            });


            this.templatesRepository.findByEventTypeId(event.eventTypeId).then((templateResults: NotificationTemplates[]) => {
                if (!templateResults) {
                    this.logger.info("no templates found for event ", event);
                    throw new CustomError("no templates found for event", 404)
                }
                let settings = new NotificationSettings()
                settings.config = event.payload.providers
                settings.pipeline_id = event.pipelineId
                settings.event_type_id = event.eventTypeId
                for (let h of this.handlers) {
                    if ((h instanceof SESService) || (h instanceof SMTPService)) {
                        h.handle(event, templateResults, settings, configsMap, destinationMap)
                    }
                }
            }).catch(err => this.logger.error("err" + err))
        }catch (e:any){
            throw e instanceof CustomError?e:new CustomError(e.message,400)
        }
    }

    // this function is used to send webhook notification for scoop notification event type
    private sendWebhookNotification(event: Event) {
        this.handlers.forEach((h) => {
            if (h instanceof WebhookService){
                let setting = new NotificationSettings()
                setting.event_type_id = event.eventTypeId
                setting.pipeline_id = 0
                setting.config = event.payload
                h.sendAndLogNotification(event, event.payload.scoopNotificationConfig.webhookConfig as WebhookConfig, setting, {"dest": "webhook"})
            }
        })
    }

    // this function is used to send slack notification for scoop notification event type
    private sendSlackNotification(event: Event) {
        this.handlers.forEach((h) => {
            if (h instanceof SlackService){
                this.templatesRepository.findByEventTypeIdAndChannelType(event.eventTypeId, "slack").then((templateResults:NotificationTemplates[]) => {
                    if (!templateResults) {
                        this.logger.info("no templates found for event ", event);
                        return
                    }

                    const slackTemplateConfig = templateResults[0]
                    let sdk: NotifmeSdk = new NotifmeSdk({
                        channels: {
                            slack: {
                                providers: [{
                                    type: 'webhook',
                                    webhookUrl: event.payload.scoopNotificationConfig.slackConfig.webhookUrl
                                }]
                            }
                        }
                    });

                    let setting = new NotificationSettings()
                    setting.event_type_id = event.eventTypeId
                    setting.pipeline_id = 0
                    setting.config = event.payload
                    h.sendAndLogNotification(event, sdk,setting,{"dest": "slack"}, slackTemplateConfig)
                })
            }
        })
    }

    public async sendNotification(event: Event):Promise<CustomResponse> {
        try {
            if (event.payload.providers && event.payload.providers.length > 0) {
                this.sendApprovalNotificaton(event)
                return new CustomResponse("notification sent",200)
            }

            // check webhook for scoop notification event type
            if (event.eventTypeId == EVENT_TYPE.ScoopNotification && event.payload.scoopNotificationConfig.webhookConfig) {
                this.sendWebhookNotification(event)
                return new CustomResponse("notification sent",200)
            }

            // check slack for scoop notification event type
            if (event.eventTypeId == EVENT_TYPE.ScoopNotification && event.payload.scoopNotificationConfig.slackConfig) {
                this.sendSlackNotification(event)
                return new CustomResponse("notification sent",200)
            }


            if (!this.isValidEvent(event)) {
                throw new CustomError("Event is not valid", 400)
            }

            const settingsResults=await this.notificationSettingsRepository.findByEventSource(event.pipelineType, event.pipelineId, event.eventTypeId, event.appId, event.envId, event.teamId);
                this.logger.info('notificationSettingsRepository.findByEventSource')
                if (!settingsResults || settingsResults.length == 0) {
                    this.logger.info("no notification settings found for event " + event.correlationId);
                    return new CustomResponse("",0,new CustomError("no notification settings found for event",404))
                }
                let destinationMap = new Map();
                let configsMap = new Map();
                this.logger.info("notification settings ");
                this.logger.info(JSON.stringify(settingsResults))
                settingsResults.forEach((setting) => {
                    const providerObjects = setting.config
                    const providersSet = new Set(providerObjects);
                    providersSet.forEach(p => {
                        let id = p['dest'] + '-' + p['configId']
                        configsMap.set(id, false)
                    });
                });

                settingsResults.forEach((setting) => {

                    const configArray = setting.config as any;
                    if (Array.isArray(configArray)) {
                        const webhookConfig = configArray.filter((config) => config.dest === 'webhook');

                        if (webhookConfig.length) {
                            const webhookConfigRepository = new WebhookConfigRepository();
                            webhookConfig.forEach(config => {
                                webhookConfigRepository.getAllWebhookConfigs().then((templateResults: WebhookConfig[]) => {
                                    const newTemplateResult = templateResults.filter((t) => t.id === config.configId);

                                    if (newTemplateResult.length === 0) {
                                        this.logger.info("no templates found for event ", event);
                                        return new CustomResponse("",0,new CustomError("no templates found for event", 404));
                                    }

                                    let ImageScanEvent = JSON.parse(JSON.stringify(event));
                                    if (!!event.payload.imageScanExecutionInfo) {
                                        ImageScanEvent.payload.imageScanExecutionInfo = JSON.parse(JSON.stringify(event.payload.imageScanExecutionInfo[setting.id] ?? {}));
                                    }
                                    for (const h of this.handlers) {
                                        if (h instanceof WebhookService) {
                                            if (event.eventTypeId === EVENT_TYPE.ImageScan && !!event.payload.imageScanExecutionInfo) {
                                                h.handle(ImageScanEvent, newTemplateResult, setting, configsMap, destinationMap);
                                            }
                                            h.handle(event, newTemplateResult, setting, configsMap, destinationMap);
                                        }
                                    }
                                });
                            });
                        }
                        if (configArray.length > webhookConfig.length) {
                            this.templatesRepository.findByEventTypeIdAndNodeType(event.eventTypeId, event.pipelineType).then((templateResults: NotificationTemplates[]) => {
                                if (!templateResults) {
                                    this.logger.info("no templates found for event ", event);
                                    return new CustomResponse("",0,new CustomError("no templates found for event", 404));
                                }
                                for (let h of this.handlers) {
                                    h.handle(event, templateResults, setting, configsMap, destinationMap)
                                }
                            })
                        }
                    }
                });
            this.logger.info("notification sent");
            return  new CustomResponse("notification sent",200)
        }catch (error:any){
            return await error instanceof CustomError?new CustomResponse("",0,error):new CustomResponse("",0,new CustomError(error.message,400))
        }
    }

    private isValidEvent(event: Event) {
        if ((event.eventTypeId && event.pipelineType && event.correlationId && event.payload && event.baseUrl) || (event.eventTypeId == EVENT_TYPE.ScoopNotification))
            return true;
        return false;
    }
    private isValidEventForApproval(event: Event) {
        if (event.eventTypeId && event.correlationId && event.payload && (event.baseUrl || event.eventTypeId == EVENT_TYPE.ScoopNotification)) {
            return true;
        }
        return false;
    }
}

class Event {
    eventTypeId: number
    pipelineId: number
    pipelineType?: string
    correlationId?: number | string
    payload: any
    eventTime: string
    appId: number
    envId: number
    teamId: number
    baseUrl?: string
}

export {NotificationService, Event}