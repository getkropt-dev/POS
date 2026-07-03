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
exports.CashSessionsService = void 0;
const common_1 = require("@nestjs/common");
const knex_1 = require("knex");
let CashSessionsService = class CashSessionsService {
    knex;
    constructor(knex) {
        this.knex = knex;
    }
    async openSession(userId, openingBalance, notes) {
        const openSession = await this.knex('cash_sessions')
            .where({ user_id: userId, status: 'OPEN' })
            .first();
        if (openSession) {
            throw new common_1.BadRequestException('El usuario ya tiene un turno de caja abierto. Ciérrelo antes de abrir uno nuevo.');
        }
        const [newSession] = await this.knex('cash_sessions')
            .insert({
            user_id: userId,
            opening_balance: openingBalance,
            status: 'OPEN',
            notes: notes || null
        })
            .returning('*');
        return { success: true, message: 'Turno de caja abierto.', session: newSession };
    }
    async getCurrentSession(userId) {
        const session = await this.knex('cash_sessions')
            .where({ user_id: userId, status: 'OPEN' })
            .first();
        if (!session) {
            throw new common_1.BadRequestException('No hay turno de caja abierto para este usuario.');
        }
        const salesCash = await this.knex('sale_payments')
            .join('sales', 'sales.id', 'sale_payments.sale_id')
            .join('payment_methods', 'payment_methods.id', 'sale_payments.payment_method_id')
            .where('sales.cash_session_id', session.id)
            .where('sales.status', 'COMPLETED')
            .where('payment_methods.name', 'Efectivo')
            .sum('sale_payments.amount as total_cash')
            .first();
        const totalCashSales = Number(salesCash?.total_cash || 0);
        const expectedBalance = Number(session.opening_balance) + totalCashSales;
        return {
            session,
            live_metrics: {
                total_cash_sales: totalCashSales,
                expected_balance: expectedBalance
            }
        };
    }
    async closeSession(userId, actualBalance, notes) {
        const { session, live_metrics } = await this.getCurrentSession(userId);
        const expectedBalance = live_metrics.expected_balance;
        const difference = actualBalance - expectedBalance;
        const [closedSession] = await this.knex('cash_sessions')
            .where({ id: session.id })
            .update({
            closed_at: this.knex.fn.now(),
            expected_balance: expectedBalance,
            actual_balance: actualBalance,
            difference: difference,
            status: 'CLOSED',
            notes: notes ? `${session.notes || ''} | ${notes}` : session.notes
        })
            .returning('*');
        return {
            success: true,
            message: 'Caja cerrada (Arqueo finalizado).',
            result: {
                expected_balance: expectedBalance,
                actual_balance: actualBalance,
                difference: difference,
                status: difference === 0 ? 'CUADRADO' : (difference > 0 ? 'SOBRANTE' : 'FALTANTE')
            }
        };
    }
};
exports.CashSessionsService = CashSessionsService;
exports.CashSessionsService = CashSessionsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)('KNEX_CONNECTION')),
    __metadata("design:paramtypes", [Function])
], CashSessionsService);
//# sourceMappingURL=cash-sessions.service.js.map