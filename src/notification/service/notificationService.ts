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

export interface Handler {
    handle(event: Event, templates: (NotificationTemplates[] | WebhookConfig[]), setting: NotificationSettings, configMap: Map<string, boolean>, destinationMap: Map<string, boolean>): Promise<boolean>
    sendNotification(event: Event, sdk: any, template: string)
}

class NotificationService {
    private eventRepository: EventRepository
    private templatesRepository: NotificationTemplatesRepository
    private readonly handlers: Handler[]
    private logger: any

    constructor(eventRepository: EventRepository, templatesRepository: NotificationTemplatesRepository, handlers: Handler[], logger: any) {
        this.eventRepository = eventRepository
        this.handlers = handlers
        this.templatesRepository = templatesRepository
        this.logger = logger
    }
    public async sendApprovalNotification(event:Event){
        try {
            if (!this.isValidEventForApproval(event)) {
                throw new CustomError("Event is not valid for approval ", 400)
            }

            this.logger.info('notificationSettingsRepository.findByEventSource')
            if (!event.payload.providers || event.payload.providers == 0) {
                this.logger.info("no notification settings found for event " + event.correlationId);
                throw new CustomError("no notification settings found for event", 400)
            }
            let destinationMap = new Map();
            let configsMap = new Map();
            this.logger.info("notification settings ");
            this.logger.info(JSON.stringify(event.payload.providers))
            event.payload.providers.forEach((setting) => {
                const providerObjects = setting
                let id = providerObjects['dest'] + '-' + providerObjects['configId']
                configsMap.set(id, false)
            });


            try {
                const templateResults: NotificationTemplates[] = await this.templatesRepository.findByEventTypeId(event.eventTypeId)
                if (!templateResults) {
                    this.logger.info("no templates found for event ", event);
                    throw new CustomError("no templates found for event", 404)
                }
                let settings = new NotificationSettings()
                settings.config = event.payload.providers
                settings.pipeline_id = event.pipelineId
                settings.event_type_id = event.eventTypeId
                for (let h of this.handlers) {
                    if ((h instanceof SESService) || (h instanceof SMTPService)) {
                        await h.handle(event, templateResults, settings, configsMap, destinationMap)
                    }
                }}
            catch(err) {
                this.logger.error("err" + err)
            }
        } catch(e:any) {
            throw e instanceof CustomError?e:new CustomError(e.message,400)
        }
    }

    // this function is used to send webhook notification for scoop notification event type
    private async sendWebhookNotification(event: Event) {
        for (const h of this.handlers) {
            if (h instanceof WebhookService){
                let setting = new NotificationSettings()
                setting.event_type_id = event.eventTypeId
                setting.pipeline_id = 0
                setting.config = event.payload
                await h.sendAndLogNotification(event, event.payload.scoopNotificationConfig.webhookConfig as WebhookConfig, setting, {"dest": "webhook"})
            }
        }
    }

    // this function is used to send slack notification for scoop notification event type
    private async sendSlackNotification(event: Event) {
        for (const h of this.handlers) {
            if (h instanceof SlackService){
                const templateResults: NotificationTemplates[] = await this.templatesRepository.findByEventTypeIdAndChannelType(event.eventTypeId, "slack")
                    if (!templateResults) {
                        this.logger.info("no templates found for event ", event);
                        return
                    }

                    const slackTemplateConfig = templateResults[0]
                    let sdk: NotifmeSdk = new NotifmeSdk({
                        channels: {
                            slack: {
                                providers: [{
                                    type: 'webhook',
                                    webhookUrl: event.payload.scoopNotificationConfig.slackConfig.webhookUrl
                                }]
                            }
                        }
                    });

                    let setting = new NotificationSettings()
                    setting.event_type_id = event.eventTypeId
                    setting.pipeline_id = 0
                    setting.config = event.payload
                    await h.sendAndLogNotification(event, sdk,setting,{"dest": "slack"}, slackTemplateConfig)
                }
            }
        }



    /**
     * Enhanced function to send notifications with pre-provided notification settings
     * @param event The event to send notifications for
     * @param notificationSettings The pre-provided notification settings
     * @returns CustomResponse with status and message
     */
    public async sendNotificationV2(event: Event, notificationSettings: NotificationSettings[]): Promise<CustomResponse> {
        try {
            this.logger.info(`Processing notification V2 for event type: ${event.eventTypeId}, correlationId: ${event.correlationId}`);
            this.logger.info(`Using ${notificationSettings.length} pre-provided notification settings`);

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

            // Check if notification settings are provided
            if (!notificationSettings || notificationSettings.length === 0) {
                this.logger.warn(`No notification settings provided for event ${event.correlationId}`);
                return new CustomResponse("", 0, new CustomError("no notification settings provided", 400));
            }
            this.logger.info(`Found ${notificationSettings.length} notification settings`);

            // Process notification settings
            this.logger.info(`Preparing notification maps`);
            const { destinationMap, configsMap } = this.prepareNotificationMaps(notificationSettings);

            // Process each setting
            this.logger.info(`Processing ${notificationSettings.length} notification settings`);
            for (let i = 0; i < notificationSettings.length; i++) {
                const setting = notificationSettings[i];
                this.logger.info(`Processing notification setting ${i+1}/${notificationSettings.length}, ID: ${setting.id}`);
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
            const errorStack = error.stack || '';
            this.logger.error(`Error in sendNotificationV2: ${errorMessage}\nStack: ${errorStack}`);

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
     * Handle scoop notification events (webhook or slack)
     * @param event The scoop notification event
     * @returns CustomResponse with status and message
     */
    private async handleScoopNotification(event: Event): Promise<CustomResponse> {
        try {
            this.logger.info(`Handling scoop notification for event ID: ${event.correlationId}`);

            // Check webhook for scoop notification event type
            if (event.payload.scoopNotificationConfig.webhookConfig) {
                this.logger.info(`Found webhook config in scoop notification, processing...`);
                await this.sendWebhookNotification(event);
                this.logger.info(`Webhook notification sent successfully`);
                return new CustomResponse("notification sent", 200);
            }

            // Check slack for scoop notification event type
            if (event.payload.scoopNotificationConfig.slackConfig) {
                this.logger.info(`Found slack config in scoop notification, processing...`);
                await this.sendSlackNotification(event);
                this.logger.info(`Slack notification sent successfully`);
                return new CustomResponse("notification sent", 200);
            }

            this.logger.error(`No valid webhook or slack configuration found in scoop notification`);
            return new CustomResponse("", 0, new CustomError("No valid notification configuration found for scoop notification", 400));
        } catch (error: any) {
            const errorMessage = error.message || 'Unknown error';
            this.logger.error(`Error in handleScoopNotification: ${errorMessage}`);
            if (error.stack) {
                this.logger.error(`Stack trace: ${error.stack}`);
            }
            throw error; // Let the parent function handle the error
        }
    }


    /**
     * Prepare notification maps for tracking destinations and configs
     * @param settingsResults The notification settings
     * @returns Object containing destinationMap and configsMap
     */
    private prepareNotificationMaps(settingsResults: NotificationSettings[]): { destinationMap: Map<string, boolean>, configsMap: Map<string, boolean> } {
        try {
            this.logger.info(`Preparing notification maps for ${settingsResults.length} settings`);
            let destinationMap = new Map<string, boolean>();
            let configsMap = new Map<string, boolean>();

            // Log settings at debug level to avoid excessive logging in production
            if (this.logger.level === 'debug') {
                this.logger.debug(`Notification settings details: ${JSON.stringify(settingsResults)}`);
            } else {
                this.logger.info(`Processing ${settingsResults.length} notification settings (set log level to debug for details)`);
            }

            let configCount = 0;
            settingsResults.forEach((setting, index) => {
                this.logger.info(`Processing setting ${index+1}/${settingsResults.length}, ID: ${setting.id}`);
                const providerObjects = setting.config;

                if (!providerObjects) {
                    this.logger.warn(`No provider objects found in setting ID: ${setting.id}`);
                    return;
                }

                const providersSet = new Set(providerObjects);
                this.logger.info(`Found ${providersSet.size} unique providers in setting ID: ${setting.id}`);

                providersSet.forEach(p => {
                    if (!p['dest'] || !p['configId']) {
                        this.logger.warn(`Invalid provider found: ${JSON.stringify(p)}`);
                        return;
                    }

                    let id = p['dest'] + '-' + p['configId'];
                    configsMap.set(id, false);
                    configCount++;
                    this.logger.info(`Added config to map: ${id}`);
                });
            });

            this.logger.info(`Notification maps prepared with ${configCount} total configs`);
            return { destinationMap, configsMap };
        } catch (error: any) {
            const errorMessage = error.message || 'Unknown error';
            this.logger.error(`Error in prepareNotificationMaps: ${errorMessage}`);
            if (error.stack) {
                this.logger.error(`Stack trace: ${error.stack}`);
            }
            throw error; // Let the parent function handle the error
        }
    }

    /**
     * Process a single notification setting
     * @param event The event to process
     * @param setting The notification setting to process
     * @param configsMap Map of configs that have been processed
     * @param destinationMap Map of destinations that have been processed
     * @returns CustomResponse with status and message
     */
    private async processNotificationSetting(
        event: Event,
        setting: NotificationSettings,
        configsMap: Map<string, boolean>,
        destinationMap: Map<string, boolean>
    ): Promise<CustomResponse> {
        try {
            this.logger.info(`Processing notification setting ID: ${setting.id}, event type: ${setting.event_type_id}`);

            const configArray = setting.config as any;
            if (!Array.isArray(configArray)) {
                this.logger.warn(`Config is not an array for setting ID: ${setting.id}, skipping processing`);
                return new CustomResponse("notification sent", 200);
            }

            this.logger.info(`Found ${configArray.length} configurations in setting`);

            // Handle webhook configurations
            const webhookConfig = configArray.filter((config) => config.dest === 'webhook');
            if (webhookConfig.length) {
                this.logger.info(`Found ${webhookConfig.length} webhook configurations, processing...`);
                const result = await this.processWebhookConfigs(event, setting, webhookConfig, configsMap, destinationMap);
                if (result.status === 0) {
                    this.logger.error(`Error processing webhook configs: ${result.error?.message}`);
                    return result; // Return error if any
                }
                this.logger.info(`Webhook configurations processed successfully`);
            }

            // Handle other configurations if there are any
            if (configArray.length > webhookConfig.length) {
                const otherConfigsCount = configArray.length - webhookConfig.length;
                this.logger.info(`Found ${otherConfigsCount} non-webhook configurations, processing...`);
                const result = await this.processOtherConfigs(event, setting, configsMap, destinationMap);
                if (result.status === 0) {
                    this.logger.error(`Error processing other configs: ${result.error?.message}`);
                    return result; // Return error if any
                }
                this.logger.info(`Other configurations processed successfully`);
            }

            this.logger.info(`All configurations in setting ID: ${setting.id} processed successfully`);
            return new CustomResponse("notification sent", 200);
        } catch (error: any) {
            const errorMessage = error.message || 'Unknown error';
            this.logger.error(`Error in processNotificationSetting for setting ID ${setting.id}: ${errorMessage}`);
            if (error.stack) {
                this.logger.error(`Stack trace: ${error.stack}`);
            }
            throw error; // Let the parent function handle the error
        }
    }

    /**
     * Process webhook configurations
     * @param event The event to process
     * @param setting The notification setting
     * @param webhookConfig Array of webhook configurations
     * @param configsMap Map of configs that have been processed
     * @param destinationMap Map of destinations that have been processed
     * @returns CustomResponse with status and message
     */
    private async processWebhookConfigs(
        event: Event,
        setting: NotificationSettings,
        webhookConfig: any[],
        configsMap: Map<string, boolean>,
        destinationMap: Map<string, boolean>
    ): Promise<CustomResponse> {
        try {
            this.logger.info(`Processing ${webhookConfig.length} webhook configurations for event ID: ${event.correlationId}`);
            const webhookConfigRepository = new WebhookConfigRepository();

            for (let i = 0; i < webhookConfig.length; i++) {
                const config = webhookConfig[i];
                this.logger.info(`Processing webhook config ${i+1}/${webhookConfig.length}, configId: ${config.configId}`);

                this.logger.info(`Fetching webhook templates from repository`);
                const templateResults: WebhookConfig[] = await webhookConfigRepository.getAllWebhookConfigs();
                this.logger.info(`Found ${templateResults.length} webhook templates in repository`);

                const newTemplateResult = templateResults.filter((t) => t.id === config.configId);
                this.logger.info(`Filtered ${newTemplateResult.length} matching templates for configId: ${config.configId}`);

                if (newTemplateResult.length === 0) {
                    this.logger.error(`No templates found for event ${event.correlationId} with configId: ${config.configId}`);
                    return new CustomResponse("", 0, new CustomError("no templates found for event", 404));
                }

                this.logger.info(`Processing webhook handlers for configId: ${config.configId}`);
                await this.processWebhookHandlers(event, newTemplateResult, setting, configsMap, destinationMap);
                this.logger.info(`Webhook handlers processed successfully for configId: ${config.configId}`);
            }

            this.logger.info(`All webhook configurations processed successfully`);
            return new CustomResponse("notification sent", 200);
        } catch (error: any) {
            const errorMessage = error.message || 'Unknown error';
            this.logger.error(`Error in processWebhookConfigs: ${errorMessage}`);
            if (error.stack) {
                this.logger.error(`Stack trace: ${error.stack}`);
            }
            throw error; // Let the parent function handle the error
        }
    }

    /**
     * Process webhook handlers for an event
     * @param event The event to process
     * @param templates The webhook templates
     * @param setting The notification setting
     * @param configsMap Map of configs that have been processed
     * @param destinationMap Map of destinations that have been processed
     */
    private async processWebhookHandlers(
        event: Event,
        templates: WebhookConfig[],
        setting: NotificationSettings,
        configsMap: Map<string, boolean>,
        destinationMap: Map<string, boolean>
    ): Promise<void> {
        try {
            this.logger.info(`Processing webhook handlers for event ID: ${event.correlationId}, setting ID: ${setting.id}`);
            this.logger.info(`Using ${templates.length} webhook templates`);

            let imageScanEvent = JSON.parse(JSON.stringify(event));
            if (!!event.payload.imageScanExecutionInfo) {
                this.logger.info(`Event is an image scan event, preparing specialized payload for setting ID: ${setting.id}`);
                imageScanEvent.payload.imageScanExecutionInfo = JSON.parse(JSON.stringify(event.payload.imageScanExecutionInfo[setting.id] ?? {}));
            }

            let webhookHandlerFound = false;
            for (const h of this.handlers) {
                if (h instanceof WebhookService) {
                    webhookHandlerFound = true;
                    this.logger.info(`Found webhook handler, processing templates`);

                    if (event.eventTypeId === EVENT_TYPE.ImageScan && !!event.payload.imageScanExecutionInfo) {
                        this.logger.info(`Processing image scan event with specialized payload`);
                        await h.handle(imageScanEvent, templates, setting, configsMap, destinationMap);
                        this.logger.info(`Image scan event processed successfully`);
                    }

                    this.logger.info(`Processing regular webhook notification`);
                    await h.handle(event, templates, setting, configsMap, destinationMap);
                    this.logger.info(`Regular webhook notification processed successfully`);
                }
            }

            if (!webhookHandlerFound) {
                this.logger.warn(`No webhook handlers found for processing templates`);
            }

            this.logger.info(`Webhook handlers processing completed`);
        } catch (error: any) {
            const errorMessage = error.message || 'Unknown error';
            this.logger.error(`Error in processWebhookHandlers: ${errorMessage}`);
            if (error.stack) {
                this.logger.error(`Stack trace: ${error.stack}`);
            }
            throw error; // Let the parent function handle the error
        }
    }

    /**
     * Process other (non-webhook) configurations
     * @param event The event to process
     * @param setting The notification setting
     * @param configsMap Map of configs that have been processed
     * @param destinationMap Map of destinations that have been processed
     * @returns CustomResponse with status and message
     */
    private async processOtherConfigs(
        event: Event,
        setting: NotificationSettings,
        configsMap: Map<string, boolean>,
        destinationMap: Map<string, boolean>
    ): Promise<CustomResponse> {
        try {
            this.logger.info(`Processing other configurations for event ID: ${event.correlationId}, setting ID: ${setting.id}`);
            this.logger.info(`Finding templates for event type: ${event.eventTypeId}, pipeline type: ${event.pipelineType}`);

            const templateResults: NotificationTemplates[] = await this.templatesRepository.findByEventTypeIdAndNodeType(
                event.eventTypeId,
                event.pipelineType
            );

            if (!templateResults) {
                this.logger.error(`No templates found for event ${event.correlationId}, event type: ${event.eventTypeId}, pipeline type: ${event.pipelineType}`);
                return new CustomResponse("", 0, new CustomError("no templates found for event", 404));
            }

            this.logger.info(`Found ${templateResults.length} templates, processing with handlers`);

            let handlerCount = 0;
            for (let h of this.handlers) {
                handlerCount++;
                this.logger.info(`Processing with handler ${handlerCount}/${this.handlers.length}`);
                await h.handle(event, templateResults, setting, configsMap, destinationMap);
                this.logger.info(`Handler ${handlerCount} processed successfully`);
            }

            this.logger.info(`All handlers processed successfully for other configurations`);
            return new CustomResponse("notification sent", 200);
        } catch (error: any) {
            const errorMessage = error.message || 'Unknown error';
            this.logger.error(`Error in processOtherConfigs: ${errorMessage}`);
            if (error.stack) {
                this.logger.error(`Stack trace: ${error.stack}`);
            }
            throw error; // Let the parent function handle the error
        }
    }

    /**
     * Validate if an event has all required fields
     * @param event The event to validate
     * @returns boolean indicating if the event is valid
     */
    private isValidEvent(event: Event): boolean {
        try {
            // Check if it's a scoop notification event (special case)
            if (event.eventTypeId == EVENT_TYPE.ScoopNotification) {
                this.logger.info(`Event is a scoop notification, validation passed`);
                return true;
            }

            // Check required fields for regular events
            const missingFields = [];
            if (!event.eventTypeId) missingFields.push('eventTypeId');
            if (!event.pipelineType) missingFields.push('pipelineType');
            if (!event.correlationId) missingFields.push('correlationId');
            if (!event.payload) missingFields.push('payload');
            if (!event.baseUrl) missingFields.push('baseUrl');

            const isValid = missingFields.length === 0;

            if (!isValid) {
                this.logger.error(`Event validation failed, missing fields: ${missingFields.join(', ')}`);
            } else {
                this.logger.info(`Event validation passed, all required fields present`);
            }

            return isValid;
        } catch (error: any) {
            this.logger.error(`Error in isValidEvent: ${error.message || 'Unknown error'}`);
            return false;
        }
    }

    /**
     * Validate if an event has all required fields for approval
     * @param event The event to validate
     * @returns boolean indicating if the event is valid for approval
     */
    private isValidEventForApproval(event: Event): boolean {
        try {
            // Check if it's a scoop notification event (special case)
            if (event.eventTypeId == EVENT_TYPE.ScoopNotification && event.correlationId && event.payload) {
                this.logger.info(`Event is a scoop notification for approval, validation passed`);
                return true;
            }

            // Check required fields for regular approval events
            const missingFields = [];
            if (!event.eventTypeId) missingFields.push('eventTypeId');
            if (!event.correlationId) missingFields.push('correlationId');
            if (!event.payload) missingFields.push('payload');
            if (!event.baseUrl) missingFields.push('baseUrl');

            const isValid = missingFields.length === 0;

            if (!isValid) {
                this.logger.error(`Approval event validation failed, missing fields: ${missingFields.join(', ')}`);
            } else {
                this.logger.info(`Approval event validation passed, all required fields present`);
            }

            return isValid;
        } catch (error: any) {
            this.logger.error(`Error in isValidEventForApproval: ${error.message || 'Unknown error'}`);
            return false;
        }
    }
}

class Event {
    eventTypeId: number
    pipelineId: number
    pipelineType?: string
    correlationId?: number | string
    payload: any
    eventTime: string
    appId: number
    envId: number
    teamId: number
    clusterId: number
    isProdEnv: boolean
    baseUrl?: string
    envIdsForCiPipeline?: number[]
    isDeploymentDoneWithoutApproval?: boolean
}
export {NotificationService, Event}