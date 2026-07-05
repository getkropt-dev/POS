import { Injectable, Inject } from '@nestjs/common';
import { Knex } from 'knex';

@Injectable()
export class ReportsService {
  constructor(@Inject('KNEX_CONNECTION') private readonly knex: Knex) {}

  async getRegimenSimplificadoReport(periodoDeclarado?: string) {
    const query = this.knex('vw_reporte_regimen_simplificado_cr_v2').select('*');
    
    if (periodoDeclarado) {
      query.where('periodo_declarado', periodoDeclarado);
    }
    
    // Sort logic is already handled by the DB view if no where is applied
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

  // --- DASHBOARD & FINANZAS ---
  async getAbcAnalysis() {
    return await this.knex('vw_inventory_abc_analysis').select('*');
  }

  async getKardex(productId: number) {
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

  // --- NUEVOS REPORTES ANALÍTICOS ---
  async getSalesProfitsReport(startDate?: string, endDate?: string, categoryId?: string) {
    const query = this.knex('v_sales_with_categories').select('*').orderBy('sale_date', 'desc');

    if (startDate) {
      query.where('sale_date', '>=', startDate);
    }
    if (endDate) {
      query.where('sale_date', '<=', endDate);
    }
    if (categoryId) {
      query.where('category_id', categoryId);
    }

    return await query;
  }

  async getCashSessionsReport(startDate?: string, endDate?: string) {
    const query = this.knex('v_cash_sessions_report')
      .select('*')
      .orderBy('open_date', 'desc');

    if (startDate) {
      query.where('open_date', '>=', startDate);
    }
    if (endDate) {
      query.where('open_date', '<=', endDate);
    }

    return await query;
  }

  async getInventoryMovementsReport(startDate?: string, endDate?: string) {
    const query = this.knex('v_inventory_movements_report')
      .select('*')
      .orderBy('movement_date', 'desc');

    if (startDate) {
      query.where('movement_date', '>=', startDate);
    }
    if (endDate) {
      query.where('movement_date', '<=', endDate);
    }

    return await query;
  }

  async getPurchasesBillingReport(startDate?: string, endDate?: string, period?: string, includeInDeclaration?: string) {
    const query = this.knex('v_purchases_billing_report')
      .select('*')
      .orderBy('purchase_date', 'desc');

    if (startDate) {
      query.where('purchase_date', '>=', startDate);
    }
    if (endDate) {
      query.where('purchase_date', '<=', endDate);
    }
    if (period) {
      query.where('assigned_tax_period', period);
    }
    if (includeInDeclaration !== undefined && includeInDeclaration !== '') {
      query.where('include_in_declaration', includeInDeclaration === 'true');
    }

    return await query;
  }

  async getCustomerCreditReport(startDate?: string, endDate?: string, customerId?: string) {
    const query = this.knex('v_customer_credit_report')
      .select('*')
      .orderBy('payment_date', 'desc');

    if (startDate) {
      query.where('payment_date', '>=', startDate);
    }
    if (endDate) {
      query.where('payment_date', '<=', endDate);
    }
    if (customerId) {
      query.where('customer_id', customerId);
    }

    return await query;
  }

  async getExecutiveSalesReport(startDate?: string, endDate?: string) {
    // 1. Set default dates to today if not provided
    const start = startDate || new Date(new Date().setHours(0,0,0,0)).toISOString();
    const end = endDate || new Date(new Date().setHours(23,59,59,999)).toISOString();

    // 2. Summary (Total Sales and Total Profit)
    const summaryResult = await this.knex('sales')
      .join('sale_details', 'sales.id', 'sale_details.sale_id')
      .where('sales.status', 'COMPLETED')
      .where('sales.sale_date', '>=', start)
      .where('sales.sale_date', '<=', end)
      .sum({ totalSales: 'sale_details.line_total', totalProfit: 'sale_details.line_profit' })
      .first();

    const totalSales = Number(summaryResult?.totalSales || 0);
    const totalProfit = Number(summaryResult?.totalProfit || 0);

    interface PaymentMethodSummary {
      name: string;
      totalAmount: number;
    }

    // 3. Breakdown by Payment Method
    const paymentMethodsResult = await this.knex<any, PaymentMethodSummary[]>('sales')
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

    interface CategorySummary {
      name: string;
      quantity: number;
      totalAmount: number;
    }

    // 4. Breakdown by Category
    const categoriesResult = await this.knex<any, CategorySummary[]>('sales')
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
}
