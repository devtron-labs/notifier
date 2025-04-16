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

import { NotificationService, Handler } from '../notification/service/notificationService';
import { EventLogRepository } from '../repository/notifierEventLogRepository';
import { EventLogBuilder } from '../common/eventLogBuilder';
import { SlackConfigRepository } from '../repository/slackConfigRepository';
import { WebhookConfigRepository } from '../repository/webhookConfigRepository';
import { SESConfigRepository } from '../repository/sesConfigRepository';
import { SMTPConfigRepository } from '../repository/smtpConfigRepository';
import { UsersRepository } from '../repository/usersRepository';
import { MustacheHelper } from '../common/mustacheHelper';
import { SlackService } from '../destination/destinationHandlers/slackHandler';
import { WebhookService } from '../destination/destinationHandlers/webhookHandler';
import { SESService } from '../destination/destinationHandlers/sesHandler';
import { SMTPService } from '../destination/destinationHandlers/smtpHandler';
import { EventRepository } from '../repository/eventsRepository';
import { NotificationSettingsRepository } from '../repository/notificationSettingsRepository';
import { NotificationTemplatesRepository } from '../repository/templatesRepository';
import { logger } from '../config/logger';

export const initializeServices = () => {
    // Initialize repositories
    const eventLogRepository = new EventLogRepository();
    const eventLogBuilder = new EventLogBuilder();
    const slackConfigRepository = new SlackConfigRepository();
    const webhookConfigRepository = new WebhookConfigRepository();
    const sesConfigRepository = new SESConfigRepository();
    const smtpConfigRepository = new SMTPConfigRepository();
    const usersRepository = new UsersRepository();
    const eventRepository = new EventRepository();
    const notificationSettingsRepository = new NotificationSettingsRepository();
    const notificationTemplatesRepository = new NotificationTemplatesRepository();
    
    // Initialize helpers
    const mustacheHelper = new MustacheHelper();
    
    // Initialize services
    const slackService = new SlackService(
        eventLogRepository, 
        eventLogBuilder, 
        slackConfigRepository, 
        logger, 
        mustacheHelper
    );
    
    const webhookService = new WebhookService(
        eventLogRepository, 
        eventLogBuilder, 
        webhookConfigRepository, 
        logger, 
        mustacheHelper
    );
    
    const sesService = new SESService(
        eventLogRepository, 
        eventLogBuilder, 
        sesConfigRepository, 
        usersRepository, 
        logger, 
        mustacheHelper
    );
    
    const smtpService = new SMTPService(
        eventLogRepository, 
        eventLogBuilder, 
        smtpConfigRepository, 
        usersRepository, 
        logger, 
        mustacheHelper
    );
    
    // Combine handlers
    const handlers: Handler[] = [
        slackService,
        webhookService,
        sesService,
        smtpService
    ];
    
    // Create notification service
    const notificationService = new NotificationService(
        eventRepository,
        notificationSettingsRepository,
        notificationTemplatesRepository,
        handlers,
        logger
    );
    
    return {
        notificationService,
        // Export other services if needed
    };
};
