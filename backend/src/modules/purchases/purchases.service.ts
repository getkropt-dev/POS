import { Injectable, Inject } from '@nestjs/common';
import { Knex } from 'knex';

@Injectable()
export class PurchasesService {
  constructor(@Inject('KNEX_CONNECTION') private readonly knex: Knex) {}

  async createInvoice(data: any, userId: number) {
    // Utilizamos una transacción atómica de Knex
    return await this.knex.transaction(async (trx) => {
      // 0. VERIFICAR IDEMPOTENCIA
      // Comprobamos que el proveedor no esté ingresando la misma factura dos veces
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

      // 1. Insertamos la Cabecera de la Factura
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

      // 2. Insertamos los Detalles
      // Al hacer esto, Postgres disparará automáticamente el trigger "trg_after_purchase_item"
      // calculando el nuevo Costo Promedio Ponderado e insertando los registros en el Kardex.
      const detailsToInsert = data.details.map((detail: any) => ({
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

  async assignTaxPeriod(invoiceIds: number[], period: string, include: boolean) {
    // Llamamos directamente a nuestro Procedimiento Almacenado
    // Nota: Pasamos el array nativamente a PostgreSQL usando parámetros
    await this.knex.raw(
      `SELECT fn_asignar_facturas_a_periodo(?, ?, ?)`,
      [invoiceIds, period, include]
    );

    return { 
      success: true, 
      message: `Las facturas han sido asignadas al periodo fiscal ${period}.` 
    };
  }
}
