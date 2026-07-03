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
exports.CatalogsController = void 0;
const common_1 = require("@nestjs/common");
const catalogs_service_1 = require("./catalogs.service");
const jwt_auth_guard_1 = require("../../auth/jwt-auth.guard");
let CatalogsController = class CatalogsController {
    catalogsService;
    constructor(catalogsService) {
        this.catalogsService = catalogsService;
    }
    async getCategories() { return this.catalogsService.findAll('categories'); }
    async createCategory(body) { return this.catalogsService.create('categories', body); }
    async updateCategory(id, body) { return this.catalogsService.update('categories', Number(id), body); }
    async getPaymentMethods() { return this.catalogsService.findAll('payment_methods'); }
    async createPaymentMethod(body) { return this.catalogsService.create('payment_methods', body); }
    async updatePaymentMethod(id, body) { return this.catalogsService.update('payment_methods', Number(id), body); }
    async getTaxRates() { return this.catalogsService.findAll('tax_rates'); }
    async createTaxRate(body) { return this.catalogsService.create('tax_rates', body); }
    async updateTaxRate(id, body) { return this.catalogsService.update('tax_rates', Number(id), body); }
    async getSuppliers() { return this.catalogsService.findAll('suppliers'); }
    async createSupplier(body) { return this.catalogsService.create('suppliers', body); }
    async updateSupplier(id, body) { return this.catalogsService.update('suppliers', Number(id), body); }
};
exports.CatalogsController = CatalogsController;
__decorate([
    (0, common_1.Get)('categories'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], CatalogsController.prototype, "getCategories", null);
__decorate([
    (0, common_1.Post)('categories'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], CatalogsController.prototype, "createCategory", null);
__decorate([
    (0, common_1.Put)('categories/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], CatalogsController.prototype, "updateCategory", null);
__decorate([
    (0, common_1.Get)('payment-methods'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], CatalogsController.prototype, "getPaymentMethods", null);
__decorate([
    (0, common_1.Post)('payment-methods'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], CatalogsController.prototype, "createPaymentMethod", null);
__decorate([
    (0, common_1.Put)('payment-methods/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], CatalogsController.prototype, "updatePaymentMethod", null);
__decorate([
    (0, common_1.Get)('tax-rates'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], CatalogsController.prototype, "getTaxRates", null);
__decorate([
    (0, common_1.Post)('tax-rates'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], CatalogsController.prototype, "createTaxRate", null);
__decorate([
    (0, common_1.Put)('tax-rates/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], CatalogsController.prototype, "updateTaxRate", null);
__decorate([
    (0, common_1.Get)('suppliers'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], CatalogsController.prototype, "getSuppliers", null);
__decorate([
    (0, common_1.Post)('suppliers'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], CatalogsController.prototype, "createSupplier", null);
__decorate([
    (0, common_1.Put)('suppliers/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], CatalogsController.prototype, "updateSupplier", null);
exports.CatalogsController = CatalogsController = __decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('catalogs'),
    __metadata("design:paramtypes", [catalogs_service_1.CatalogsService])
], CatalogsController);
//# sourceMappingURL=catalogs.controller.js.map