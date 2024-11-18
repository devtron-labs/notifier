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

import express from 'express';
import { NotificationService, Event, Handler } from './notification/service/notificationService'
import "reflect-metadata"
import { ConnectionOptions, createConnection } from "typeorm"
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
import {connect, NatsConnection} from "nats";
import { register } from 'prom-client'
import {NOTIFICATION_EVENT_TOPIC} from "./pubSub/utils";
import {PubSubServiceImpl} from "./pubSub/pubSub";
import { failedNotificationMetricsCounter, httpRequestMetricsCounter, successNotificationMetricsCounter } from './common/metrics';

const app = express();
const natsUrl = process.env.NATS_URL
app.use(bodyParser.json({ limit: '10mb' }));
app.use(express.json());

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
let webhookConfigRepository: WebhookConfigRepository = new WebhookConfigRepository()
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
    if(natsUrl){
        let conn: NatsConnection
        (async () => {
            logger.info("Connecting to NATS server...");
            conn = await connect({servers:natsUrl})
            const jsm = await conn.jetstreamManager()
            const obj = new PubSubServiceImpl(conn, jsm,logger)
            await obj.Subscribe(NOTIFICATION_EVENT_TOPIC, natsEventHandler)
        })().catch(
            (err) => {
                logger.error("error occurred due to", err)
            }
        )
    }
}).catch(error => {
    logger.error("TypeORM connection error: ", error);
    logger.error("shutting down notifier due to un-successful database connection...")
    process.exit(1)
});

const natsEventHandler = async (msg: string) => {
    const eventAsString = JSON.parse(msg)
    const event = JSON.parse(eventAsString) as Event
    logger.info({natsEventBody: event})
    const response = await notificationService.sendNotification(event)
    if (response.status != 0){
        successNotificationMetricsCounter.inc()
    } else{
        failedNotificationMetricsCounter.inc()
    }
}

// Request counter for all endpoints
app.use((req, res, next) => {
    httpRequestMetricsCounter.labels({method: req.method, endpoint: req.url, statusCode: res.statusCode}).inc()
    next()
  })

app.get('/', (req, res) => {
    res.send('Welcome to notifier Notifier!')
})

app.get('/health', (req, res) => {
    res.status(200).send("healthy")
})

app.get('/test', (req, res) => {
    send();
    res.send('Test!');
})

app.post('/notify', async(req, res) => {
    logger.info("notifications Received")
    const response=await notificationService.sendNotification(req.body);
    if (response.status!=0){
        res.status(response.status).json({message:response.message}).send()
        successNotificationMetricsCounter.inc()
    }else{
        res.status(response.error.statusCode).json({message:response.error.message}).send()
        failedNotificationMetricsCounter.inc()
    }
});

app.get('/metrics', async (req, res) => {
    res.setHeader('Content-Type', register.contentType)
    res.send(await register.metrics())
});

app.listen(3000, () => logger.info('Notifier app listening on port 3000!'))
