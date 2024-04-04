"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Event = exports.NotificationService = void 0;
var templatesRepository_1 = require("../../repository/templatesRepository");
var notificationSettings_1 = require("../../entities/notificationSettings");
var webhookHandler_1 = require("../../destination/destinationHandlers/webhookHandler");
var sesHandler_1 = require("../../destination/destinationHandlers/sesHandler");
var smtpHandler_1 = require("../../destination/destinationHandlers/smtpHandler");
var NotificationService = /** @class */ (function () {
    function NotificationService(eventRepository, notificationSettingsRepository, templatesRepository, handlers, logger) {
        this.eventRepository = eventRepository;
        this.notificationSettingsRepository = notificationSettingsRepository;
        this.handlers = handlers;
        this.templatesRepository = templatesRepository;
        this.logger = logger;
    }
    NotificationService.prototype.sendApprovalNotificaton = function (event) {
        var _this = this;
        if (!this.isValidEventForApproval(event)) {
            return;
        }
        this.logger.info('notificationSettingsRepository.findByEventSource');
        if (!event.payload.providers || event.payload.providers == 0) {
            this.logger.info("no notification settings found for event " + event.correlationId);
            return;
        }
        var destinationMap = new Map();
        var configsMap = new Map();
        this.logger.info("notification settings ");
        this.logger.info(JSON.stringify(event.payload.providers));
        event.payload.providers.forEach(function (setting) {
            var providerObjects = setting;
            var id = providerObjects['dest'] + '-' + providerObjects['configId'];
            configsMap.set(id, false);
        });
        this.templatesRepository.findByEventTypeId(event.eventTypeId).then(function (templateResults) {
            if (!templateResults) {
                _this.logger.info("no templates found for event ", event);
                return;
            }
            var settings = new notificationSettings_1.NotificationSettings();
            settings.config = event.payload.providers;
            settings.pipeline_id = event.pipelineId;
            settings.event_type_id = event.eventTypeId;
            for (var _i = 0, _a = _this.handlers; _i < _a.length; _i++) {
                var h = _a[_i];
                if ((h instanceof sesHandler_1.SESService) || (h instanceof smtpHandler_1.SMTPService)) {
                    h.handle(event, templateResults, settings, configsMap, destinationMap);
                }
            }
        });
    };
    NotificationService.prototype.sendNotification = function (event) {
        var _this = this;
        if (event.payload.providers) {
            this.sendApprovalNotificaton(event);
            return;
        }
        if (!this.isValidEvent(event)) {
            return;
        }
        this.notificationSettingsRepository.findByEventSource(event.pipelineType, event.pipelineId, event.eventTypeId, event.appId, event.envId, event.teamId).then(function (settingsResults) {
            _this.logger.info('notificationSettingsRepository.findByEventSource');
            if (!settingsResults || settingsResults.length == 0) {
                _this.logger.info("no notification settings found for event " + event.correlationId);
                return;
            }
            var destinationMap = new Map();
            var configsMap = new Map();
            _this.logger.info("notification settings ");
            _this.logger.info(JSON.stringify(settingsResults));
            settingsResults.forEach(function (setting) {
                var providerObjects = setting.config;
                var providersSet = new Set(providerObjects);
                providersSet.forEach(function (p) {
                    var id = p['dest'] + '-' + p['configId'];
                    configsMap.set(id, false);
                });
            });
            settingsResults.forEach(function (setting) {
                var configArray = setting.config;
                if (Array.isArray(configArray)) {
                    var webhookConfig = configArray.filter(function (config) { return config.dest === 'webhook'; });
                    if (webhookConfig.length) {
                        var webhookConfigRepository_1 = new templatesRepository_1.WebhookConfigRepository();
                        webhookConfig.forEach(function (config) {
                            webhookConfigRepository_1.getAllWebhookConfigs().then(function (templateResults) {
                                var newTemplateResult = templateResults.filter(function (t) { return t.id === config.configId; });
                                if (newTemplateResult.length === 0) {
                                    _this.logger.info("no templates found for event ", event);
                                    return;
                                }
                                for (var _i = 0, _a = _this.handlers; _i < _a.length; _i++) {
                                    var h = _a[_i];
                                    if (h instanceof webhookHandler_1.WebhookService) {
                                        h.handle(event, newTemplateResult, setting, configsMap, destinationMap);
                                    }
                                }
                            });
                        });
                    }
                    if (configArray.length > webhookConfig.length) {
                        _this.templatesRepository.findByEventTypeIdAndNodeType(event.eventTypeId, event.pipelineType).then(function (templateResults) {
                            if (!templateResults) {
                                _this.logger.info("no templates found for event ", event);
                                return;
                            }
                            for (var _i = 0, _a = _this.handlers; _i < _a.length; _i++) {
                                var h = _a[_i];
                                h.handle(event, templateResults, setting, configsMap, destinationMap);
                            }
                        });
                    }
                }
            });
        }).catch(function (err) { return _this.logger.error("err" + err); });
    };
    NotificationService.prototype.isValidEvent = function (event) {
        if (event.eventTypeId && event.pipelineType && event.correlationId && event.payload && event.baseUrl)
            return true;
        return false;
    };
    NotificationService.prototype.isValidEventForApproval = function (event) {
        if (event.eventTypeId && event.correlationId && event.payload && event.baseUrl)
            return true;
        return false;
    };
    return NotificationService;
}());
exports.NotificationService = NotificationService;
var Event = /** @class */ (function () {
    function Event() {
    }
    return Event;
}());
exports.Event = Event;
