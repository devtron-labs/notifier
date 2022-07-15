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

//https://github.com/notifme/notifme-sdk/blob/master/src/models/notification-request.js#L132

export class SESService implements Handler {
    eventLogRepository: EventLogRepository
    eventLogBuilder: EventLogBuilder
    sesConfigRepository: SESConfigRepository
    usersRepository: UsersRepository
    logger: any

    constructor(eventLogRepository: EventLogRepository, eventLogBuilder: EventLogBuilder, sesConfigRepository: SESConfigRepository, usersRepository: UsersRepository, logger: any) {
        this.eventLogRepository = eventLogRepository
        this.eventLogBuilder = eventLogBuilder
        this.sesConfigRepository = sesConfigRepository
        this.usersRepository = usersRepository
        this.logger = logger
    }

    handle(event: Event, templates: NotificationTemplates[], setting: NotificationSettings, configsMap: Map<string, boolean>, destinationMap: Map<string, boolean>): boolean {
        let sesTemplate: NotificationTemplates = templates.find(t => {
            return 'ses' == t.channel_type
        })
        if (!sesTemplate) {
            this.logger.info("no ses template")
            return
        }
        const providerObjects = setting.config
        const providersSet = new Set(providerObjects);

        providersSet.forEach(p => {
            if (p['dest'] == "ses") {
                let userId = p['configId']
                let configKey = p['dest'] + '-' + userId
                if (!configsMap.get(configKey)) {
                    this.processNotification(userId, event, sesTemplate, setting, p, destinationMap)
                    configsMap.set(configKey, true)
                }
            }
        });
        return true
    }

    private processNotification(userId: number, event: Event, sesTemplate: NotificationTemplates, setting: NotificationSettings, p: string, emailMap: Map<string, boolean>) {
        this.usersRepository.findByUserId(userId).then(user => {
            if (!user) {
                this.logger.info('no user found for id')
                this.logger.info(event.correlationId)
                return
            }
            if (!emailMap.get(user['email_id'])) {
                emailMap.set(user['email_id'], true)
                event.payload['toEmail'] = user['email_id']
            } else {
                this.logger.info('duplicate email filtered out')
                return
            }
        })
        this.sesConfigRepository.findDefaultSESConfig().then(config => {
            let sdk: NotifmeSdk = new NotifmeSdk({
                channels: {
                    email: {
                        providers: [{
                            type: 'ses',
                            region: config['region'],
                            accessKeyId: config['access_key'],
                            secretAccessKey: config['secret_access_key'],
                            //sessionToken: config['session_token'] // optional
                        }]
                    }
                }
            });

            event.payload['fromEmail'] = config['from_email']
            let engine = new Engine();
            // let options = { allowUndefinedFacts: true }
            let conditions: string = p['rule']['conditions'];
            if (conditions) {
                engine.addRule({conditions: conditions, event: event});
                engine.run(event).then(e => {
                    this.sendNotification(event, sdk, sesTemplate.template_payload).then(result => {
                        this.saveNotificationEventSuccessLog(result, event, p, setting);
                    }).catch((error) => {
                        this.logger.error(error.message);
                        this.saveNotificationEventFailureLog(event, p, setting);
                    });
                })
            } else {
                this.sendNotification(event, sdk, sesTemplate.template_payload).then(result => {
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
            this.logger.info("event - ", event)
            this.logger.info("event - " + event)
            let json = Mustache.render(JSON.stringify(template), event.payload)
            this.logger.info("first typeof - " , typeof(json))
            json = JSON.parse(json)
            this.logger.info("2nd typeof - " , typeof(json))
            this.logger.info("json - ", json)
            this.logger.info("json - " + json)
            const res = await sdk.send(
                {
                    email: json
                }
            );
            return res;
        } catch (error) {
            this.logger.error('ses sendNotification error', error)
            throw new Error('Unable to send ses notification');
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