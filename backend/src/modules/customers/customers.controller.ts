import { Controller, Get, Post, Put, Param, Body, Query, UseGuards, Request } from '@nestjs/common';
import { CustomersService } from './customers.service';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('customers')
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Get()
  async getAll(@Query('search') search?: string) {
    return await this.customersService.findAll(search);
  }

  @Get('debts')
  async getDebts() {
    return await this.customersService.getDebts();
  }

  @Get(':id')
  async getOne(@Param('id') id: string) {
    return await this.customersService.findOne(Number(id));
  }

  @Post()
  async create(@Body() body: any) {
    return await this.customersService.create(body);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() body: any) {
    return await this.customersService.update(Number(id), body);
  }

  @Post(':id/pay-debt')
  async payDebt(
    @Param('id') id: string,
    @Body('amount') amount: number,
    @Body('paymentMethodId') paymentMethodId: number,
    @Body('idempotencyKey') idempotencyKey: string,
    @Body('notes') notes: string,
    @Request() req: any
  ) {
    const userId = req.user.userId;
    return await this.customersService.payDebt(Number(id), amount, paymentMethodId, idempotencyKey, userId, notes);
  }
}


