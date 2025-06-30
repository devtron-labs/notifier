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

import { Router } from 'express';
import { NotificationService } from '../notification/service/notificationService';
import { logger } from '../config/logger';
import { successNotificationMetricsCounter, failedNotificationMetricsCounter } from '../common/metrics';

export const createNotificationRouter = (notificationService: NotificationService) => {
    const router = Router();

    router.post('/notify', async(req, res) => {
        logger.info("notifications Received - DEPRECATED ENDPOINT");
        logger.warn("The /notify endpoint is deprecated. Please use /notify/v2 instead.");
        
        res.status(410).json({
            message: "This endpoint is deprecated. Please use /notify/v2 instead.",
            deprecated: true,
            alternative: "/notify/v2"
        }).send();
        failedNotificationMetricsCounter.inc();
    });

    router.post('/notify/v2', async(req, res) => {
        logger.info("notifications V2 Received");
        const { event, notificationSettings } = req.body;

        // log the event and notificationSettings
        logger.info("event: ", event);
        logger.info("notificationSettings: ", notificationSettings);

        if (!event || !notificationSettings) {
            logger.error("Missing required fields: event or notificationSettings");
            res.status(400).json({message: "Missing required fields: event or notificationSettings"}).send();
            failedNotificationMetricsCounter.inc();
            return;
        }

        const response = await notificationService.sendNotificationV2(event, notificationSettings);
        if (response.status != 0) {
            res.status(response.status).json({message: response.message}).send();
            successNotificationMetricsCounter.inc();
        } else {
            res.status(response.error.statusCode).json({message: response.error.message}).send();
            failedNotificationMetricsCounter.inc();
        }
    });

    return router;
};

export default createNotificationRouter;
