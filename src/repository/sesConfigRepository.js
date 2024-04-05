"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SESConfigRepository = void 0;
var typeorm_1 = require("typeorm");
var sesConfig_1 = require("../entities/sesConfig");
var SESConfigRepository = /** @class */ (function () {
    function SESConfigRepository() {
    }
    SESConfigRepository.prototype.findBySESConfigId = function (id) {
        return (0, typeorm_1.getManager)().getRepository(sesConfig_1.SesConfig).findOne({ where: { id: id } });
    };
    SESConfigRepository.prototype.findDefaultSESConfig = function () {
        return (0, typeorm_1.getManager)().getRepository(sesConfig_1.SesConfig).findOne({ where: { default: 'true', deleted: false } });
    };
    return SESConfigRepository;
}());
exports.SESConfigRepository = SESConfigRepository;
