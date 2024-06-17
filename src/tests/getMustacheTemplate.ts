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

import fs from 'fs';
import { Event } from '../notification/service/notificationService';

export function getMustacheTemplate(event: Event) {
    if (event.pipelineType === "CI") {
        switch (event.eventTypeId) {
            case 1: return fs.readFileSync("src/tests/mustacheTemplate/CITrigger.mustache").toString();
            case 2: return fs.readFileSync('src/tests/mustacheTemplate/CISuccess.mustache').toString();
            case 3: return fs.readFileSync("src/tests/mustacheTemplate/CIFail.mustache").toString();
        }
    }
    else if (event.pipelineType === "CD") {
        switch (event.eventTypeId) {
            case 1: return fs.readFileSync("src/tests/mustacheTemplate/CDTrigger.mustache").toString();
            case 2: return fs.readFileSync("src/tests/mustacheTemplate/CDSuccess.mustache").toString();
            case 3: return fs.readFileSync("src/tests/mustacheTemplate/CDFail.mustache").toString();
        }
    }
}