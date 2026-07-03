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
exports.PurchasesService = void 0;
const common_1 = require("@nestjs/common");
const knex_1 = require("knex");
let PurchasesService = class PurchasesService {
    knex;
    constructor(knex) {
        this.knex = knex;
    }
    async createInvoice(data, userId) {
        return await this.knex.transaction(async (trx) => {
            const existingInvoice = await trx('purchase_invoices')
                .where({
                supplier_id: data.supplier_id,
                invoice_number: data.invoice_number
            })
                .first();
            if (existingInvoice) {
                return {
                    success: true,
                    message: 'La factura de este proveedor ya fue ingresada anteriormente.',
                    invoiceId: existingInvoice.id
                };
            }
            const [invoiceRecord] = await trx('purchase_invoices')
                .insert({
                supplier_id: data.supplier_id,
                invoice_number: data.invoice_number,
                purchase_date: data.purchase_date,
                invoice_type: data.invoice_type,
                is_deductible: data.is_deductible ?? true,
                created_by: userId,
                status: 'PROCESSED'
            })
                .returning('id');
            const invoiceId = invoiceRecord.id || invoiceRecord;
            const detailsToInsert = data.details.map((detail) => ({
                purchase_invoice_id: invoiceId,
                product_id: detail.product_id,
                quantity: detail.quantity,
                unit_cost_net: detail.unit_cost_net,
                tax_percentage: detail.tax_percentage,
                tax_amount: detail.tax_amount,
                line_total: detail.line_total
            }));
            await trx('purchase_invoice_details').insert(detailsToInsert);
            return {
                success: true,
                message: 'Factura procesada con éxito. Inventario y Costos Ponderados actualizados automáticamente.',
                invoiceId
            };
        });
    }
    async assignTaxPeriod(invoiceIds, period, include) {
        await this.knex.raw(`SELECT fn_asignar_facturas_a_periodo(?, ?, ?)`, [invoiceIds, period, include]);
        return {
            success: true,
            message: `Las facturas han sido asignadas al periodo fiscal ${period}.`
        };
    }
};
exports.PurchasesService = PurchasesService;
exports.PurchasesService = PurchasesService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)('KNEX_CONNECTION')),
    __metadata("design:paramtypes", [Function])
], PurchasesService);
//# sourceMappingURL=purchases.service.js.map