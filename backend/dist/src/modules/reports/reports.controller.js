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
exports.ReportsController = void 0;
const common_1 = require("@nestjs/common");
const reports_service_1 = require("./reports.service");
const jwt_auth_guard_1 = require("../../auth/jwt-auth.guard");
let ReportsController = class ReportsController {
    reportsService;
    constructor(reportsService) {
        this.reportsService = reportsService;
    }
    async getRegimenSimplificado(periodo) {
        return await this.reportsService.getRegimenSimplificadoReport(periodo);
    }
    async getPendingInvoices() {
        return await this.reportsService.getPendingTaxInvoices();
    }
    async getTaxLiquidation() {
        return await this.reportsService.getTaxLiquidationReport();
    }
    async getLimitAlert() {
        return await this.reportsService.getLimitAlertReport();
    }
    async getAbcAnalysis() {
        return await this.reportsService.getAbcAnalysis();
    }
    async getLowStock() {
        return await this.reportsService.getLowStock();
    }
    async getDailySales() {
        return await this.reportsService.getDailySales();
    }
    async getSalesByPayment() {
        return await this.reportsService.getSalesByPayment();
    }
    async getKardex(productId) {
        return await this.reportsService.getKardex(Number(productId));
    }
    async refreshViews() {
        return await this.reportsService.refreshMaterializedViews();
    }
    async getSalesProfits(startDate, endDate, categoryId) {
        return await this.reportsService.getSalesProfitsReport(startDate, endDate, categoryId);
    }
    async getCashSessions(startDate, endDate) {
        return await this.reportsService.getCashSessionsReport(startDate, endDate);
    }
    async getInventoryMovements(startDate, endDate) {
        return await this.reportsService.getInventoryMovementsReport(startDate, endDate);
    }
    async getPurchasesBilling(startDate, endDate, period, includeInDeclaration) {
        return await this.reportsService.getPurchasesBillingReport(startDate, endDate, period, includeInDeclaration);
    }
    async getCustomerCredit(startDate, endDate, customerId) {
        if (customerId) {
            return await this.reportsService.getCustomerCreditReport(startDate, endDate, customerId);
        }
        return await this.reportsService.getCustomerCreditReport(startDate, endDate);
    }
    async getExecutiveSales(startDate, endDate) {
        return await this.reportsService.getExecutiveSalesReport(startDate, endDate);
    }
};
exports.ReportsController = ReportsController;
__decorate([
    (0, common_1.Get)('regimen-simplificado'),
    __param(0, (0, common_1.Query)('periodo')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ReportsController.prototype, "getRegimenSimplificado", null);
__decorate([
    (0, common_1.Get)('pending-invoices'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ReportsController.prototype, "getPendingInvoices", null);
__decorate([
    (0, common_1.Get)('tax-liquidation'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ReportsController.prototype, "getTaxLiquidation", null);
__decorate([
    (0, common_1.Get)('limit-alert'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ReportsController.prototype, "getLimitAlert", null);
__decorate([
    (0, common_1.Get)('dashboard/abc-analysis'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ReportsController.prototype, "getAbcAnalysis", null);
__decorate([
    (0, common_1.Get)('dashboard/low-stock'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ReportsController.prototype, "getLowStock", null);
__decorate([
    (0, common_1.Get)('dashboard/daily-sales'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ReportsController.prototype, "getDailySales", null);
__decorate([
    (0, common_1.Get)('dashboard/sales-by-payment'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ReportsController.prototype, "getSalesByPayment", null);
__decorate([
    (0, common_1.Get)('kardex/:productId'),
    __param(0, (0, common_1.Param)('productId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ReportsController.prototype, "getKardex", null);
__decorate([
    (0, common_1.Post)('refresh-views'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ReportsController.prototype, "refreshViews", null);
__decorate([
    (0, common_1.Get)('sales-profits'),
    __param(0, (0, common_1.Query)('startDate')),
    __param(1, (0, common_1.Query)('endDate')),
    __param(2, (0, common_1.Query)('categoryId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], ReportsController.prototype, "getSalesProfits", null);
__decorate([
    (0, common_1.Get)('cash-sessions'),
    __param(0, (0, common_1.Query)('startDate')),
    __param(1, (0, common_1.Query)('endDate')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], ReportsController.prototype, "getCashSessions", null);
__decorate([
    (0, common_1.Get)('inventory-movements'),
    __param(0, (0, common_1.Query)('startDate')),
    __param(1, (0, common_1.Query)('endDate')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], ReportsController.prototype, "getInventoryMovements", null);
__decorate([
    (0, common_1.Get)('purchases-billing'),
    __param(0, (0, common_1.Query)('startDate')),
    __param(1, (0, common_1.Query)('endDate')),
    __param(2, (0, common_1.Query)('period')),
    __param(3, (0, common_1.Query)('includeInDeclaration')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String]),
    __metadata("design:returntype", Promise)
], ReportsController.prototype, "getPurchasesBilling", null);
__decorate([
    (0, common_1.Get)('customer-credit'),
    __param(0, (0, common_1.Query)('startDate')),
    __param(1, (0, common_1.Query)('endDate')),
    __param(2, (0, common_1.Query)('customerId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], ReportsController.prototype, "getCustomerCredit", null);
__decorate([
    (0, common_1.Get)('executive-sales'),
    __param(0, (0, common_1.Query)('startDate')),
    __param(1, (0, common_1.Query)('endDate')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], ReportsController.prototype, "getExecutiveSales", null);
exports.ReportsController = ReportsController = __decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('reports'),
    __metadata("design:paramtypes", [reports_service_1.ReportsService])
], ReportsController);
//# sourceMappingURL=reports.controller.js.map