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

import {getManager} from "typeorm";
import {NotificationTemplates} from "../entities/notificationTemplates";
import { WebhookConfig } from "../entities/webhookconfig";

export class NotificationTemplatesRepository {

    findByEventTypeIdAndNodeType(eventTypeId: number, nodeType: string) {
        return getManager().getRepository(NotificationTemplates).find({
            where: {
                event_type_id: eventTypeId,
                node_type: nodeType
            }
        });
    }
    findByEventTypeId(eventTypeId: number) {
      return getManager().getRepository(NotificationTemplates).find({
          where: {
              event_type_id: eventTypeId,
             
          }
      });
  }

  findByEventTypeIdAndChannelType(eventTypeId: number, channelType: string) {
        return getManager().getRepository(NotificationTemplates).find({
            where: {
                event_type_id: eventTypeId,
                channel_type: channelType,
            }
        });
    }
}
export class WebhookConfigRepository {
    async getAllWebhookConfigs() {
      const webhookConfigs = await getManager()
        .getRepository(WebhookConfig)
        .find();
  
      return webhookConfigs;
    }
  }