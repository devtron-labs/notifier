"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
exports.SESService = void 0;
var notifme_sdk_1 = require("notifme-sdk");
var mustache_1 = require("mustache");
var json_rules_engine_1 = require("json-rules-engine");
//https://github.com/notifme/notifme-sdk/blob/master/src/models/notification-request.js#L132
var SESService = /** @class */ (function () {
    function SESService(eventLogRepository, eventLogBuilder, sesConfigRepository, usersRepository, logger, mh) {
        this.eventLogRepository = eventLogRepository;
        this.eventLogBuilder = eventLogBuilder;
        this.sesConfigRepository = sesConfigRepository;
        this.usersRepository = usersRepository;
        this.logger = logger;
        this.mh = mh;
    }
    SESService.prototype.handle = function (event, templates, setting, configsMap, destinationMap) {
        var sesTemplate = templates.find(function (t) {
            return 'ses' == t.channel_type;
        });
        if (!sesTemplate) {
            this.logger.info("no ses template");
            return;
        }
        var providerObjects = setting.config;
        var providersSet = new Set(providerObjects);
        this.sesConfig = null;
        for (var _i = 0, providersSet_1 = providersSet; _i < providersSet_1.length; _i++) {
            var element = providersSet_1[_i];
            if (element['dest'] === "ses") {
                this.getDefaultConfig(providersSet, event, sesTemplate, setting, destinationMap, configsMap);
                break;
            }
        }
        return true;
    };
    SESService.prototype.getDefaultConfig = function (providersSet, event, sesTemplate, setting, emailMap, configsMap) {
        return __awaiter(this, void 0, void 0, function () {
            var config, error_1;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.sesConfigRepository.findDefaultSESConfig()];
                    case 1:
                        config = _a.sent();
                        this.sesConfig = {
                            region: config['region'],
                            access_key: config['access_key'],
                            secret_access_key: config['secret_access_key'],
                            from_email: config['from_email']
                        };
                        if (this.sesConfig && this.sesConfig.from_email) {
                            providersSet.forEach(function (p) {
                                if (p['dest'] == "ses") {
                                    var userId = p['configId'];
                                    var recipient = p['recipient'];
                                    var configKey = '';
                                    if (recipient) {
                                        configKey = p['dest'] + '-' + recipient;
                                    }
                                    else {
                                        configKey = p['dest'] + '-' + userId;
                                    }
                                    if (!configsMap.get(configKey)) {
                                        _this.processNotification(userId, recipient, event, sesTemplate, setting, p, emailMap);
                                        configsMap.set(configKey, true);
                                    }
                                }
                            });
                        }
                        return [3 /*break*/, 3];
                    case 2:
                        error_1 = _a.sent();
                        this.logger.error('getDefaultConfig', error_1);
                        throw new Error('Unable to get default SES config');
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    SESService.prototype.preparePaylodAndSend = function (event, sesTemplate, setting, p) {
        var _this = this;
        var sdk = new notifme_sdk_1.default({
            channels: {
                email: {
                    providers: [{
                            type: 'ses',
                            region: this.sesConfig['region'],
                            accessKeyId: this.sesConfig['access_key'],
                            secretAccessKey: this.sesConfig['secret_access_key'],
                            //sessionToken: config['session_token'] // optional
                        }]
                }
            }
        });
        event.payload['fromEmail'] = this.sesConfig['from_email'];
        var engine = new json_rules_engine_1.default();
        // let options = { allowUndefinedFacts: true }
        var conditions = p['rule']['conditions'];
        if (conditions) {
            engine.addRule({ conditions: conditions, event: event });
            engine.run(event).then(function (e) {
                _this.sendNotification(event, sdk, sesTemplate.template_payload).then(function (result) {
                    _this.saveNotificationEventSuccessLog(result, event, p, setting);
                }).catch(function (error) {
                    _this.logger.error(error.message);
                    _this.saveNotificationEventFailureLog(event, p, setting);
                });
            });
        }
        else {
            this.sendNotification(event, sdk, sesTemplate.template_payload).then(function (result) {
                _this.saveNotificationEventSuccessLog(result, event, p, setting);
            }).catch(function (error) {
                _this.logger.error(error.message);
                _this.saveNotificationEventFailureLog(event, p, setting);
            });
        }
    };
    SESService.prototype.processNotification = function (userId, recipient, event, sesTemplate, setting, p, emailMap) {
        var _this = this;
        if (userId) {
            this.usersRepository.findByUserId(userId).then(function (user) {
                if (!user) {
                    _this.logger.info('no user found for id - ' + userId);
                    _this.logger.info(event.correlationId);
                    return;
                }
                _this.sendEmailIfNotDuplicate(user['email_id'], event, sesTemplate, setting, p, emailMap);
            });
        }
        else {
            if (!recipient) {
                this.logger.error('recipient is blank');
                return;
            }
            this.sendEmailIfNotDuplicate(recipient, event, sesTemplate, setting, p, emailMap);
        }
    };
    SESService.prototype.sendEmailIfNotDuplicate = function (recipient, event, sesTemplate, setting, p, emailMap) {
        if (!emailMap.get(recipient)) {
            emailMap.set(recipient, true);
            event.payload['toEmail'] = recipient;
            this.preparePaylodAndSend(event, sesTemplate, setting, p);
        }
        else {
            this.logger.info('duplicate email filtered out');
        }
    };
    SESService.prototype.sendNotification = function (event, sdk, template) {
        return __awaiter(this, void 0, void 0, function () {
            var parsedEvent, json, commentDisplayStyle, tagDisplayStyle, commentDisplayStyle, res, error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        parsedEvent = this.mh.parseEvent(event);
                        parsedEvent['fromEmail'] = event.payload['fromEmail'];
                        parsedEvent['toEmail'] = event.payload['toEmail'];
                        json = void 0;
                        if (event.eventTypeId === 4) {
                            commentDisplayStyle = (event.payload.imageComment === "") ? 'none' : 'inline';
                            tagDisplayStyle = (event.payload.imageTagNames === null) ? 'none' : 'inline';
                            json = mustache_1.default.render(template, __assign(__assign({}, parsedEvent), { commentDisplayStyle: commentDisplayStyle, tagDisplayStyle: tagDisplayStyle }));
                        }
                        else if (event.eventTypeId === 5) {
                            commentDisplayStyle = (event.payload.protectConfigComment === "") ? 'none' : 'inline';
                            json = mustache_1.default.render(template, __assign(__assign({}, parsedEvent), { commentDisplayStyle: commentDisplayStyle }));
                        }
                        else {
                            json = mustache_1.default.render(template, parsedEvent);
                        }
                        return [4 /*yield*/, sdk.send({
                                email: JSON.parse(json)
                            })];
                    case 1:
                        res = _a.sent();
                        this.logger.info('Notification send');
                        this.logger.info(json);
                        return [2 /*return*/, res];
                    case 2:
                        error_2 = _a.sent();
                        this.logger.error('ses sendNotification error', error_2);
                        throw new Error('Unable to send ses notification');
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    SESService.prototype.saveNotificationEventSuccessLog = function (result, event, p, setting) {
        if (result["status"] == "error") {
            this.saveNotificationEventFailureLog(event, p, setting);
        }
        else {
            var eventLog = this.eventLogBuilder.buildEventLog(event, p.dest, true, setting);
            this.eventLogRepository.saveEventLog(eventLog);
        }
    };
    SESService.prototype.saveNotificationEventFailureLog = function (event, p, setting) {
        var eventLog = this.eventLogBuilder.buildEventLog(event, p.dest, false, setting);
        this.eventLogRepository.saveEventLog(eventLog);
    };
    return SESService;
}());
exports.SESService = SESService;
