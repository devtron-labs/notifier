"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebhookConfigRepository = void 0;
var typeorm_1 = require("typeorm");
var webhookconfig_1 = require("../entities/webhookconfig");
var WebhookConfigRepository = /** @class */ (function () {
    function WebhookConfigRepository() {
    }
    WebhookConfigRepository.prototype.findByWebhookConfigId = function (webhookConfigId) {
        return (0, typeorm_1.getManager)().getRepository(webhookconfig_1.WebhookConfig).findOne({ where: { id: webhookConfigId } });
    };
    return WebhookConfigRepository;
}());
exports.WebhookConfigRepository = WebhookConfigRepository;
