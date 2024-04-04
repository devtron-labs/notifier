"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SMTPConfigRepository = void 0;
var typeorm_1 = require("typeorm");
var smtpConfig_1 = require("../entities/smtpConfig");
var SMTPConfigRepository = /** @class */ (function () {
    function SMTPConfigRepository() {
    }
    SMTPConfigRepository.prototype.findBySMTPConfigId = function (id) {
        return (0, typeorm_1.getManager)().getRepository(smtpConfig_1.SMTPConfig).findOne({ where: { id: id } });
    };
    SMTPConfigRepository.prototype.findDefaultSMTPConfig = function () {
        return (0, typeorm_1.getManager)().getRepository(smtpConfig_1.SMTPConfig).findOne({ where: { default: 'true', deleted: false } });
    };
    return SMTPConfigRepository;
}());
exports.SMTPConfigRepository = SMTPConfigRepository;
