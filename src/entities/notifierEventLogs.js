"use strict";
var __esDecorate = (this && this.__esDecorate) || function (ctor, descriptorIn, decorators, contextIn, initializers, extraInitializers) {
    function accept(f) { if (f !== void 0 && typeof f !== "function") throw new TypeError("Function expected"); return f; }
    var kind = contextIn.kind, key = kind === "getter" ? "get" : kind === "setter" ? "set" : "value";
    var target = !descriptorIn && ctor ? contextIn["static"] ? ctor : ctor.prototype : null;
    var descriptor = descriptorIn || (target ? Object.getOwnPropertyDescriptor(target, contextIn.name) : {});
    var _, done = false;
    for (var i = decorators.length - 1; i >= 0; i--) {
        var context = {};
        for (var p in contextIn) context[p] = p === "access" ? {} : contextIn[p];
        for (var p in contextIn.access) context.access[p] = contextIn.access[p];
        context.addInitializer = function (f) { if (done) throw new TypeError("Cannot add initializers after decoration has completed"); extraInitializers.push(accept(f || null)); };
        var result = (0, decorators[i])(kind === "accessor" ? { get: descriptor.get, set: descriptor.set } : descriptor[key], context);
        if (kind === "accessor") {
            if (result === void 0) continue;
            if (result === null || typeof result !== "object") throw new TypeError("Object expected");
            if (_ = accept(result.get)) descriptor.get = _;
            if (_ = accept(result.set)) descriptor.set = _;
            if (_ = accept(result.init)) initializers.unshift(_);
        }
        else if (_ = accept(result)) {
            if (kind === "field") initializers.unshift(_);
            else descriptor[key] = _;
        }
    }
    if (target) Object.defineProperty(target, contextIn.name, descriptor);
    done = true;
};
var __runInitializers = (this && this.__runInitializers) || function (thisArg, initializers, value) {
    var useValue = arguments.length > 2;
    for (var i = 0; i < initializers.length; i++) {
        value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
    }
    return useValue ? value : void 0;
};
var __setFunctionName = (this && this.__setFunctionName) || function (f, name, prefix) {
    if (typeof name === "symbol") name = name.description ? "[".concat(name.description, "]") : "";
    return Object.defineProperty(f, "name", { configurable: true, value: prefix ? "".concat(prefix, " ", name) : name });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotifierEventLog = void 0;
var typeorm_1 = require("typeorm");
var NotifierEventLog = function () {
    var _classDecorators = [(0, typeorm_1.Entity)("notifier_event_log")];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var _instanceExtraInitializers = [];
    var _id_decorators;
    var _id_initializers = [];
    var _destination_decorators;
    var _destination_initializers = [];
    var _source_id_decorators;
    var _source_id_initializers = [];
    var _pipeline_type_decorators;
    var _pipeline_type_initializers = [];
    var _event_type_id_decorators;
    var _event_type_id_initializers = [];
    var _correlation_id_decorators;
    var _correlation_id_initializers = [];
    var _payload_decorators;
    var _payload_initializers = [];
    var _is_notification_sent_decorators;
    var _is_notification_sent_initializers = [];
    var _event_time_decorators;
    var _event_time_initializers = [];
    var _created_at_decorators;
    var _created_at_initializers = [];
    var NotifierEventLog = _classThis = /** @class */ (function () {
        function NotifierEventLog_1() {
            this.id = (__runInitializers(this, _instanceExtraInitializers), __runInitializers(this, _id_initializers, void 0));
            this.destination = __runInitializers(this, _destination_initializers, void 0);
            this.source_id = __runInitializers(this, _source_id_initializers, void 0);
            this.pipeline_type = __runInitializers(this, _pipeline_type_initializers, void 0);
            this.event_type_id = __runInitializers(this, _event_type_id_initializers, void 0);
            this.correlation_id = __runInitializers(this, _correlation_id_initializers, void 0);
            this.payload = __runInitializers(this, _payload_initializers, void 0);
            this.is_notification_sent = __runInitializers(this, _is_notification_sent_initializers, void 0);
            this.event_time = __runInitializers(this, _event_time_initializers, void 0);
            this.created_at = __runInitializers(this, _created_at_initializers, void 0);
        }
        return NotifierEventLog_1;
    }());
    __setFunctionName(_classThis, "NotifierEventLog");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        _id_decorators = [(0, typeorm_1.PrimaryGeneratedColumn)()];
        _destination_decorators = [(0, typeorm_1.Column)()];
        _source_id_decorators = [(0, typeorm_1.Column)()];
        _pipeline_type_decorators = [(0, typeorm_1.Column)()];
        _event_type_id_decorators = [(0, typeorm_1.Column)()];
        _correlation_id_decorators = [(0, typeorm_1.Column)()];
        _payload_decorators = [(0, typeorm_1.Column)()];
        _is_notification_sent_decorators = [(0, typeorm_1.Column)()];
        _event_time_decorators = [(0, typeorm_1.Column)({ type: 'timestamptz' })];
        _created_at_decorators = [(0, typeorm_1.Column)({ type: 'timestamptz' })];
        __esDecorate(null, null, _id_decorators, { kind: "field", name: "id", static: false, private: false, access: { has: function (obj) { return "id" in obj; }, get: function (obj) { return obj.id; }, set: function (obj, value) { obj.id = value; } }, metadata: _metadata }, _id_initializers, _instanceExtraInitializers);
        __esDecorate(null, null, _destination_decorators, { kind: "field", name: "destination", static: false, private: false, access: { has: function (obj) { return "destination" in obj; }, get: function (obj) { return obj.destination; }, set: function (obj, value) { obj.destination = value; } }, metadata: _metadata }, _destination_initializers, _instanceExtraInitializers);
        __esDecorate(null, null, _source_id_decorators, { kind: "field", name: "source_id", static: false, private: false, access: { has: function (obj) { return "source_id" in obj; }, get: function (obj) { return obj.source_id; }, set: function (obj, value) { obj.source_id = value; } }, metadata: _metadata }, _source_id_initializers, _instanceExtraInitializers);
        __esDecorate(null, null, _pipeline_type_decorators, { kind: "field", name: "pipeline_type", static: false, private: false, access: { has: function (obj) { return "pipeline_type" in obj; }, get: function (obj) { return obj.pipeline_type; }, set: function (obj, value) { obj.pipeline_type = value; } }, metadata: _metadata }, _pipeline_type_initializers, _instanceExtraInitializers);
        __esDecorate(null, null, _event_type_id_decorators, { kind: "field", name: "event_type_id", static: false, private: false, access: { has: function (obj) { return "event_type_id" in obj; }, get: function (obj) { return obj.event_type_id; }, set: function (obj, value) { obj.event_type_id = value; } }, metadata: _metadata }, _event_type_id_initializers, _instanceExtraInitializers);
        __esDecorate(null, null, _correlation_id_decorators, { kind: "field", name: "correlation_id", static: false, private: false, access: { has: function (obj) { return "correlation_id" in obj; }, get: function (obj) { return obj.correlation_id; }, set: function (obj, value) { obj.correlation_id = value; } }, metadata: _metadata }, _correlation_id_initializers, _instanceExtraInitializers);
        __esDecorate(null, null, _payload_decorators, { kind: "field", name: "payload", static: false, private: false, access: { has: function (obj) { return "payload" in obj; }, get: function (obj) { return obj.payload; }, set: function (obj, value) { obj.payload = value; } }, metadata: _metadata }, _payload_initializers, _instanceExtraInitializers);
        __esDecorate(null, null, _is_notification_sent_decorators, { kind: "field", name: "is_notification_sent", static: false, private: false, access: { has: function (obj) { return "is_notification_sent" in obj; }, get: function (obj) { return obj.is_notification_sent; }, set: function (obj, value) { obj.is_notification_sent = value; } }, metadata: _metadata }, _is_notification_sent_initializers, _instanceExtraInitializers);
        __esDecorate(null, null, _event_time_decorators, { kind: "field", name: "event_time", static: false, private: false, access: { has: function (obj) { return "event_time" in obj; }, get: function (obj) { return obj.event_time; }, set: function (obj, value) { obj.event_time = value; } }, metadata: _metadata }, _event_time_initializers, _instanceExtraInitializers);
        __esDecorate(null, null, _created_at_decorators, { kind: "field", name: "created_at", static: false, private: false, access: { has: function (obj) { return "created_at" in obj; }, get: function (obj) { return obj.created_at; }, set: function (obj, value) { obj.created_at = value; } }, metadata: _metadata }, _created_at_initializers, _instanceExtraInitializers);
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        NotifierEventLog = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return NotifierEventLog = _classThis;
}();
exports.NotifierEventLog = NotifierEventLog;
