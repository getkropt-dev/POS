import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
import { PurchasesService } from './purchases.service';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('purchases')
export class PurchasesController {
  constructor(private readonly purchasesService: PurchasesService) {}

  @Post()
  async createPurchaseInvoice(@Body() body: any, @Request() req: any) {
    const userId = req.user.userId; 
    return await this.purchasesService.createInvoice(body, userId);
  }

  @Post('assign-period')
  async assignPeriod(@Body() body: { invoiceIds: number[], period: string, include: boolean }) {
    return await this.purchasesService.assignTaxPeriod(body.invoiceIds, body.period, body.include);
  }
}

