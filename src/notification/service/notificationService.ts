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
import {error} from "winston";
import { CustomError } from "../../entities/events";


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
            throw new CustomError("Event is not valid for approval ",400)
        }
        this.logger.info('notificationSettingsRepository.findByEventSource')
          if (!event.payload.providers || event.payload.providers == 0) {
                this.logger.info("no notification settings found for event " + event.correlationId);
                throw new CustomError("no notification settings found for event",400)
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
                            throw new CustomError("no templates found for event",404)

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
                    })

    }

    public sendNotification(event: Event,callback: (error?: any) => void) {
       try {
            try {
                if (event.payload.providers) {
                    this.sendApprovalNotificaton(event)
                    return
                }
            } catch (err: any) {
                if (err instanceof CustomError) {
                    throw err
                }
                throw new CustomError(err.message, 400)
            }
            if (!this.isValidEvent(event)) {
                throw new CustomError("Event is not valid", 400)
            }

            this.notificationSettingsRepository.findByEventSource(event.pipelineType, event.pipelineId, event.eventTypeId, event.appId, event.envId, event.teamId).then((settingsResults) => {
                this.logger.info('notificationSettingsRepository.findByEventSource')
                if (!settingsResults || settingsResults.length == 0) {
                    this.logger.info("no notification settings found for event " + event.correlationId);
                    callback(new CustomError("no notification settings found for event", 404))
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
                                        callback(new CustomError("no templates found for event", 404))
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
                                    callback(new CustomError("no templates found for event", 404))
                                }
                                for (let h of this.handlers) {
                                    h.handle(event, templateResults, setting, configsMap, destinationMap)
                                }
                            })
                        }
                    }
                });
            }).catch(err => {
                this.logger.error("err" + err)
                if (err instanceof CustomError) {
                    callback(err)
                }
                callback(new CustomError(err.message, 500))
            })
           callback()
        }catch (error) {
            // If an error occurs, call the callback with the error
            callback(error);
        }
    }

    private isValidEvent(event: Event) {
        if (event.eventTypeId && event.pipelineType && event.correlationId && event.payload && event.baseUrl)
            return true;
        return false;
    }
    private isValidEventForApproval(event: Event) {
        if (event.eventTypeId && event.correlationId && event.payload && event.baseUrl)
            return true;
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