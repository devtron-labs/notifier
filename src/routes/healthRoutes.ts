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
import { send } from '../tests/sendSlackNotification.test';

const router = Router();

router.get('/', (req, res) => {
    res.send('Welcome to notifier Notifier!');
});

router.get('/health', (req, res) => {
    res.status(200).send("healthy");
});

router.get('/test', (req, res) => {
    send();
    res.send('Test!');
});

export default router;
