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

const fetch = require('node-fetch');
import Mustache from 'mustache';
import event from './data/cd.json';
import { MustacheHelper } from '../common/mustacheHelper';
import { getMustacheTemplateTest } from './getMustacheTemplate.test';
import { Event } from '../notification/service/notificationService';
// Used for sending notification on slack. triggers on /test
export function send() {
    let webhookURL = 'https://hooks.slack.com/services/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';
    let mh = new MustacheHelper();
    
    let parsedEvent = mh.parseEvent(event);
    let mustacheHash = getMustacheTemplateTest(event as Event);
    let json = Mustache.render(JSON.stringify(mustacheHash), parsedEvent);
    json = JSON.parse(json);
    fetch(webhookURL, { body: json, method: "POST" }).then((r) => {
        return r.text();
    }).then((response) => {
        console.log({ response });
    }).catch((error) => {
        console.error({ error });
    })
}
