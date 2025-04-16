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

import { ConnectionOptions, createConnection } from "typeorm";
import { NotificationSettings } from "../entities/notificationSettings";
import { NotifierEventLog } from "../entities/notifierEventLogs";
import { Event } from "../notification/service/notificationService";
import { NotificationTemplates } from "../entities/notificationTemplates";
import { SlackConfig } from "../entities/slackConfig";
import { SesConfig } from "../entities/sesConfig";
import { SMTPConfig } from "../entities/smtpConfig";
import { WebhookConfig } from "../entities/webhookconfig";
import { Users } from "../entities/users";
import { logger } from "./logger";
import * as process from "process";

export const connectToDatabase = async () => {
    const dbHost: string = process.env.DB_HOST;
    const dbPort: number = +process.env.DB_PORT;
    const user: string = process.env.DB_USER;
    const pwd: string = process.env.DB_PWD;
    const db: string = process.env.DB;

    const dbOptions: ConnectionOptions = {
        type: "postgres",
        host: dbHost,
        port: dbPort,
        username: user,
        password: pwd,
        database: db,
        entities: [
            NotificationSettings, 
            NotifierEventLog, 
            Event, 
            NotificationTemplates, 
            SlackConfig, 
            SesConfig, 
            SMTPConfig, 
            WebhookConfig, 
            Users
        ]
    };

    try {
        const connection = await createConnection(dbOptions);
        logger.info("Connected to DB");
        return connection;
    } catch (error) {
        logger.error("TypeORM connection error: ", error);
        logger.error("shutting down notifier due to un-successful database connection...");
        process.exit(1);
    }
};
