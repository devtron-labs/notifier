"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventRepository = void 0;
var typeorm_1 = require("typeorm");
var events_1 = require("../entities/events");
var EventRepository = /** @class */ (function () {
    function EventRepository() {
    }
    EventRepository.prototype.findById = function (id) {
        return (0, typeorm_1.getManager)().getRepository(events_1.Event).find({ where: { id: id } });
    };
    EventRepository.prototype.findByName = function (name) {
        return (0, typeorm_1.getManager)().getRepository(events_1.Event).find({ where: { event_type: name } });
    };
    return EventRepository;
}());
exports.EventRepository = EventRepository;
