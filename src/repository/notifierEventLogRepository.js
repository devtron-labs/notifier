"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventLogRepository = void 0;
var notifierEventLogs_1 = require("../entities/notifierEventLogs");
var typeorm_1 = require("typeorm");
var EventLogRepository = /** @class */ (function () {
    function EventLogRepository() {
    }
    EventLogRepository.prototype.saveEventLog = function (eventLog) {
        return (0, typeorm_1.getManager)().getRepository(notifierEventLogs_1.NotifierEventLog).save(eventLog);
    };
    return EventLogRepository;
}());
exports.EventLogRepository = EventLogRepository;
