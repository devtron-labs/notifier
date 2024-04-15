import express from 'express';
import { NotificationService, Event, Handler } from './notification/service/notificationService'
import "reflect-metadata"
import {ConnectionOptions, createConnection, getConnectionOptions, getManager} from "typeorm"
import { NotificationSettingsRepository } from "./repository/notificationSettingsRepository"
import { SlackService } from './destination/destinationHandlers/slackHandler'
import { SESService } from './destination/destinationHandlers/sesHandler'
import { SMTPService } from './destination/destinationHandlers/smtpHandler'
import { EventLogRepository } from './repository/notifierEventLogRepository'
import { EventLogBuilder } from './common/eventLogBuilder'
import { EventRepository } from './repository/eventsRepository'
import { NotificationTemplatesRepository } from "./repository/templatesRepository";
import { SlackConfigRepository } from "./repository/slackConfigRepository";
import { NotificationSettings } from "./entities/notificationSettings";
import { NotifierEventLog } from "./entities/notifierEventLogs";
import { NotificationTemplates } from "./entities/notificationTemplates";
import { SlackConfig } from "./entities/slackConfig";
import * as winston from 'winston';
import { SesConfig } from "./entities/sesConfig";
import { SESConfigRepository } from "./repository/sesConfigRepository";
import { SMTPConfig } from "./entities/smtpConfig";
import { SMTPConfigRepository } from "./repository/smtpConfigRepository";
import { UsersRepository } from './repository/usersRepository';
import { Users } from "./entities/users";
import { send } from './tests/sendSlackNotification';
import { MustacheHelper } from './common/mustacheHelper';
import { WebhookConfigRepository } from './repository/webhookConfigRepository';
import { WebhookService } from './destination/destinationHandlers/webhookHandler';
import { WebhookConfig } from './entities/webhookconfig';
import * as process from "process";
import bodyParser from 'body-parser';
const app = express();
app.use(bodyParser.json({ limit: '10mb' }));

let logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.printf(info => {
            return `${info.timestamp} ${info.level}: ${info.message}`;
        })
    ),
    transports: [new winston.transports.Console()]
});

let eventLogRepository: EventLogRepository = new EventLogRepository()
let eventLogBuilder: EventLogBuilder = new EventLogBuilder()
let slackConfigRepository: SlackConfigRepository = new SlackConfigRepository()
let webhookConfigRepository:WebhookConfigRepository = new WebhookConfigRepository()
let sesConfigRepository: SESConfigRepository = new SESConfigRepository()
let smtpConfigRepository: SMTPConfigRepository = new SMTPConfigRepository()
let usersRepository: UsersRepository = new UsersRepository()
let mustacheHelper: MustacheHelper = new MustacheHelper()
let slackService = new SlackService(eventLogRepository, eventLogBuilder, slackConfigRepository, logger, mustacheHelper)
let webhookService = new WebhookService(eventLogRepository, eventLogBuilder, webhookConfigRepository, logger, mustacheHelper)
let sesService = new SESService(eventLogRepository, eventLogBuilder, sesConfigRepository, usersRepository, logger, mustacheHelper)
let smtpService = new SMTPService(eventLogRepository, eventLogBuilder, smtpConfigRepository, usersRepository, logger, mustacheHelper)

let handlers: Handler[] = []
handlers.push(slackService)
handlers.push(webhookService)
handlers.push(sesService)
handlers.push(smtpService)

let notificationService = new NotificationService(new EventRepository(), new NotificationSettingsRepository(), new NotificationTemplatesRepository(), handlers, logger)





let dbHost: string = process.env.DB_HOST;
const dbPort: number = +process.env.DB_PORT;
const user: string = process.env.DB_USER;
const pwd: string = process.env.DB_PWD;
const db: string = process.env.DB;

let dbOptions: ConnectionOptions = {
    type: "postgres",
    host: dbHost,
    port: dbPort,
    username: user,
    password: pwd,
    database: db,
    entities: [NotificationSettings, NotifierEventLog, Event, NotificationTemplates, SlackConfig, SesConfig, SMTPConfig, WebhookConfig, Users]
}

createConnection(dbOptions).then(async connection => {
    logger.info("Connected to DB")
}).catch(error => {
    logger.error("TypeORM connection error: ", error);
    logger.error("shutting down notifier due to un-successful database connection...")
    process.exit(1)
});

app.get('/', (req, res) => res.send('Welcome to notifier Notifier!'))

app.get('/health', (req, res) =>{
    res.status(200).send("healthy")
})

app.get('/test', (req, res) => {
    send();
    res.send('Test!');
})

app.post('/notify', (req, res) => {
    logger.info("notifications Received")
    notificationService.sendNotification(req.body)
    res.send('notifications sent')
});

app.listen(3000, () => logger.info('Notifier app listening on port 3000!'))