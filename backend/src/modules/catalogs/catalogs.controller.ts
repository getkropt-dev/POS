import { Controller, Get, Post, Put, Body, Param, UseGuards } from '@nestjs/common';
import { CatalogsService } from './catalogs.service';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('catalogs')
export class CatalogsController {
  constructor(private readonly catalogsService: CatalogsService) {}

  // --- CATEGORÍAS ---
  @Get('categories')
  async getCategories() { return this.catalogsService.findAll('categories'); }
  
  @Post('categories')
  async createCategory(@Body() body: any) { return this.catalogsService.create('categories', body); }
  
  @Put('categories/:id')
  async updateCategory(@Param('id') id: string, @Body() body: any) { return this.catalogsService.update('categories', Number(id), body); }

  // --- MÉTODOS DE PAGO ---
  @Get('payment-methods')
  async getPaymentMethods() { return this.catalogsService.findAll('payment_methods'); }
  
  @Post('payment-methods')
  async createPaymentMethod(@Body() body: any) { return this.catalogsService.create('payment_methods', body); }
  
  @Put('payment-methods/:id')
  async updatePaymentMethod(@Param('id') id: string, @Body() body: any) { return this.catalogsService.update('payment_methods', Number(id), body); }

  // --- IMPUESTOS (RÉGIMEN SIMPLIFICADO) ---
  @Get('tax-rates')
  async getTaxRates() { return this.catalogsService.findAll('tax_rates'); }
  
  @Post('tax-rates')
  async createTaxRate(@Body() body: any) { return this.catalogsService.create('tax_rates', body); }
  
  @Put('tax-rates/:id')
  async updateTaxRate(@Param('id') id: string, @Body() body: any) { return this.catalogsService.update('tax_rates', Number(id), body); }

  // --- PROVEEDORES ---
  @Get('suppliers')
  async getSuppliers() { return this.catalogsService.findAll('suppliers'); }
  
  @Post('suppliers')
  async createSupplier(@Body() body: any) { return this.catalogsService.create('suppliers', body); }
  
  @Put('suppliers/:id')
  async updateSupplier(@Param('id') id: string, @Body() body: any) { return this.catalogsService.update('suppliers', Number(id), body); }
}
