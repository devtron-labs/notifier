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

import "reflect-metadata";
import { createApp } from './app';
import { connectToDatabase } from './config/database';
import { connectToNats } from './config/nats';
import { initializeServices } from './services/serviceInitializer';
import { logger } from './config/logger';

const PORT = process.env.PORT || 3000;

const startServer = async () => {
    try {
        // Initialize database connection
        await connectToDatabase();

        // Initialize services
        const { notificationService } = initializeServices();

        // Connect to NATS if configured
        await connectToNats(notificationService);

        // Create and start the Express app
        const app = createApp(notificationService);

        app.listen(PORT, () => {
            logger.info(`Notifier app listening on port ${PORT}!`);
        });
    } catch (error) {
        logger.error('Failed to start server:', error);
        process.exit(1);
    }
};

// Start the server
startServer();
