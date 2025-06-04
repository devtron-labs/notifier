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
import bodyParser from 'body-parser';
import { createRouter } from './routes';
import { metricsMiddleware } from './middleware/metrics';
import { NotificationService } from './notification/service/notificationService';

export const createApp = (notificationService: NotificationService) => {
    const app = express();
    
    // Middleware
    app.use(bodyParser.json({ limit: '10mb' }));
    app.use(express.json());
    app.use(metricsMiddleware);
    
    // Routes
    app.use(createRouter(notificationService));
    
    return app;
};
