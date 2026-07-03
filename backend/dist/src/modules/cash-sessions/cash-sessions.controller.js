"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CashSessionsController = void 0;
const common_1 = require("@nestjs/common");
const cash_sessions_service_1 = require("./cash-sessions.service");
const jwt_auth_guard_1 = require("../../auth/jwt-auth.guard");
let CashSessionsController = class CashSessionsController {
    cashSessionsService;
    constructor(cashSessionsService) {
        this.cashSessionsService = cashSessionsService;
    }
    async openSession(balance, notes, req) {
        const userId = req.user.userId;
        return await this.cashSessionsService.openSession(userId, balance, notes);
    }
    async getCurrentSession(req) {
        const userId = req.user.userId;
        return await this.cashSessionsService.getCurrentSession(userId);
    }
    async closeSession(actualBalance, notes, req) {
        const userId = req.user.userId;
        return await this.cashSessionsService.closeSession(userId, actualBalance, notes);
    }
};
exports.CashSessionsController = CashSessionsController;
__decorate([
    (0, common_1.Post)('open'),
    __param(0, (0, common_1.Body)('opening_balance')),
    __param(1, (0, common_1.Body)('notes')),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, String, Object]),
    __metadata("design:returntype", Promise)
], CashSessionsController.prototype, "openSession", null);
__decorate([
    (0, common_1.Get)('current'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], CashSessionsController.prototype, "getCurrentSession", null);
__decorate([
    (0, common_1.Post)('close'),
    __param(0, (0, common_1.Body)('actual_balance')),
    __param(1, (0, common_1.Body)('notes')),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, String, Object]),
    __metadata("design:returntype", Promise)
], CashSessionsController.prototype, "closeSession", null);
exports.CashSessionsController = CashSessionsController = __decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('cash-sessions'),
    __metadata("design:paramtypes", [cash_sessions_service_1.CashSessionsService])
], CashSessionsController);
//# sourceMappingURL=cash-sessions.controller.js.map