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

    handle(event: Event, templates: NotificationTemplates[], setting: NotificationSettings, configsMap: Map<string, boolean>, destinationMap: Map<string, boolean>): boolean {

        let slackTemplate: NotificationTemplates = templates.find(t => {
            return 'slack' == t.channel_type
        })
        if (!slackTemplate) {
            this.logger.info("no slack template for event: ", event)
            return
        }

        const providerObjects = setting.config
        const providersSet = new Set(providerObjects);

        providersSet.forEach(p => {
            if (p['dest'] == "slack") {
                let slackConfigId = p['configId']
                let configKey = p['dest'] + '-' + slackConfigId
                if (!configsMap.get(configKey)) {
                    this.processNotification(slackConfigId, event, slackTemplate, setting, p, destinationMap)
                    configsMap.set(configKey, true)
                }
            }
        });
        return true
    }

    private processNotification(slackConfigId: number, event: Event, slackTemplate: NotificationTemplates, setting: NotificationSettings, p: string, webhookMap: Map<string, boolean>) {
        this.slackConfigRepository.findBySlackConfigId(slackConfigId).then(config => {
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
            let conditions: string = p['rule']['conditions'];
            if (conditions) {
                engine.addRule({conditions: conditions, event: event});
                engine.run(event).then(e => {
                    this.sendNotification(event, sdk, slackTemplate.template_payload).then(result => {
                        this.saveNotificationEventSuccessLog(result, event, p, setting);
                    }).catch((error) => {
                        this.logger.error(error.message);
                        this.saveNotificationEventFailureLog(event, p, setting);
                    });
                })
            } else {
                this.sendNotification(event, sdk, slackTemplate.template_payload).then(result => {
                    this.saveNotificationEventSuccessLog(result, event, p, setting);
                }).catch((error) => {
                    this.logger.error(error.message);
                    this.saveNotificationEventFailureLog(event, p, setting);
                });
            }
        })
    }

    public async sendNotification(event: Event, sdk: NotifmeSdk, template: string) {
        try {
            let parsedEvent = this.mh.parseEvent(event as Event, true);
            let jsons = Mustache.render(template, parsedEvent);
            let j = JSON.parse(jsons)
            const res = await sdk.send(
                {
                    slack: j
                }
            );
            return res;
        } catch (error) {
            this.logger.error('Unable to send slack Notification', error)
            throw new CustomError('Unable to send slack Notification',500);
        }
    }

    private saveNotificationEventSuccessLog(result: any, event: Event, p: any, setting: NotificationSettings) {
        if (result["status"] == "error") {
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