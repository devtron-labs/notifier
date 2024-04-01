"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};
Object.defineProperty(exports, "__esModule", { value: true });
var mod_1 = require("nats.deno/src/mod");
var natsUrl = process.env.NATS_URL;
var PubSubServiceImpl = /** @class */ (function () {
    function PubSubServiceImpl() {
        this.nc = (0, mod_1.connect)(natsUrl);
        this.js = this.nc.jetstream();
    }
    PubSubServiceImpl.prototype.subscribe = function (callback) {
        var _a, e_1, _b, _c;
        return __awaiter(this, void 0, void 0, function () {
            var consumer, messages, _d, messages_1, messages_1_1, m, event_1, e_1_1, err_1;
            return __generator(this, function (_e) {
                switch (_e.label) {
                    case 0: return [4 /*yield*/, this.js.consumers.get(ORCHESTRATOR_STREAM, NOTIFICATION_EVENT_DURABLE)];
                    case 1:
                        consumer = _e.sent();
                        _e.label = 2;
                    case 2:
                        if (!true) return [3 /*break*/, 19];
                        console.log("waiting for messages");
                        return [4 /*yield*/, consumer.consume()];
                    case 3:
                        messages = _e.sent();
                        _e.label = 4;
                    case 4:
                        _e.trys.push([4, 17, , 18]);
                        _e.label = 5;
                    case 5:
                        _e.trys.push([5, 10, 11, 16]);
                        _d = true, messages_1 = (e_1 = void 0, __asyncValues(messages));
                        _e.label = 6;
                    case 6: return [4 /*yield*/, messages_1.next()];
                    case 7:
                        if (!(messages_1_1 = _e.sent(), _a = messages_1_1.done, !_a)) return [3 /*break*/, 9];
                        _c = messages_1_1.value;
                        _d = false;
                        m = _c;
                        console.log(m.seq);
                        event_1 = {
                            appId: 0, envId: 0, eventTime: "", eventTypeId: 0, pipelineId: 0, teamId: 0,
                            payload: m.data
                        };
                        callback(event_1);
                        m.ack();
                        _e.label = 8;
                    case 8:
                        _d = true;
                        return [3 /*break*/, 6];
                    case 9: return [3 /*break*/, 16];
                    case 10:
                        e_1_1 = _e.sent();
                        e_1 = { error: e_1_1 };
                        return [3 /*break*/, 16];
                    case 11:
                        _e.trys.push([11, , 14, 15]);
                        if (!(!_d && !_a && (_b = messages_1.return))) return [3 /*break*/, 13];
                        return [4 /*yield*/, _b.call(messages_1)];
                    case 12:
                        _e.sent();
                        _e.label = 13;
                    case 13: return [3 /*break*/, 15];
                    case 14:
                        if (e_1) throw e_1.error;
                        return [7 /*endfinally*/];
                    case 15: return [7 /*endfinally*/];
                    case 16: return [3 /*break*/, 18];
                    case 17:
                        err_1 = _e.sent();
                        console.log("consume failed: ".concat(err_1));
                        return [3 /*break*/, 18];
                    case 18: return [3 /*break*/, 2];
                    case 19: return [2 /*return*/];
                }
            });
        });
    };
    return PubSubServiceImpl;
}());
