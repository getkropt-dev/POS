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
exports.ReportsService = void 0;
const common_1 = require("@nestjs/common");
const knex_1 = require("knex");
let ReportsService = class ReportsService {
    knex;
    constructor(knex) {
        this.knex = knex;
    }
    async getRegimenSimplificadoReport(periodoDeclarado) {
        const query = this.knex('vw_reporte_regimen_simplificado_cr_v2').select('*');
        if (periodoDeclarado) {
            query.where('periodo_declarado', periodoDeclarado);
        }
        return await query;
    }
    async getPendingTaxInvoices() {
        return await this.knex('vw_compras_pendientes_tributacion')
            .select('*')
            .orderBy('purchase_date', 'asc');
    }
    async getTaxLiquidationReport() {
        return await this.knex('vw_tax_liquidation_report').select('*');
    }
    async getLimitAlertReport() {
        return await this.knex('vw_alerta_limite_simplificado').select('*');
    }
    async getAbcAnalysis() {
        return await this.knex('vw_inventory_abc_analysis').select('*');
    }
    async getKardex(productId) {
        return await this.knex('vw_kardex')
            .select('*')
            .where('product_id', productId)
            .orderBy('created_at', 'desc');
    }
    async getLowStock() {
        return await this.knex('vw_low_stock').select('*');
    }
    async getDailySales() {
        return await this.knex('mv_daily_sales').select('*').orderBy('sale_day', 'desc');
    }
    async getSalesByPayment() {
        return await this.knex('mv_sales_by_payment').select('*').orderBy('total_amount', 'desc');
    }
    async refreshMaterializedViews() {
        await this.knex.raw(`SELECT fn_refresh_materialized_views()`);
        return { success: true, message: 'Vistas materializadas del Dashboard actualizadas correctamente.' };
    }
    async getSalesProfitsReport(startDate, endDate, categoryId) {
        const query = this.knex('v_sales_with_categories').select('*').orderBy('sale_date', 'desc');
        if (startDate) {
            query.where('sale_date', '>=', startDate);
        }
        if (endDate) {
            const endDateTime = endDate.includes('T') ? endDate : `${endDate} 23:59:59`;
            query.where('sale_date', '<=', endDateTime);
        }
        if (categoryId) {
            query.where('category_id', categoryId);
        }
        return await query;
    }
    async getCashSessionsReport(startDate, endDate) {
        const query = this.knex('v_cash_sessions_report')
            .select('*')
            .orderBy('open_date', 'desc');
        if (startDate) {
            query.where('open_date', '>=', startDate);
        }
        if (endDate) {
            const endDateTime = endDate.includes('T') ? endDate : `${endDate} 23:59:59`;
            query.where('open_date', '<=', endDateTime);
        }
        return await query;
    }
    async getInventoryMovementsReport(startDate, endDate) {
        const query = this.knex('v_inventory_movements_report')
            .select('*')
            .orderBy('movement_date', 'desc');
        if (startDate) {
            query.where('movement_date', '>=', startDate);
        }
        if (endDate) {
            const endDateTime = endDate.includes('T') ? endDate : `${endDate} 23:59:59`;
            query.where('movement_date', '<=', endDateTime);
        }
        return await query;
    }
    async getPurchasesBillingReport(startDate, endDate, period, includeInDeclaration) {
        const query = this.knex('v_purchases_billing_report')
            .select('*')
            .orderBy('purchase_date', 'desc');
        if (startDate) {
            query.where('purchase_date', '>=', startDate);
        }
        if (endDate) {
            const endDateTime = endDate.includes('T') ? endDate : `${endDate} 23:59:59`;
            query.where('purchase_date', '<=', endDateTime);
        }
        if (period) {
            query.where('assigned_tax_period', period);
        }
        if (includeInDeclaration !== undefined && includeInDeclaration !== '') {
            query.where('include_in_declaration', includeInDeclaration === 'true');
        }
        return await query;
    }
    async getCustomerCreditReport(startDate, endDate, customerId) {
        const query = this.knex('v_customer_credit_report')
            .select('*')
            .orderBy('payment_date', 'desc');
        if (startDate) {
            query.where('payment_date', '>=', startDate);
        }
        if (endDate) {
            const endDateTime = endDate.includes('T') ? endDate : `${endDate} 23:59:59`;
            query.where('payment_date', '<=', endDateTime);
        }
        if (customerId) {
            query.where('customer_id', customerId);
        }
        return await query;
    }
    async getExecutiveSalesReport(startDate, endDate) {
        const start = startDate ? `${startDate} 00:00:00` : `${new Date().toISOString().slice(0, 10)} 00:00:00`;
        const end = endDate ? (endDate.includes('T') ? endDate : `${endDate} 23:59:59`) : `${new Date().toISOString().slice(0, 10)} 23:59:59`;
        const summaryResult = await this.knex('sales')
            .join('sale_details', 'sales.id', 'sale_details.sale_id')
            .where('sales.status', 'COMPLETED')
            .where('sales.sale_date', '>=', start)
            .where('sales.sale_date', '<=', end)
            .sum({ totalSales: 'sale_details.line_total', totalProfit: 'sale_details.line_profit' })
            .first();
        const totalSales = Number(summaryResult?.totalSales || 0);
        const totalProfit = Number(summaryResult?.totalProfit || 0);
        const paymentMethodsResult = await this.knex('sales')
            .join('sale_payments', 'sales.id', 'sale_payments.sale_id')
            .join('payment_methods', 'sale_payments.payment_method_id', 'payment_methods.id')
            .where('sales.status', 'COMPLETED')
            .where('sales.sale_date', '>=', start)
            .where('sales.sale_date', '<=', end)
            .select('payment_methods.name as name')
            .select(this.knex.raw('SUM(sale_payments.amount) as "totalAmount"'))
            .groupBy('payment_methods.name')
            .orderBy('totalAmount', 'desc');
        const paymentMethods = paymentMethodsResult.map(pm => ({
            name: pm.name,
            totalAmount: Number(pm.totalAmount || 0),
            percentage: totalSales > 0 ? (Number(pm.totalAmount || 0) / totalSales) * 100 : 0
        }));
        const categoriesResult = await this.knex('sales')
            .join('sale_details', 'sales.id', 'sale_details.sale_id')
            .join('products', 'sale_details.product_id', 'products.id')
            .leftJoin('categories', 'products.category_id', 'categories.id')
            .where('sales.status', 'COMPLETED')
            .where('sales.sale_date', '>=', start)
            .where('sales.sale_date', '<=', end)
            .select(this.knex.raw('COALESCE(categories.name, \'Sin Categoría\') as name'))
            .select(this.knex.raw('SUM(sale_details.quantity) as quantity'))
            .select(this.knex.raw('SUM(sale_details.line_total) as "totalAmount"'))
            .groupByRaw('COALESCE(categories.name, \'Sin Categoría\')')
            .orderBy('totalAmount', 'desc');
        const categories = categoriesResult.map(cat => ({
            name: cat.name,
            quantity: Number(cat.quantity || 0),
            totalAmount: Number(cat.totalAmount || 0),
            percentage: totalSales > 0 ? (Number(cat.totalAmount || 0) / totalSales) * 100 : 0
        }));
        return {
            summary: { totalSales, totalProfit },
            paymentMethods,
            categories
        };
    }
};
exports.ReportsService = ReportsService;
exports.ReportsService = ReportsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)('KNEX_CONNECTION')),
    __metadata("design:paramtypes", [Function])
], ReportsService);
//# sourceMappingURL=reports.service.js.map