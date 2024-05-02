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
        if (!this.isValidEventForApproval(event)) {
            return
        }

        this.logger.info('notificationSettingsRepository.findByEventSource')
        if (!event.payload.providers || event.payload.providers == 0) {
            this.logger.info("no notification settings found for event " + event.correlationId);
            return
        }
        let destinationMap = new Map();
        let configsMap = new Map();
        this.logger.info("notification settings " );
        this.logger.info(JSON.stringify(event.payload.providers))
        event.payload.providers.forEach((setting) => {
            const providerObjects = setting
            let id = providerObjects['dest'] + '-' + providerObjects['configId']
            configsMap.set(id, false)
        });


        this.templatesRepository.findByEventTypeId(event.eventTypeId).then((templateResults:NotificationTemplates[]) => {
            if (!templateResults) {
                this.logger.info("no templates found for event ", event);
                return
            }
            let settings = new NotificationSettings()
            settings.config = event.payload.providers
            settings.pipeline_id = event.pipelineId
            settings.event_type_id = event.eventTypeId
            for (let h of this.handlers) {
                if ((h instanceof SESService) || (h instanceof SMTPService)){
                    h.handle(event, templateResults, settings, configsMap, destinationMap)
                }
            }
        }).
        catch(err => this.logger.error("err" + err))

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

    public sendNotification(event: Event) {

        if (event.payload.providers && event.payload.providers.length > 0){
            this.sendApprovalNotificaton(event)
            return
        }

        // check webhook for scoop notification event type
        if (event.eventTypeId == EVENT_TYPE.ScoopNotification && event.payload.scoopNotificationConfig.webhookConfig){
            this.sendWebhookNotification(event)
            return
        }

        // check slack for scoop notification event type
        if (event.eventTypeId == EVENT_TYPE.ScoopNotification && event.payload.scoopNotificationConfig.slackConfig){
            this.sendSlackNotification(event)
            return
        }


        if (!this.isValidEvent(event)) {
            return
        }

        this.notificationSettingsRepository.findByEventSource(event.pipelineType, event.pipelineId, event.eventTypeId, event.appId, event.envId, event.teamId).then((settingsResults) => {
          this.logger.info('notificationSettingsRepository.findByEventSource')
          if (!settingsResults || settingsResults.length == 0) {
                this.logger.info("no notification settings found for event " + event.correlationId);
                return
            }
            let destinationMap = new Map();
            let configsMap = new Map();
            this.logger.info("notification settings " );
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

                const configArray =  setting.config as any;
                if (Array.isArray(configArray)) {
                  const webhookConfig = configArray.filter((config) => config.dest === 'webhook');

                  if (webhookConfig.length) {
                    const webhookConfigRepository = new WebhookConfigRepository();
                    webhookConfig.forEach(config => {
                        webhookConfigRepository.getAllWebhookConfigs().then((templateResults: WebhookConfig[]) => {
                            const newTemplateResult = templateResults.filter((t) => t.id === config.configId);

                            if (newTemplateResult.length === 0) {
                              this.logger.info("no templates found for event ", event);
                              return;
                            }
                            
                            let ImageScanEvent = JSON.parse(JSON.stringify(event));
                            if (!!event.payload.imageScanExecutionInfo){
                                ImageScanEvent.payload.imageScanExecutionInfo = JSON.parse(JSON.stringify(event.payload.imageScanExecutionInfo[setting.id] ?? {}));
                            }
                            for (const h of this.handlers) {
                              if (h instanceof WebhookService){
                                if  (event.eventTypeId===EVENT_TYPE.ImageScan && !!event.payload.imageScanExecutionInfo){
                                    h.handle(ImageScanEvent, newTemplateResult, setting, configsMap, destinationMap);
                                }
                                h.handle(event, newTemplateResult, setting, configsMap, destinationMap);
                              }
                            }
                          });
                    });
                }
                if (configArray.length > webhookConfig.length){
                    this.templatesRepository.findByEventTypeIdAndNodeType(event.eventTypeId, event.pipelineType).then((templateResults:NotificationTemplates[]) => {
                        if (!templateResults) {
                            this.logger.info("no templates found for event ", event);
                            return
                        }
                        for (let h of this.handlers) {
                            h.handle(event, templateResults, setting, configsMap, destinationMap)
                        }
                    })
                }
            }
            });
        }).catch(err => this.logger.error("err" + err))
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