import {NotificationSettingsRepository} from "../../repository/notificationSettingsRepository";
import {EventRepository} from "../../repository/eventsRepository";
import {NotificationTemplatesRepository} from "../../repository/templatesRepository";
import {NotificationTemplates} from "../../entities/notificationTemplates";
import {NotificationSettings} from "../../entities/notificationSettings";

export interface Handler {
    handle(event: Event, templates: NotificationTemplates[], setting: NotificationSettings, configMap: Map<string, boolean>, destinationMap: Map<string, boolean>): boolean

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

    public sendNotification(event: Event) {

        this.logger.info("eventorg - ", event)
        this.logger.info("eventorg - ", event)

        if (!this.isValidEvent(event)) {
            return
        }

        this.notificationSettingsRepository.findByEventSource(event.pipelineType, event.pipelineId, event.eventTypeId, event.appId, event.envId, event.teamId).then((settingsResults) => {
            if (!settingsResults || settingsResults.length == 0) {
                this.logger.info("no notification settings found for event " + event.correlationId);
                return
            }
            let destinationMap = new Map();
            let configsMap = new Map();
            settingsResults.forEach((setting) => {
                const providerObjects = setting.config
                const providersSet = new Set(providerObjects);
                providersSet.forEach(p => {
                    let id = p['dest'] + '-' + p['configId']
                    configsMap.set(id, false)
                });
            });
            settingsResults.forEach((setting) => {
                this.templatesRepository.findByEventTypeIdAndNodeType(event.eventTypeId, event.pipelineType).then((templateResults: NotificationTemplates[]) => {
                    if (!templateResults) {
                        this.logger.info("no templates found for event ", event);
                        return
                    }
                    for (let h of this.handlers) {
                        h.handle(event, templateResults, setting, configsMap, destinationMap)
                    }
                })
            });
        }).catch(err => this.logger.error("err" + err))
    }

    private isValidEvent(event: Event) {
        if (event.eventTypeId && event.pipelineType && event.correlationId && event.payload && event.baseUrl)
            return true;
        return false;
    }
}

class Event {
    eventTypeId: number
    pipelineId: number
    pipelineType: string
    correlationId?: number | string;
    payload: any
    eventTime: string
    appId: number
    envId: number
    teamId: number
    baseUrl?: string
}

export {NotificationService, Event}