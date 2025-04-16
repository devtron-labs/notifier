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

import { connect, NatsConnection } from "nats";
import { logger } from "./logger";
import { PubSubServiceImpl } from "../pubSub/pubSub";
import { NOTIFICATION_EVENT_TOPIC } from "../pubSub/utils";
import { Event } from "../notification/service/notificationService";
import { NotificationService } from "../notification/service/notificationService";
import { successNotificationMetricsCounter, failedNotificationMetricsCounter } from '../common/metrics';

export const natsEventHandler = (notificationService: NotificationService) => async (msg: string) => {
    const eventAsString = JSON.parse(msg);
    const event = JSON.parse(eventAsString) as Event;
    logger.info({ natsEventBody: event });
    const response = await notificationService.sendNotification(event);
    if (response.status != 0) {
        successNotificationMetricsCounter.inc();
    } else {
        failedNotificationMetricsCounter.inc();
    }
};

export const connectToNats = async (notificationService: NotificationService) => {
    const natsUrl = process.env.NATS_URL;
    
    if (!natsUrl) {
        logger.info("NATS_URL not provided, skipping NATS connection");
        return;
    }
    
    try {
        logger.info("Connecting to NATS server...");
        const conn: NatsConnection = await connect({ servers: natsUrl });
        const jsm = await conn.jetstreamManager();
        const pubSubService = new PubSubServiceImpl(conn, jsm, logger);
        await pubSubService.Subscribe(NOTIFICATION_EVENT_TOPIC, natsEventHandler(notificationService));
        logger.info("Successfully connected to NATS");
        return conn;
    } catch (err) {
        logger.error("Error connecting to NATS:", err);
    }
};
