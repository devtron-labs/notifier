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
exports.NotificationTemplates = void 0;
var typeorm_1 = require("typeorm");
var NotificationTemplates = function () {
    var _classDecorators = [(0, typeorm_1.Entity)("notification_templates")];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var _instanceExtraInitializers = [];
    var _id_decorators;
    var _id_initializers = [];
    var _channel_type_decorators;
    var _channel_type_initializers = [];
    var _node_type_decorators;
    var _node_type_initializers = [];
    var _event_type_id_decorators;
    var _event_type_id_initializers = [];
    var _template_name_decorators;
    var _template_name_initializers = [];
    var _template_payload_decorators;
    var _template_payload_initializers = [];
    var NotificationTemplates = _classThis = /** @class */ (function () {
        function NotificationTemplates_1() {
            this.id = (__runInitializers(this, _instanceExtraInitializers), __runInitializers(this, _id_initializers, void 0));
            this.channel_type = __runInitializers(this, _channel_type_initializers, void 0);
            this.node_type = __runInitializers(this, _node_type_initializers, void 0);
            this.event_type_id = __runInitializers(this, _event_type_id_initializers, void 0);
            this.template_name = __runInitializers(this, _template_name_initializers, void 0);
            this.template_payload = __runInitializers(this, _template_payload_initializers, void 0);
        }
        return NotificationTemplates_1;
    }());
    __setFunctionName(_classThis, "NotificationTemplates");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        _id_decorators = [(0, typeorm_1.PrimaryGeneratedColumn)()];
        _channel_type_decorators = [(0, typeorm_1.Column)()];
        _node_type_decorators = [(0, typeorm_1.Column)()];
        _event_type_id_decorators = [(0, typeorm_1.Column)()];
        _template_name_decorators = [(0, typeorm_1.Column)()];
        _template_payload_decorators = [(0, typeorm_1.Column)()];
        __esDecorate(null, null, _id_decorators, { kind: "field", name: "id", static: false, private: false, access: { has: function (obj) { return "id" in obj; }, get: function (obj) { return obj.id; }, set: function (obj, value) { obj.id = value; } }, metadata: _metadata }, _id_initializers, _instanceExtraInitializers);
        __esDecorate(null, null, _channel_type_decorators, { kind: "field", name: "channel_type", static: false, private: false, access: { has: function (obj) { return "channel_type" in obj; }, get: function (obj) { return obj.channel_type; }, set: function (obj, value) { obj.channel_type = value; } }, metadata: _metadata }, _channel_type_initializers, _instanceExtraInitializers);
        __esDecorate(null, null, _node_type_decorators, { kind: "field", name: "node_type", static: false, private: false, access: { has: function (obj) { return "node_type" in obj; }, get: function (obj) { return obj.node_type; }, set: function (obj, value) { obj.node_type = value; } }, metadata: _metadata }, _node_type_initializers, _instanceExtraInitializers);
        __esDecorate(null, null, _event_type_id_decorators, { kind: "field", name: "event_type_id", static: false, private: false, access: { has: function (obj) { return "event_type_id" in obj; }, get: function (obj) { return obj.event_type_id; }, set: function (obj, value) { obj.event_type_id = value; } }, metadata: _metadata }, _event_type_id_initializers, _instanceExtraInitializers);
        __esDecorate(null, null, _template_name_decorators, { kind: "field", name: "template_name", static: false, private: false, access: { has: function (obj) { return "template_name" in obj; }, get: function (obj) { return obj.template_name; }, set: function (obj, value) { obj.template_name = value; } }, metadata: _metadata }, _template_name_initializers, _instanceExtraInitializers);
        __esDecorate(null, null, _template_payload_decorators, { kind: "field", name: "template_payload", static: false, private: false, access: { has: function (obj) { return "template_payload" in obj; }, get: function (obj) { return obj.template_payload; }, set: function (obj, value) { obj.template_payload = value; } }, metadata: _metadata }, _template_payload_initializers, _instanceExtraInitializers);
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        NotificationTemplates = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return NotificationTemplates = _classThis;
}();
exports.NotificationTemplates = NotificationTemplates;
