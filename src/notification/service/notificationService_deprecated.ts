import {NotificationSettingsRepository} from "../../repository/notificationSettingsRepository";
import {EventRepository} from "../../repository/eventsRepository";
import {NotificationTemplatesRepository, WebhookConfigRepository} from "../../repository/templatesRepository";
import {NotificationTemplates} from "../../entities/notificationTemplates";
import {NotificationSettings} from "../../entities/notificationSettings";
import { WebhookConfig } from "../../entities/webhookconfig";
import { WebhookService } from "../../destination/destinationHandlers/webhookHandler";
import { SESService } from "../../destination/destinationHandlers/sesHandler";
import { SMTPService } from "../../destination/destinationHandlers/smtpHandler";
import { EVENT_TYPE } from "../../common/types";
import {SlackService} from "../../destination/destinationHandlers/slackHandler";
import {NotifmeSdk} from 'notifme-sdk'
import {CustomError, CustomResponse} from "../../entities/events";
import { Event, Handler, NotificationService } from "./notificationService";

/**
 * @deprecated This file contains deprecated notification functions that will be removed in a future version.
 * Please use sendNotificationV2 from notificationService.ts instead.
 */
export class NotificationServiceDeprecated extends NotificationService {
    /**
     * Main function to send notifications based on event type
     * @deprecated Please use sendNotificationV2 instead
     * @param event The event to send notifications for
     * @returns CustomResponse with status and message
     */
    public async sendNotification(event: Event): Promise<CustomResponse> {
        try {
            this.logger.info(`Processing notification for event type: ${event.eventTypeId}, correlationId: ${event.correlationId}`);

            // Handle approval notifications
            if (event.payload.providers && event.payload.providers.length > 0) {
                this.logger.info(`Processing approval notification with ${event.payload.providers.length} providers`);
                await this.sendApprovalNotification(event);
                this.logger.info(`Approval notification sent successfully`);
                return new CustomResponse("notification sent", 200);
            }

            // Handle scoop notification events
            if (event.eventTypeId == EVENT_TYPE.ScoopNotification) {
                this.logger.info(`Processing scoop notification event`);
                return await this.handleScoopNotification(event);
            }

            // Handle regular notifications
            this.logger.info(`Processing regular notification event`);
            return await this.handleRegularNotification(event);
        } catch (error: any) {
            const errorMessage = error.message || 'Unknown error';
            const errorStack = error.stack || '';
            this.logger.error(`Error in sendNotification: ${errorMessage}\nStack: ${errorStack}`);

            if (error instanceof CustomError) {
                this.logger.error(`CustomError with status code: ${error.statusCode}`);
                return new CustomResponse("", 0, error);
            } else {
                const customError = new CustomError(errorMessage, 400);
                this.logger.error(`Converted to CustomError with status code: 400`);
                return new CustomResponse("", 0, customError);
            }
        }
    }

    /**
     * Handle regular notification events
     * @deprecated This is a helper function for the deprecated sendNotification method
     * @param event The regular notification event
     * @returns CustomResponse with status and message
     */
    protected async handleRegularNotification(event: Event): Promise<CustomResponse> {
        try {
            this.logger.info(`Handling regular notification for event ID: ${event.correlationId}, type: ${event.eventTypeId}`);

            // Validate event
            if (!this.isValidEvent(event)) {
                this.logger.error(`Invalid event: ${JSON.stringify({
                    eventTypeId: event.eventTypeId,
                    pipelineType: event.pipelineType,
                    correlationId: event.correlationId,
                    hasPayload: !!event.payload,
                    hasBaseUrl: !!event.baseUrl
                })}`);
                throw new CustomError("Event is not valid", 400);
            }
            this.logger.info(`Event validation passed`);

            // Get notification settings
            this.logger.info(`Finding notification settings for event: ${event.correlationId}`);
            const settingsResults = await this.findNotificationSettings(event);
            if (!settingsResults || settingsResults.length == 0) {
                this.logger.warn(`No notification settings found for event ${event.correlationId}`);
                return new CustomResponse("", 0, new CustomError("no notification settings found for event", 404));
            }
            this.logger.info(`Found ${settingsResults.length} notification settings`);

            // Process notification settings
            this.logger.info(`Preparing notification maps`);
            const { destinationMap, configsMap } = this.prepareNotificationMaps(settingsResults);

            // Process each setting
            this.logger.info(`Processing ${settingsResults.length} notification settings`);
            for (let i = 0; i < settingsResults.length; i++) {
                const setting = settingsResults[i];
                this.logger.info(`Processing notification setting ${i+1}/${settingsResults.length}, ID: ${setting.id}`);
                const result = await this.processNotificationSetting(event, setting, configsMap, destinationMap);
                if (result.status === 0) {
                    this.logger.error(`Error processing notification setting: ${result.error?.message}`);
                    return result; // Return error if any
                }
            }

            this.logger.info(`All notifications processed successfully`);
            return new CustomResponse("notification sent", 200);
        } catch (error: any) {
            const errorMessage = error.message || 'Unknown error';
            this.logger.error(`Error in handleRegularNotification: ${errorMessage}`);
            if (error.stack) {
                this.logger.error(`Stack trace: ${error.stack}`);
            }
            throw error; // Let the parent function handle the error
        }
    }
}
