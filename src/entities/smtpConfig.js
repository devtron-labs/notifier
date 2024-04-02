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
exports.SMTPConfig = void 0;
var typeorm_1 = require("typeorm");
var SMTPConfig = function () {
    var _classDecorators = [(0, typeorm_1.Entity)("smtp_config")];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var _instanceExtraInitializers = [];
    var _id_decorators;
    var _id_initializers = [];
    var _port_decorators;
    var _port_initializers = [];
    var _host_decorators;
    var _host_initializers = [];
    var _auth_type_decorators;
    var _auth_type_initializers = [];
    var _auth_user_decorators;
    var _auth_user_initializers = [];
    var _auth_password_decorators;
    var _auth_password_initializers = [];
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
    var SMTPConfig = _classThis = /** @class */ (function () {
        function SMTPConfig_1() {
            this.id = (__runInitializers(this, _instanceExtraInitializers), __runInitializers(this, _id_initializers, void 0));
            this.port = __runInitializers(this, _port_initializers, void 0);
            this.host = __runInitializers(this, _host_initializers, void 0);
            this.auth_type = __runInitializers(this, _auth_type_initializers, void 0);
            this.auth_user = __runInitializers(this, _auth_user_initializers, void 0);
            this.auth_password = __runInitializers(this, _auth_password_initializers, void 0);
            this.from_email = __runInitializers(this, _from_email_initializers, void 0);
            this.config_name = __runInitializers(this, _config_name_initializers, void 0);
            this.description = __runInitializers(this, _description_initializers, void 0);
            this.default = __runInitializers(this, _default_initializers, void 0);
            this.deleted = __runInitializers(this, _deleted_initializers, void 0);
        }
        return SMTPConfig_1;
    }());
    __setFunctionName(_classThis, "SMTPConfig");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        _id_decorators = [(0, typeorm_1.PrimaryGeneratedColumn)()];
        _port_decorators = [(0, typeorm_1.Column)()];
        _host_decorators = [(0, typeorm_1.Column)()];
        _auth_type_decorators = [(0, typeorm_1.Column)()];
        _auth_user_decorators = [(0, typeorm_1.Column)()];
        _auth_password_decorators = [(0, typeorm_1.Column)()];
        _from_email_decorators = [(0, typeorm_1.Column)()];
        _config_name_decorators = [(0, typeorm_1.Column)()];
        _description_decorators = [(0, typeorm_1.Column)()];
        _default_decorators = [(0, typeorm_1.Column)()];
        _deleted_decorators = [(0, typeorm_1.Column)()];
        __esDecorate(null, null, _id_decorators, { kind: "field", name: "id", static: false, private: false, access: { has: function (obj) { return "id" in obj; }, get: function (obj) { return obj.id; }, set: function (obj, value) { obj.id = value; } }, metadata: _metadata }, _id_initializers, _instanceExtraInitializers);
        __esDecorate(null, null, _port_decorators, { kind: "field", name: "port", static: false, private: false, access: { has: function (obj) { return "port" in obj; }, get: function (obj) { return obj.port; }, set: function (obj, value) { obj.port = value; } }, metadata: _metadata }, _port_initializers, _instanceExtraInitializers);
        __esDecorate(null, null, _host_decorators, { kind: "field", name: "host", static: false, private: false, access: { has: function (obj) { return "host" in obj; }, get: function (obj) { return obj.host; }, set: function (obj, value) { obj.host = value; } }, metadata: _metadata }, _host_initializers, _instanceExtraInitializers);
        __esDecorate(null, null, _auth_type_decorators, { kind: "field", name: "auth_type", static: false, private: false, access: { has: function (obj) { return "auth_type" in obj; }, get: function (obj) { return obj.auth_type; }, set: function (obj, value) { obj.auth_type = value; } }, metadata: _metadata }, _auth_type_initializers, _instanceExtraInitializers);
        __esDecorate(null, null, _auth_user_decorators, { kind: "field", name: "auth_user", static: false, private: false, access: { has: function (obj) { return "auth_user" in obj; }, get: function (obj) { return obj.auth_user; }, set: function (obj, value) { obj.auth_user = value; } }, metadata: _metadata }, _auth_user_initializers, _instanceExtraInitializers);
        __esDecorate(null, null, _auth_password_decorators, { kind: "field", name: "auth_password", static: false, private: false, access: { has: function (obj) { return "auth_password" in obj; }, get: function (obj) { return obj.auth_password; }, set: function (obj, value) { obj.auth_password = value; } }, metadata: _metadata }, _auth_password_initializers, _instanceExtraInitializers);
        __esDecorate(null, null, _from_email_decorators, { kind: "field", name: "from_email", static: false, private: false, access: { has: function (obj) { return "from_email" in obj; }, get: function (obj) { return obj.from_email; }, set: function (obj, value) { obj.from_email = value; } }, metadata: _metadata }, _from_email_initializers, _instanceExtraInitializers);
        __esDecorate(null, null, _config_name_decorators, { kind: "field", name: "config_name", static: false, private: false, access: { has: function (obj) { return "config_name" in obj; }, get: function (obj) { return obj.config_name; }, set: function (obj, value) { obj.config_name = value; } }, metadata: _metadata }, _config_name_initializers, _instanceExtraInitializers);
        __esDecorate(null, null, _description_decorators, { kind: "field", name: "description", static: false, private: false, access: { has: function (obj) { return "description" in obj; }, get: function (obj) { return obj.description; }, set: function (obj, value) { obj.description = value; } }, metadata: _metadata }, _description_initializers, _instanceExtraInitializers);
        __esDecorate(null, null, _default_decorators, { kind: "field", name: "default", static: false, private: false, access: { has: function (obj) { return "default" in obj; }, get: function (obj) { return obj.default; }, set: function (obj, value) { obj.default = value; } }, metadata: _metadata }, _default_initializers, _instanceExtraInitializers);
        __esDecorate(null, null, _deleted_decorators, { kind: "field", name: "deleted", static: false, private: false, access: { has: function (obj) { return "deleted" in obj; }, get: function (obj) { return obj.deleted; }, set: function (obj, value) { obj.deleted = value; } }, metadata: _metadata }, _deleted_initializers, _instanceExtraInitializers);
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        SMTPConfig = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return SMTPConfig = _classThis;
}();
exports.SMTPConfig = SMTPConfig;
