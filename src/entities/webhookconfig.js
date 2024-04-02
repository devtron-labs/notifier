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
exports.WebhookConfig = void 0;
var typeorm_1 = require("typeorm");
var WebhookConfig = function () {
    var _classDecorators = [(0, typeorm_1.Entity)("webhook_config")];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var _instanceExtraInitializers = [];
    var _id_decorators;
    var _id_initializers = [];
    var _web_hook_url_decorators;
    var _web_hook_url_initializers = [];
    var _config_name_decorators;
    var _config_name_initializers = [];
    var _header_decorators;
    var _header_initializers = [];
    var _payload_decorators;
    var _payload_initializers = [];
    var _description_decorators;
    var _description_initializers = [];
    var _active_decorators;
    var _active_initializers = [];
    var _deleted_decorators;
    var _deleted_initializers = [];
    var WebhookConfig = _classThis = /** @class */ (function () {
        function WebhookConfig_1() {
            this.id = (__runInitializers(this, _instanceExtraInitializers), __runInitializers(this, _id_initializers, void 0));
            this.web_hook_url = __runInitializers(this, _web_hook_url_initializers, void 0);
            this.config_name = __runInitializers(this, _config_name_initializers, void 0);
            this.header = __runInitializers(this, _header_initializers, void 0);
            this.payload = __runInitializers(this, _payload_initializers, void 0);
            this.description = __runInitializers(this, _description_initializers, void 0);
            this.active = __runInitializers(this, _active_initializers, void 0);
            this.deleted = __runInitializers(this, _deleted_initializers, void 0);
        }
        return WebhookConfig_1;
    }());
    __setFunctionName(_classThis, "WebhookConfig");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        _id_decorators = [(0, typeorm_1.PrimaryGeneratedColumn)()];
        _web_hook_url_decorators = [(0, typeorm_1.Column)()];
        _config_name_decorators = [(0, typeorm_1.Column)()];
        _header_decorators = [(0, typeorm_1.Column)({ type: 'jsonb', nullable: true })];
        _payload_decorators = [(0, typeorm_1.Column)({ type: 'jsonb', nullable: true })];
        _description_decorators = [(0, typeorm_1.Column)()];
        _active_decorators = [(0, typeorm_1.Column)()];
        _deleted_decorators = [(0, typeorm_1.Column)()];
        __esDecorate(null, null, _id_decorators, { kind: "field", name: "id", static: false, private: false, access: { has: function (obj) { return "id" in obj; }, get: function (obj) { return obj.id; }, set: function (obj, value) { obj.id = value; } }, metadata: _metadata }, _id_initializers, _instanceExtraInitializers);
        __esDecorate(null, null, _web_hook_url_decorators, { kind: "field", name: "web_hook_url", static: false, private: false, access: { has: function (obj) { return "web_hook_url" in obj; }, get: function (obj) { return obj.web_hook_url; }, set: function (obj, value) { obj.web_hook_url = value; } }, metadata: _metadata }, _web_hook_url_initializers, _instanceExtraInitializers);
        __esDecorate(null, null, _config_name_decorators, { kind: "field", name: "config_name", static: false, private: false, access: { has: function (obj) { return "config_name" in obj; }, get: function (obj) { return obj.config_name; }, set: function (obj, value) { obj.config_name = value; } }, metadata: _metadata }, _config_name_initializers, _instanceExtraInitializers);
        __esDecorate(null, null, _header_decorators, { kind: "field", name: "header", static: false, private: false, access: { has: function (obj) { return "header" in obj; }, get: function (obj) { return obj.header; }, set: function (obj, value) { obj.header = value; } }, metadata: _metadata }, _header_initializers, _instanceExtraInitializers);
        __esDecorate(null, null, _payload_decorators, { kind: "field", name: "payload", static: false, private: false, access: { has: function (obj) { return "payload" in obj; }, get: function (obj) { return obj.payload; }, set: function (obj, value) { obj.payload = value; } }, metadata: _metadata }, _payload_initializers, _instanceExtraInitializers);
        __esDecorate(null, null, _description_decorators, { kind: "field", name: "description", static: false, private: false, access: { has: function (obj) { return "description" in obj; }, get: function (obj) { return obj.description; }, set: function (obj, value) { obj.description = value; } }, metadata: _metadata }, _description_initializers, _instanceExtraInitializers);
        __esDecorate(null, null, _active_decorators, { kind: "field", name: "active", static: false, private: false, access: { has: function (obj) { return "active" in obj; }, get: function (obj) { return obj.active; }, set: function (obj, value) { obj.active = value; } }, metadata: _metadata }, _active_initializers, _instanceExtraInitializers);
        __esDecorate(null, null, _deleted_decorators, { kind: "field", name: "deleted", static: false, private: false, access: { has: function (obj) { return "deleted" in obj; }, get: function (obj) { return obj.deleted; }, set: function (obj, value) { obj.deleted = value; } }, metadata: _metadata }, _deleted_initializers, _instanceExtraInitializers);
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        WebhookConfig = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return WebhookConfig = _classThis;
}();
exports.WebhookConfig = WebhookConfig;
