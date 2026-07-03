import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { ProductsService } from './products.service';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  async getAll(@Query('search') search?: string) {
    return await this.productsService.findAll(search);
  }

  @Get(':id')
  async getOne(@Param('id') id: string) {
    return await this.productsService.findOne(Number(id));
  }

  @Post()
  async create(@Body() body: any) {
    return await this.productsService.create(body);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() body: any) {
    return await this.productsService.update(Number(id), body);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return await this.productsService.remove(Number(id));
  }

  @Get(':id/suggest-price')
  async suggestPrice(
    @Param('id') id: string, 
    @Query('margin') margin: string
  ) {
    // Si el usuario no manda un margen de ganancia por URL, asumimos 30% por defecto
    const marginPercent = margin ? Number(margin) : 30;
    return await this.productsService.suggestSellingPrice(Number(id), marginPercent);
  }
}
