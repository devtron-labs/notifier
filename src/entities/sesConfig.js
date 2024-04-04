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
exports.SesConfig = void 0;
var typeorm_1 = require("typeorm");
var SesConfig = function () {
    var _classDecorators = [(0, typeorm_1.Entity)("ses_config")];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var _instanceExtraInitializers = [];
    var _id_decorators;
    var _id_initializers = [];
    var _region_decorators;
    var _region_initializers = [];
    var _access_key_decorators;
    var _access_key_initializers = [];
    var _secret_access_key_decorators;
    var _secret_access_key_initializers = [];
    var _session_token_decorators;
    var _session_token_initializers = [];
    var _from_email_decorators;
    var _from_email_initializers = [];
    var _config_name_decorators;
    var _config_name_initializers = [];
    var _description_decorators;
    var _description_initializers = [];
    var _default_decorators;
    var _default_initializers = [];
    var _deleted_decorators;
    var _deleted_initializers = [];
    var SesConfig = _classThis = /** @class */ (function () {
        function SesConfig_1() {
            this.id = (__runInitializers(this, _instanceExtraInitializers), __runInitializers(this, _id_initializers, void 0));
            this.region = __runInitializers(this, _region_initializers, void 0);
            this.access_key = __runInitializers(this, _access_key_initializers, void 0);
            this.secret_access_key = __runInitializers(this, _secret_access_key_initializers, void 0);
            this.session_token = __runInitializers(this, _session_token_initializers, void 0);
            this.from_email = __runInitializers(this, _from_email_initializers, void 0);
            this.config_name = __runInitializers(this, _config_name_initializers, void 0);
            this.description = __runInitializers(this, _description_initializers, void 0);
            this.default = __runInitializers(this, _default_initializers, void 0);
            this.deleted = __runInitializers(this, _deleted_initializers, void 0);
        }
        return SesConfig_1;
    }());
    __setFunctionName(_classThis, "SesConfig");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        _id_decorators = [(0, typeorm_1.PrimaryGeneratedColumn)()];
        _region_decorators = [(0, typeorm_1.Column)()];
        _access_key_decorators = [(0, typeorm_1.Column)()];
        _secret_access_key_decorators = [(0, typeorm_1.Column)()];
        _session_token_decorators = [(0, typeorm_1.Column)()];
        _from_email_decorators = [(0, typeorm_1.Column)()];
        _config_name_decorators = [(0, typeorm_1.Column)()];
        _description_decorators = [(0, typeorm_1.Column)()];
        _default_decorators = [(0, typeorm_1.Column)()];
        _deleted_decorators = [(0, typeorm_1.Column)()];
        __esDecorate(null, null, _id_decorators, { kind: "field", name: "id", static: false, private: false, access: { has: function (obj) { return "id" in obj; }, get: function (obj) { return obj.id; }, set: function (obj, value) { obj.id = value; } }, metadata: _metadata }, _id_initializers, _instanceExtraInitializers);
        __esDecorate(null, null, _region_decorators, { kind: "field", name: "region", static: false, private: false, access: { has: function (obj) { return "region" in obj; }, get: function (obj) { return obj.region; }, set: function (obj, value) { obj.region = value; } }, metadata: _metadata }, _region_initializers, _instanceExtraInitializers);
        __esDecorate(null, null, _access_key_decorators, { kind: "field", name: "access_key", static: false, private: false, access: { has: function (obj) { return "access_key" in obj; }, get: function (obj) { return obj.access_key; }, set: function (obj, value) { obj.access_key = value; } }, metadata: _metadata }, _access_key_initializers, _instanceExtraInitializers);
        __esDecorate(null, null, _secret_access_key_decorators, { kind: "field", name: "secret_access_key", static: false, private: false, access: { has: function (obj) { return "secret_access_key" in obj; }, get: function (obj) { return obj.secret_access_key; }, set: function (obj, value) { obj.secret_access_key = value; } }, metadata: _metadata }, _secret_access_key_initializers, _instanceExtraInitializers);
        __esDecorate(null, null, _session_token_decorators, { kind: "field", name: "session_token", static: false, private: false, access: { has: function (obj) { return "session_token" in obj; }, get: function (obj) { return obj.session_token; }, set: function (obj, value) { obj.session_token = value; } }, metadata: _metadata }, _session_token_initializers, _instanceExtraInitializers);
        __esDecorate(null, null, _from_email_decorators, { kind: "field", name: "from_email", static: false, private: false, access: { has: function (obj) { return "from_email" in obj; }, get: function (obj) { return obj.from_email; }, set: function (obj, value) { obj.from_email = value; } }, metadata: _metadata }, _from_email_initializers, _instanceExtraInitializers);
        __esDecorate(null, null, _config_name_decorators, { kind: "field", name: "config_name", static: false, private: false, access: { has: function (obj) { return "config_name" in obj; }, get: function (obj) { return obj.config_name; }, set: function (obj, value) { obj.config_name = value; } }, metadata: _metadata }, _config_name_initializers, _instanceExtraInitializers);
        __esDecorate(null, null, _description_decorators, { kind: "field", name: "description", static: false, private: false, access: { has: function (obj) { return "description" in obj; }, get: function (obj) { return obj.description; }, set: function (obj, value) { obj.description = value; } }, metadata: _metadata }, _description_initializers, _instanceExtraInitializers);
        __esDecorate(null, null, _default_decorators, { kind: "field", name: "default", static: false, private: false, access: { has: function (obj) { return "default" in obj; }, get: function (obj) { return obj.default; }, set: function (obj, value) { obj.default = value; } }, metadata: _metadata }, _default_initializers, _instanceExtraInitializers);
        __esDecorate(null, null, _deleted_decorators, { kind: "field", name: "deleted", static: false, private: false, access: { has: function (obj) { return "deleted" in obj; }, get: function (obj) { return obj.deleted; }, set: function (obj, value) { obj.deleted = value; } }, metadata: _metadata }, _deleted_initializers, _instanceExtraInitializers);
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        SesConfig = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return SesConfig = _classThis;
}();
exports.SesConfig = SesConfig;
