"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebhookService = void 0;
var mustache_1 = require("mustache");
var json_rules_engine_1 = require("json-rules-engine");
var axios_1 = require("axios");
var WebhookService = /** @class */ (function () {
    function WebhookService(eventLogRepository, eventLogBuilder, webhookConfigRepository, logger, mh) {
        this.eventLogRepository = eventLogRepository;
        this.eventLogBuilder = eventLogBuilder;
        this.webhookConfigRepository = webhookConfigRepository;
        this.logger = logger;
        this.mh = mh;
    }
    WebhookService.prototype.handle = function (event, templates, setting, configsMap, destinationMap) {
        var _this = this;
        var webhookTemplate = templates.find(function (t) {
            return t;
        });
        if (!webhookTemplate) {
            this.logger.info("no webhook template");
            return;
        }
        var providerObjects = setting.config;
        var providersSet = new Set(providerObjects);
        providersSet.forEach(function (p) {
            if (p['dest'] == "webhook" && p['configId'] == webhookTemplate.id) {
                var webhookConfigId = p['configId'];
                var configKey = p['dest'] + '-' + webhookConfigId;
                if (!configsMap.get(configKey)) {
                    _this.processNotification(webhookConfigId, event, webhookTemplate, setting, p, destinationMap);
                    configsMap.set(configKey, true);
                }
            }
        });
        return true;
    };
    WebhookService.prototype.sendAndLogNotification = function (event, webhookTemplate, setting, p) {
        var _this = this;
        this.sendNotification(event, webhookTemplate.web_hook_url, JSON.stringify(webhookTemplate.payload), webhookTemplate.header).then(function (result) {
            _this.saveNotificationEventSuccessLog(result, event, p, setting);
        }).catch(function (error) {
            _this.logger.error(error.message);
            _this.saveNotificationEventFailureLog(event, p, setting);
        });
    };
    WebhookService.prototype.processNotification = function (webhookConfigId, event, webhookTemplate, setting, p, webhookMap) {
        var _this = this;
        this.webhookConfigRepository.findByWebhookConfigId(webhookConfigId).then(function (config) {
            if (!config) {
                _this.logger.info('no webhook config found for event');
                _this.logger.info(event.correlationId);
                return;
            }
            if (!webhookMap.get(config['web_hook_url'])) {
                webhookMap.set(config['web_hook_url'], true);
            }
            else {
                _this.logger.info('duplicate webHook filtered out');
                return;
            }
            var engine = new json_rules_engine_1.default();
            var conditions = p['rule']['conditions'];
            if (conditions) {
                engine.addRule({ conditions: conditions, event: event });
                engine.run(event).then(function (e) {
                    _this.sendAndLogNotification(event, webhookTemplate, setting, p);
                });
            }
            else {
                _this.sendAndLogNotification(event, webhookTemplate, setting, p);
            }
        });
    };
    WebhookService.prototype.sendNotification = function (event, webhookUrl, template, headers) {
        return __awaiter(this, void 0, void 0, function () {
            var parsedEvent, jsons, j, headerConfig, res, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        parsedEvent = this.mh.parseEventForWebhook(event);
                        jsons = mustache_1.default.render(template, parsedEvent);
                        j = JSON.parse(jsons);
                        headerConfig = { headers: {} };
                        if (headers) {
                            headerConfig.headers = headers;
                        }
                        return [4 /*yield*/, axios_1.default.post(webhookUrl, j, headerConfig)];
                    case 1:
                        res = _a.sent();
                        this.logger.info("Notification Sent Successfully");
                        console.log(res.data);
                        return [2 /*return*/, res.data];
                    case 2:
                        error_1 = _a.sent();
                        this.logger.error("webhook sendNotification error", error_1);
                        throw new Error("Unable to send notification");
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    WebhookService.prototype.saveNotificationEventSuccessLog = function (result, event, p, setting) {
        if (result["status"] == "error") {
            this.saveNotificationEventFailureLog(event, p, setting);
        }
        else {
            var eventLog = this.eventLogBuilder.buildEventLog(event, p.dest, true, setting);
            this.eventLogRepository.saveEventLog(eventLog);
        }
    };
    WebhookService.prototype.saveNotificationEventFailureLog = function (event, p, setting) {
        var eventLog = this.eventLogBuilder.buildEventLog(event, p.dest, false, setting);
        this.eventLogRepository.saveEventLog(eventLog);
    };
    return WebhookService;
}());
exports.WebhookService = WebhookService;
