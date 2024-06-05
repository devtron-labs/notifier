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