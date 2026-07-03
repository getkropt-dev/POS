import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { Knex } from 'knex';

@Injectable()
export class SalesService {
  constructor(@Inject('KNEX_CONNECTION') private readonly knex: Knex) {}

  async getSales(query: any) {
    const { search, startDate, endDate, status, customerId } = query;
    let baseQuery = this.knex('sales')
      .leftJoin('customers', 'sales.customer_id', 'customers.id')
      .leftJoin('users', 'sales.created_by', 'users.id')
      .select(
        'sales.*',
        'customers.name as customer_name',
        'users.full_name as cashier_name'
      )
      .orderBy('sales.sale_date', 'desc');

    if (search) {
      baseQuery = baseQuery.where('sales.invoice_number', 'ilike', `%${search}%`);
    }
    if (status) {
      baseQuery = baseQuery.where('sales.status', status);
    }
    if (customerId) {
      baseQuery = baseQuery.where('sales.customer_id', customerId);
    }
    if (startDate) {
      baseQuery = baseQuery.where('sales.sale_date', '>=', startDate);
    }
    if (endDate) {
      baseQuery = baseQuery.where('sales.sale_date', '<=', endDate);
    }

    return await baseQuery.limit(100);
  }

  async getSaleById(id: number) {
    const sale = await this.knex('sales')
      .leftJoin('customers', 'sales.customer_id', 'customers.id')
      .leftJoin('users as u1', 'sales.created_by', 'u1.id')
      .leftJoin('users as u2', 'sales.voided_by', 'u2.id')
      .select(
        'sales.*',
        'customers.name as customer_name',
        'u1.full_name as cashier_name',
        'u2.full_name as voided_by_name'
      )
      .where('sales.id', id)
      .first();

    if (!sale) throw new NotFoundException('Venta no encontrada');

    const details = await this.knex('sale_details')
      .leftJoin('products', 'sale_details.product_id', 'products.id')
      .select('sale_details.*', 'products.name as product_name')
      .where('sale_id', id);

    const payments = await this.knex('sale_payments')
      .leftJoin('payment_methods', 'sale_payments.payment_method_id', 'payment_methods.id')
      .select('sale_payments.*', 'payment_methods.name as payment_method_name')
      .where('sale_id', id)
      .orderBy('sale_payments.paid_at', 'asc');

    const returns = await this.knex('sale_returns')
      .leftJoin('users', 'sale_returns.created_by', 'users.id')
      .leftJoin('payment_methods', 'sale_returns.refund_method_id', 'payment_methods.id')
      .select(
        'sale_returns.*',
        'users.full_name as created_by_name',
        'payment_methods.name as refund_method_name'
      )
      .where('original_sale_id', id)
      .orderBy('sale_returns.return_date', 'desc');

    for (const ret of returns) {
      ret.details = await this.knex('sale_return_details')
        .leftJoin('products', 'sale_return_details.product_id', 'products.id')
        .select('sale_return_details.*', 'products.name as product_name')
        .where('sale_return_id', ret.id);
    }

    return {
      ...sale,
      details,
      payments,
      returns
    };
  }

  async createSale(data: any, userId: number, cashSessionId: number) {
    // Iniciamos la transacción principal de la venta
    return await this.knex.transaction(async (trx) => {
      
      // Generamos un número de factura único (VTA-YYYYMMDD-HHMMSS-RAND) si no es provisto
      let invoiceNumber = data.invoice_number;
      if (!invoiceNumber) {
        const now = new Date();
        const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
        const timeStr = now.toTimeString().slice(0, 8).replace(/:/g, '');
        const rand = Math.floor(1000 + Math.random() * 9000);
        invoiceNumber = `VTA-${dateStr}-${timeStr}-${rand}`;
      }

      // 1. Insertamos Cabecera de la Venta (Estado PENDING)
      const [saleRecord] = await trx('sales')
        .insert({
          invoice_number: invoiceNumber,
          customer_id: data.customer_id || null,
          cash_session_id: cashSessionId,
          sale_date: new Date(),
          status: 'PENDING',
          created_by: userId
        })
        .returning('id');

      const saleId = saleRecord.id || saleRecord;

      // 2. Insertamos los detalles (Productos)
      const details = data.details.map((item: any) => ({
        sale_id: saleId,
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: item.unit_price,
        unit_cost: item.unit_cost,
        line_subtotal: item.line_subtotal,
        tax_rate_applied: item.tax_rate_applied,
        tax_amount_applied: item.line_tax, // Mapeado de line_tax a tax_amount_applied
        line_tax: item.line_tax,
        line_total: item.line_total,
        line_profit: item.line_profit
      }));

      await trx('sale_details').insert(details);

      // 3. Registrar los Métodos de Pago
      const payments = data.payments.map((payment: any) => ({
        sale_id: saleId,
        payment_method_id: payment.payment_method_id,
        amount: payment.amount,
        reference_code: payment.reference_number // Mapeado de reference_number a reference_code
      }));

      await trx('sale_payments').insert(payments);

      // 4. Cerrar la Venta
      await trx('sales')
        .where('id', saleId)
        .update({ status: 'COMPLETED' });

      return {
        success: true,
        message: 'Venta completada exitosamente',
        saleId
      };
    });
  }

  async voidSale(saleId: number, userId: number, reason: string) {
    // Anulación limpia usando la función nativa de base de datos
    await this.knex.raw(
      `SELECT fn_void_sale(?, ?, ?)`,
      [saleId, userId, reason]
    );

    return {
      success: true,
      message: 'La venta ha sido anulada, los pagos revertidos y el inventario retornado al sistema.'
    };
  }

  async processPartialReturn(saleId: number, userId: number, reason: string, refundMethodId: number, items: any[]) {
    return await this.knex.transaction(async (trx) => {
      // 1. Obtener la venta original
      const sale = await trx('sales').where({ id: saleId }).first();
      if (!sale) throw new NotFoundException('Venta no encontrada');
      if (sale.status === 'VOIDED') throw new BadRequestException('La venta ya está anulada totalmente.');

      // 2. Calcular reembolsos y verificar cantidades
      let totalRefund = 0;
      const returnDetails = [];

      for (const item of items) {
        const saleDetail = await trx('sale_details')
          .where({ id: item.sale_detail_id, sale_id: saleId })
          .first();

        if (!saleDetail) {
          throw new BadRequestException(`El detalle de venta ${item.sale_detail_id} no pertenece a esta venta.`);
        }
        
        const currentReturned = Number(saleDetail.quantity_returned) || 0;
        const requestedReturn = Number(item.quantity);
        
        if (requestedReturn <= 0) {
          throw new BadRequestException(`La cantidad a devolver debe ser mayor a 0.`);
        }

        const maxReturnable = Number(saleDetail.quantity) - currentReturned;

        if (requestedReturn > maxReturnable) {
          throw new BadRequestException(
            `No puede devolver ${requestedReturn} unidades del producto ${saleDetail.product_id}. ` +
            `Solo quedan ${maxReturnable} unidades disponibles para devolver.`
          );
        }

        // Actualizar la cantidad devuelta en el detalle original
        await trx('sale_details')
          .where({ id: item.sale_detail_id })
          .update({
            quantity_returned: currentReturned + requestedReturn
          });

        const unitPrice = Number(saleDetail.unit_price);
        const lineRefund = unitPrice * requestedReturn;
        totalRefund += lineRefund;

        returnDetails.push({
          sale_detail_id: item.sale_detail_id,
          product_id: saleDetail.product_id,
          quantity_returned: requestedReturn,
          unit_price: unitPrice,
          line_refund: lineRefund,
          restock: item.restock !== undefined ? item.restock : true
        });
      }

      // 3. Crear cabecera de la Devolución
      const [saleReturnRecord] = await trx('sale_returns')
        .insert({
          original_sale_id: saleId,
          reason: reason || 'Devolución parcial a solicitud del cliente',
          status: 'COMPLETED',
          total_refund: totalRefund,
          refund_method_id: refundMethodId || null,
          created_by: userId
        })
        .returning('id');

      const saleReturnId = saleReturnRecord.id || saleReturnRecord;

      // 4. Insertar Detalles (El Trigger de Postgres se encarga de reponer el inventario si restock = true)
      const detailsToInsert = returnDetails.map(d => ({ ...d, sale_return_id: saleReturnId }));
      await trx('sale_return_details').insert(detailsToInsert);

      // 5. Marcar la venta original como 'PARTIAL_RETURN' ANTES de registrar el reembolso
      // Esto evita que el trigger 'fn_check_sale_payment' falle por tener pagos menores al total
      await trx('sales').where({ id: saleId }).update({ status: 'PARTIAL_RETURN' });

      // 6. Registrar el movimiento compensatorio (reembolso en caja)
      if (totalRefund > 0 && refundMethodId) {
        await trx('sale_payments').insert({
          sale_id: saleId,
          payment_method_id: refundMethodId,
          amount: -totalRefund,
          reference_code: `RETURN-${saleReturnId}`
        });
      }

      return {
        success: true,
        message: 'Devolución procesada. El inventario fue ajustado y el reembolso registrado en caja.',
        saleReturnId,
        totalRefund
      };
    });
  }
}

