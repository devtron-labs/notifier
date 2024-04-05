"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersRepository = void 0;
var typeorm_1 = require("typeorm");
var users_1 = require("../entities/users");
var UsersRepository = /** @class */ (function () {
    function UsersRepository() {
    }
    UsersRepository.prototype.findByUserId = function (id) {
        return (0, typeorm_1.getManager)().getRepository(users_1.Users).findOne({ where: { id: id } });
    };
    return UsersRepository;
}());
exports.UsersRepository = UsersRepository;
