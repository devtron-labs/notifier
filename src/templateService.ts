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

// import * as mustache from 'mustache';
// import { readFileSync, writeFileSync } from 'fs';
// import { EventType, Event } from './notificationService';

// class TemplateService {
//     slackTemplateMap = new Map<EventType, string>();
//     constructor() {
//         const template = readFileSync('./template/slack.ci_success.template.mustache', 'utf-8');
//         this.slackTemplateMap.set(EventType.CI_SUCCESS, template)
//     }

//     getNotificationPayload(event: Event) {
//         if (this.slackTemplateMap.has(event.type)) {
//             let template = this.slackTemplateMap.get(event.type)

//         } else {
//             //err not supported
//         }

//     }

//     //const result = Mustache.render(template, hash);

// }