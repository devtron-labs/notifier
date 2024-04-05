"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventLogBuilder = void 0;
var EventLogBuilder = /** @class */ (function () {
    function EventLogBuilder() {
    }
    EventLogBuilder.prototype.buildEventLog = function (event, destination, sentStatus, setting) {
        var notifierEventLog = {
            destination: destination,
            source_id: setting.pipeline_id,
            pipeline_type: setting.pipeline_type ? setting.pipeline_type : "NA", //This is optional as approval event doesn't have pipeline_type
            event_type_id: setting.event_type_id,
            correlation_id: event.correlationId,
            payload: event.payload,
            is_notification_sent: sentStatus,
            event_time: event.eventTime,
            created_at: new Date()
        };
        return notifierEventLog;
    };
    return EventLogBuilder;
}());
exports.EventLogBuilder = EventLogBuilder;
