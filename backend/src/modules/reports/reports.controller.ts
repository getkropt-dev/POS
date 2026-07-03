import { Controller, Get, Query, Param, Post, UseGuards } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('regimen-simplificado')
  async getRegimenSimplificado(@Query('periodo') periodo?: string) {
    return await this.reportsService.getRegimenSimplificadoReport(periodo);
  }

  @Get('pending-invoices')
  async getPendingInvoices() {
    return await this.reportsService.getPendingTaxInvoices();
  }

  @Get('tax-liquidation')
  async getTaxLiquidation() {
    return await this.reportsService.getTaxLiquidationReport();
  }

  @Get('limit-alert')
  async getLimitAlert() {
    return await this.reportsService.getLimitAlertReport();
  }

  // --- DASHBOARD ---
  @Get('dashboard/abc-analysis')
  async getAbcAnalysis() {
    return await this.reportsService.getAbcAnalysis();
  }

  @Get('dashboard/low-stock')
  async getLowStock() {
    return await this.reportsService.getLowStock();
  }

  @Get('dashboard/daily-sales')
  async getDailySales() {
    return await this.reportsService.getDailySales();
  }

  @Get('dashboard/sales-by-payment')
  async getSalesByPayment() {
    return await this.reportsService.getSalesByPayment();
  }

  // --- KARDEX ---
  @Get('kardex/:productId')
  async getKardex(@Param('productId') productId: string) {
    return await this.reportsService.getKardex(Number(productId));
  }

  // --- ADMINISTRACIÓN ---
  @Post('refresh-views')
  async refreshViews() {
    // Idealmente, esto debería tener un guard de roles (RoleGuard) para que solo ADMIN pueda ejecutarlo
    return await this.reportsService.refreshMaterializedViews();
  }

  // --- REPORTES ANALÍTICOS NUEVOS ---
  @Get('sales-profits')
  async getSalesProfits(
    @Query('startDate') startDate?: string, 
    @Query('endDate') endDate?: string,
    @Query('categoryId') categoryId?: string
  ) {
    return await this.reportsService.getSalesProfitsReport(startDate, endDate, categoryId);
  }

  @Get('cash-sessions')
  async getCashSessions(@Query('startDate') startDate?: string, @Query('endDate') endDate?: string) {
    return await this.reportsService.getCashSessionsReport(startDate, endDate);
  }

  @Get('inventory-movements')
  async getInventoryMovements(@Query('startDate') startDate?: string, @Query('endDate') endDate?: string) {
    return await this.reportsService.getInventoryMovementsReport(startDate, endDate);
  }

  @Get('purchases-billing')
  async getPurchasesBilling(
    @Query('startDate') startDate?: string, 
    @Query('endDate') endDate?: string,
    @Query('period') period?: string,
    @Query('includeInDeclaration') includeInDeclaration?: string
  ) {
    return await this.reportsService.getPurchasesBillingReport(startDate, endDate, period, includeInDeclaration);
  }

  @Get('customer-credit')
  async getCustomerCredit(
    @Query('startDate') startDate?: string, 
    @Query('endDate') endDate?: string,
    @Query('customerId') customerId?: string
  ) {
    if (customerId) {
      return await this.reportsService.getCustomerCreditReport(startDate, endDate, customerId);
    }
    return await this.reportsService.getCustomerCreditReport(startDate, endDate);
  }

  @Get('executive-sales')
  async getExecutiveSales(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string
  ) {
    return await this.reportsService.getExecutiveSalesReport(startDate, endDate);
  }
}
