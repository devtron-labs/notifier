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

import * as mustache from 'mustache';
import {Event} from "../notification/service/notificationService"
import { NotifierEventLog } from '../entities/notifierEventLogs';
import {NotificationSettings} from "../entities/notificationSettings";

export class EventLogBuilder {

    constructor() {}

    public buildEventLog(event: Event, destination: string, sentStatus: boolean, setting: NotificationSettings) {
        let notifierEventLog = {
            destination: destination,
            source_id: setting.pipeline_id,
            pipeline_type: setting.pipeline_type ? setting.pipeline_type : "NA", //This is optional as approval event doesn't have pipeline_type
            event_type_id: setting.event_type_id,
            correlation_id: event.correlationId,
            payload: event.payload,
            is_notification_sent: sentStatus,
            event_time: event.eventTime,
            created_at: new Date()
        }
        return notifierEventLog;
    }
}