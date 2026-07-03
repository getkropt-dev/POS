import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import { Knex } from 'knex';

@Injectable()
export class CashSessionsService {
  constructor(@Inject('KNEX_CONNECTION') private readonly knex: Knex) {}

  async openSession(userId: number, openingBalance: number, notes?: string) {
    // 1. Verificar si el usuario ya tiene una caja abierta
    const openSession = await this.knex('cash_sessions')
      .where({ user_id: userId, status: 'OPEN' })
      .first();

    if (openSession) {
      throw new BadRequestException('El usuario ya tiene un turno de caja abierto. Ciérrelo antes de abrir uno nuevo.');
    }

    // 2. Abrir nueva caja
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

  async getCurrentSession(userId: number) {
    const session = await this.knex('cash_sessions')
      .where({ user_id: userId, status: 'OPEN' })
      .first();

    if (!session) {
      throw new BadRequestException('No hay turno de caja abierto para este usuario.');
    }

    // Calcular las ventas esperadas (efectivo ingresado en este turno)
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

  async closeSession(userId: number, actualBalance: number, notes?: string) {
    // 1. Obtener sesión y calcular métricas en tiempo real
    const { session, live_metrics } = await this.getCurrentSession(userId);

    const expectedBalance = live_metrics.expected_balance;
    const difference = actualBalance - expectedBalance;

    // 2. Cerrar caja (Arqueo)
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
}
