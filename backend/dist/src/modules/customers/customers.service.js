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
exports.CustomersService = void 0;
const common_1 = require("@nestjs/common");
const knex_1 = require("knex");
let CustomersService = class CustomersService {
    knex;
    constructor(knex) {
        this.knex = knex;
    }
    async findAll(searchQuery) {
        const query = this.knex('customers').select('*');
        if (searchQuery) {
            query.where('name', 'ilike', `%${searchQuery}%`)
                .orWhere('tax_id', 'ilike', `%${searchQuery}%`);
        }
        return await query.orderBy('name', 'asc');
    }
    async findOne(id) {
        const customer = await this.knex('customers').where({ id }).first();
        if (!customer)
            throw new common_1.NotFoundException('Cliente no encontrado');
        return customer;
    }
    async create(data) {
        const [newCustomer] = await this.knex('customers').insert(data).returning('*');
        return { success: true, customer: newCustomer };
    }
    async update(id, data) {
        const [updated] = await this.knex('customers')
            .where({ id })
            .update({ ...data, updated_at: this.knex.fn.now() })
            .returning('*');
        if (!updated)
            throw new common_1.NotFoundException('Cliente no encontrado');
        return { success: true, customer: updated };
    }
    async getDebts() {
        return await this.knex('vw_customer_debts')
            .select('*')
            .orderBy('current_balance', 'desc');
    }
    async payDebt(customerId, amount, paymentMethodId, idempotencyKey, userId, notes) {
        if (amount <= 0) {
            throw new common_1.BadRequestException('El monto a abonar debe ser mayor a cero.');
        }
        if (!idempotencyKey) {
            throw new common_1.BadRequestException('Se requiere una clave de idempotencia (idempotencyKey) para procesar el pago.');
        }
        return await this.knex.transaction(async (trx) => {
            const existingPayment = await trx('customer_payments')
                .where({ idempotency_key: idempotencyKey })
                .first();
            if (existingPayment) {
                return {
                    success: true,
                    message: 'Pago ya fue procesado anteriormente (Idempotencia).',
                    paymentId: existingPayment.id,
                    amountPaid: Number(existingPayment.amount)
                };
            }
            const customer = await trx('customers').where({ id: customerId }).forUpdate().first();
            if (!customer)
                throw new common_1.NotFoundException('Cliente no encontrado.');
            if (!customer.is_credit_customer)
                throw new common_1.BadRequestException('Este cliente no tiene cuenta de crédito habilitada.');
            const currentBalance = Number(customer.current_balance);
            if (currentBalance < amount) {
                throw new common_1.BadRequestException(`El monto del abono (${amount}) no puede ser mayor a la deuda actual (${currentBalance}).`);
            }
            const newBalance = currentBalance - amount;
            await trx('customers')
                .where({ id: customerId })
                .update({ current_balance: newBalance, updated_at: this.knex.fn.now() });
            const [paymentRecord] = await trx('customer_payments').insert({
                customer_id: customerId,
                amount: amount,
                payment_method_id: paymentMethodId,
                idempotency_key: idempotencyKey,
                notes: notes || null,
                created_by: userId
            }).returning('id');
            const paymentId = paymentRecord.id || paymentRecord;
            return {
                success: true,
                message: 'Abono registrado exitosamente.',
                paymentId: paymentId,
                previousBalance: currentBalance,
                amountPaid: amount,
                newBalance: newBalance
            };
        });
    }
};
exports.CustomersService = CustomersService;
exports.CustomersService = CustomersService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)('KNEX_CONNECTION')),
    __metadata("design:paramtypes", [Function])
], CustomersService);
//# sourceMappingURL=customers.service.js.map