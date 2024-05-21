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

    handle(event: Event, templates: NotificationTemplates[], setting: NotificationSettings, configsMap: Map<string, boolean>, destinationMap: Map<string, boolean>): boolean {
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
            if (element['dest'] === "smtp") {
                this.getDefaultConfig(providersSet, event, sesTemplate, setting, destinationMap, configsMap)
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
                providersSet.forEach(p => {
                    if (p['dest'] == "smtp") {
                        let userId = p['configId']
                        let recipient = p['recipient']
                        let configKey = '';
                        if(recipient) {
                            configKey = p['dest'] + '-' + recipient
                        }else{
                            configKey = p['dest'] + '-' + userId
                        }
                        if (!configsMap.get(configKey)) {
                            this.processNotification(userId, recipient, event, sesTemplate, setting, p, emailMap)
                            configsMap.set(configKey, true)
                        }
                    }
                });
            }
        } catch (error) {
            this.logger.error('getDefaultConfig', error)
            throw new Error('Unable to get default SMTP config');
        }
    }

    private preparePaylodAndSend(event: Event, smtpTemplate: NotificationTemplates, setting: NotificationSettings, p: string){
        const smtpConfig = this.smtpConfig;
        // Create the email provider configuration
        let emailProviderConfig: any = {
          type: "smtp",
          port: smtpConfig["port"],
          host: smtpConfig["host"],
          tls: {
            // do not fail on invalid certs
            rejectUnauthorized: false,
          },
        };

        // Conditionally add the auth object
        if ((smtpConfig["auth_user"]) && (smtpConfig["auth_password"])){
          emailProviderConfig.auth = {
            user: smtpConfig["auth_user"],
            pass: smtpConfig["auth_password"],
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
            engine.run(event).then(e => {
                this.sendNotification(event, sdk, smtpTemplate.template_payload).then(result => {
                    this.saveNotificationEventSuccessLog(result, event, p, setting);
                }).catch((error) => {
                    this.logger.error(error.message);
                    this.saveNotificationEventFailureLog(event, p, setting);
                });
            })
        } else {
            this.sendNotification(event, sdk, smtpTemplate.template_payload).then(result => {
                this.saveNotificationEventSuccessLog(result, event, p, setting);
            }).catch((error) => {
                this.logger.error(error.message);
                this.saveNotificationEventFailureLog(event, p, setting);
            });
        }
    }

    private processNotification(userId: number, recipient: string, event: Event, smtpTemplate: NotificationTemplates, setting: NotificationSettings, p: string, emailMap: Map<string, boolean>) {
        if(userId) {
            this.usersRepository.findByUserId(userId).then(user => {
                if (!user) {
                    this.logger.info('no user found for id - ' + userId)
                    this.logger.info(event.correlationId)
                    return
                }
                this.sendEmailIfNotDuplicate(user['email_id'], event, smtpTemplate, setting, p, emailMap)
            })
        }else{
            if (!recipient) {
                this.logger.error('recipient is blank')
                return
            }
            this.sendEmailIfNotDuplicate(recipient, event, smtpTemplate, setting, p, emailMap)
        }
    }

    private sendEmailIfNotDuplicate(recipient : string, event: Event, smtpTemplate: NotificationTemplates, setting: NotificationSettings, p: string, emailMap: Map<string, boolean>) {
        if (!emailMap.get(recipient)) {
            emailMap.set(recipient, true)
            event.payload['toEmail'] = recipient
            this.preparePaylodAndSend(event, smtpTemplate, setting, p)
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
            throw new Error('Unable to send SMTP notification');
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