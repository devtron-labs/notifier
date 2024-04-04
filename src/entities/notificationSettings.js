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
exports.NotificationSettings = void 0;
var typeorm_1 = require("typeorm");
var NotificationSettings = function () {
    var _classDecorators = [(0, typeorm_1.Entity)("notification_settings")];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var _instanceExtraInitializers = [];
    var _id_decorators;
    var _id_initializers = [];
    var _team_id_decorators;
    var _team_id_initializers = [];
    var _app_id_decorators;
    var _app_id_initializers = [];
    var _env_id_decorators;
    var _env_id_initializers = [];
    var _pipeline_id_decorators;
    var _pipeline_id_initializers = [];
    var _pipeline_type_decorators;
    var _pipeline_type_initializers = [];
    var _event_type_id_decorators;
    var _event_type_id_initializers = [];
    var _config_decorators;
    var _config_initializers = [];
    var _view_id_decorators;
    var _view_id_initializers = [];
    var NotificationSettings = _classThis = /** @class */ (function () {
        function NotificationSettings_1() {
            this.id = (__runInitializers(this, _instanceExtraInitializers), __runInitializers(this, _id_initializers, void 0));
            this.team_id = __runInitializers(this, _team_id_initializers, void 0);
            this.app_id = __runInitializers(this, _app_id_initializers, void 0);
            this.env_id = __runInitializers(this, _env_id_initializers, void 0);
            this.pipeline_id = __runInitializers(this, _pipeline_id_initializers, void 0);
            this.pipeline_type = __runInitializers(this, _pipeline_type_initializers, void 0);
            this.event_type_id = __runInitializers(this, _event_type_id_initializers, void 0);
            this.config = __runInitializers(this, _config_initializers, void 0);
            this.view_id = __runInitializers(this, _view_id_initializers, void 0);
        }
        return NotificationSettings_1;
    }());
    __setFunctionName(_classThis, "NotificationSettings");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        _id_decorators = [(0, typeorm_1.PrimaryGeneratedColumn)()];
        _team_id_decorators = [(0, typeorm_1.Column)()];
        _app_id_decorators = [(0, typeorm_1.Column)()];
        _env_id_decorators = [(0, typeorm_1.Column)()];
        _pipeline_id_decorators = [(0, typeorm_1.Column)()];
        _pipeline_type_decorators = [(0, typeorm_1.Column)()];
        _event_type_id_decorators = [(0, typeorm_1.Column)()];
        _config_decorators = [(0, typeorm_1.Column)('json')];
        _view_id_decorators = [(0, typeorm_1.Column)()];
        __esDecorate(null, null, _id_decorators, { kind: "field", name: "id", static: false, private: false, access: { has: function (obj) { return "id" in obj; }, get: function (obj) { return obj.id; }, set: function (obj, value) { obj.id = value; } }, metadata: _metadata }, _id_initializers, _instanceExtraInitializers);
        __esDecorate(null, null, _team_id_decorators, { kind: "field", name: "team_id", static: false, private: false, access: { has: function (obj) { return "team_id" in obj; }, get: function (obj) { return obj.team_id; }, set: function (obj, value) { obj.team_id = value; } }, metadata: _metadata }, _team_id_initializers, _instanceExtraInitializers);
        __esDecorate(null, null, _app_id_decorators, { kind: "field", name: "app_id", static: false, private: false, access: { has: function (obj) { return "app_id" in obj; }, get: function (obj) { return obj.app_id; }, set: function (obj, value) { obj.app_id = value; } }, metadata: _metadata }, _app_id_initializers, _instanceExtraInitializers);
        __esDecorate(null, null, _env_id_decorators, { kind: "field", name: "env_id", static: false, private: false, access: { has: function (obj) { return "env_id" in obj; }, get: function (obj) { return obj.env_id; }, set: function (obj, value) { obj.env_id = value; } }, metadata: _metadata }, _env_id_initializers, _instanceExtraInitializers);
        __esDecorate(null, null, _pipeline_id_decorators, { kind: "field", name: "pipeline_id", static: false, private: false, access: { has: function (obj) { return "pipeline_id" in obj; }, get: function (obj) { return obj.pipeline_id; }, set: function (obj, value) { obj.pipeline_id = value; } }, metadata: _metadata }, _pipeline_id_initializers, _instanceExtraInitializers);
        __esDecorate(null, null, _pipeline_type_decorators, { kind: "field", name: "pipeline_type", static: false, private: false, access: { has: function (obj) { return "pipeline_type" in obj; }, get: function (obj) { return obj.pipeline_type; }, set: function (obj, value) { obj.pipeline_type = value; } }, metadata: _metadata }, _pipeline_type_initializers, _instanceExtraInitializers);
        __esDecorate(null, null, _event_type_id_decorators, { kind: "field", name: "event_type_id", static: false, private: false, access: { has: function (obj) { return "event_type_id" in obj; }, get: function (obj) { return obj.event_type_id; }, set: function (obj, value) { obj.event_type_id = value; } }, metadata: _metadata }, _event_type_id_initializers, _instanceExtraInitializers);
        __esDecorate(null, null, _config_decorators, { kind: "field", name: "config", static: false, private: false, access: { has: function (obj) { return "config" in obj; }, get: function (obj) { return obj.config; }, set: function (obj, value) { obj.config = value; } }, metadata: _metadata }, _config_initializers, _instanceExtraInitializers);
        __esDecorate(null, null, _view_id_decorators, { kind: "field", name: "view_id", static: false, private: false, access: { has: function (obj) { return "view_id" in obj; }, get: function (obj) { return obj.view_id; }, set: function (obj, value) { obj.view_id = value; } }, metadata: _metadata }, _view_id_initializers, _instanceExtraInitializers);
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        NotificationSettings = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return NotificationSettings = _classThis;
}();
exports.NotificationSettings = NotificationSettings;
