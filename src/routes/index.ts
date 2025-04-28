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
import healthRoutes from './healthRoutes';
import createNotificationRouter from './notificationRoutes';
import metricsRoutes from './metricsRoutes';
import { NotificationService } from '../notification/service/notificationService';

export const createRouter = (notificationService: NotificationService) => {
    const router = Router();
    
    // Mount routes
    router.use('/', healthRoutes);
    router.use('/', createNotificationRouter(notificationService));
    router.use('/', metricsRoutes);
    
    return router;
};
