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
import { TlsOptions } from "tls";
import * as fs from "fs";
import { NotificationSettings } from "../entities/notificationSettings";
import { NotifierEventLog } from "../entities/notifierEventLogs";
import { Event } from "../notification/service/notificationService";
import { SlackConfig } from "../entities/slackConfig";
import { SesConfig } from "../entities/sesConfig";
import { SMTPConfig } from "../entities/smtpConfig";
import { WebhookConfig } from "../entities/webhookconfig";
import { Users } from "../entities/users";
import { logger } from "./logger";
import * as process from "process";

// buildSslOptions maps DB_SSL_MODE (disable|require|verify-ca|verify-full) to the
// node-postgres ssl option, mirroring libpq / AWS RDS semantics. Empty/"disable" returns
// false (plaintext, the pre-existing behaviour). verify-ca/verify-full require
// DB_SSL_ROOT_CERT (for AWS RDS the downloaded global-bundle.pem).
const buildSslOptions = (): boolean | TlsOptions => {
    const sslMode: string = (process.env.DB_SSL_MODE || "").trim().toLowerCase();
    switch (sslMode) {
        case "":
        case "disable":
            return false;
        case "require":
            // Encrypt the connection but do not validate the server certificate.
            return { rejectUnauthorized: false };
        case "verify-ca":
        case "verify-full": {
            const rootCertPath: string = process.env.DB_SSL_ROOT_CERT;
            if (!rootCertPath) {
                throw new Error("DB_SSL_ROOT_CERT is required for verify-ca/verify-full ssl modes");
            }
            const ca: string = fs.readFileSync(rootCertPath).toString();
            const options: TlsOptions = { rejectUnauthorized: true, ca };
            if (sslMode === "verify-ca") {
                // verify the certificate chain but not the server hostname.
                // checkServerIdentity is honoured by tls.connect at runtime but is not
                // part of the TlsOptions type in @types/node, hence the cast.
                (options as any).checkServerIdentity = () => undefined;
            }
            return options;
        }
        default:
            throw new Error(`unsupported DB_SSL_MODE "${sslMode}" (supported: disable, require, verify-ca, verify-full)`);
    }
};

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
        ssl: buildSslOptions(),
        entities: [
            NotificationSettings,
            NotifierEventLog,
            Event,
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
