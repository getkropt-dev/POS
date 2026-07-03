import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { Knex } from 'knex';

@Injectable()
export class CustomersService {
  constructor(@Inject('KNEX_CONNECTION') private readonly knex: Knex) {}

  async findAll(searchQuery?: string) {
    const query = this.knex('customers').select('*');
    if (searchQuery) {
      query.where('name', 'ilike', `%${searchQuery}%`)
           .orWhere('tax_id', 'ilike', `%${searchQuery}%`);
    }
    return await query.orderBy('name', 'asc');
  }

  async findOne(id: number) {
    const customer = await this.knex('customers').where({ id }).first();
    if (!customer) throw new NotFoundException('Cliente no encontrado');
    return customer;
  }

  async create(data: any) {
    const [newCustomer] = await this.knex('customers').insert(data).returning('*');
    return { success: true, customer: newCustomer };
  }

  async update(id: number, data: any) {
    const [updated] = await this.knex('customers')
      .where({ id })
      .update({ ...data, updated_at: this.knex.fn.now() })
      .returning('*');
    if (!updated) throw new NotFoundException('Cliente no encontrado');
    return { success: true, customer: updated };
  }

  async getDebts() {
    return await this.knex('vw_customer_debts')
      .select('*')
      .orderBy('current_balance', 'desc');
  }

  async payDebt(customerId: number, amount: number, paymentMethodId: number, idempotencyKey: string, userId: number, notes?: string) {
    if (amount <= 0) {
      throw new BadRequestException('El monto a abonar debe ser mayor a cero.');
    }

    if (!idempotencyKey) {
      throw new BadRequestException('Se requiere una clave de idempotencia (idempotencyKey) para procesar el pago.');
    }

    return await this.knex.transaction(async (trx) => {
      // 0. VERIFICAR IDEMPOTENCIA
      // Si el cliente reintenta enviar exactamente la misma petición, interceptamos antes de hacer nada.
      const existingPayment = await trx('customer_payments')
        .where({ idempotency_key: idempotencyKey })
        .first();

      if (existingPayment) {
        // En un diseño puramente idempotente, se devuelve HTTP 200 con el estado del pago previo
        return {
          success: true,
          message: 'Pago ya fue procesado anteriormente (Idempotencia).',
          paymentId: existingPayment.id,
          amountPaid: Number(existingPayment.amount)
        };
      }

      // 1. Bloqueamos la fila del cliente para evitar colisiones concurrentes reales
      const customer = await trx('customers').where({ id: customerId }).forUpdate().first();
      if (!customer) throw new NotFoundException('Cliente no encontrado.');
      if (!customer.is_credit_customer) throw new BadRequestException('Este cliente no tiene cuenta de crédito habilitada.');

      const currentBalance = Number(customer.current_balance);
      if (currentBalance < amount) {
        throw new BadRequestException(`El monto del abono (${amount}) no puede ser mayor a la deuda actual (${currentBalance}).`);
      }

      // 2. Aplicar el abono (restar de la deuda)
      const newBalance = currentBalance - amount;
      await trx('customers')
        .where({ id: customerId })
        .update({ current_balance: newBalance, updated_at: this.knex.fn.now() });

      // 3. Registrar el pago en el historial (esto garantiza que la próxima vez que envíen el key, rebote en el paso 0)
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
}


