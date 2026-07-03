import { Controller, Get, Post, Body, Param, Put, Query, UseGuards, Request } from '@nestjs/common';
import { SalesService } from './sales.service';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('sales')
export class SalesController {
  constructor(private readonly salesService: SalesService) {}

  @Get()
  async getSales(@Query() query: any) {
    return await this.salesService.getSales(query);
  }

  @Get(':id')
  async getSaleById(@Param('id') id: string) {
    return await this.salesService.getSaleById(Number(id));
  }

  @Post()
  async createSale(@Body() body: any, @Request() req: any) {
    const userId = req.user.userId;
    // La sesión de caja debería venir del Body o consultarse con userId
    const cashSessionId = body.cash_session_id; 
    
    return await this.salesService.createSale(body, userId, cashSessionId);
  }

  @Put(':id/void')
  async voidSale(@Param('id') id: string, @Body('reason') reason: string, @Request() req: any) {
    const userId = req.user.userId;
    return await this.salesService.voidSale(Number(id), userId, reason);
  }

  @Post(':id/returns')
  async processReturn(
    @Param('id') id: string,
    @Body('reason') reason: string,
    @Body('refundMethodId') refundMethodId: number,
    @Body('items') items: any[],
    @Request() req: any
  ) {
    const userId = req.user.userId;
    return await this.salesService.processPartialReturn(Number(id), userId, reason, refundMethodId, items);
  }
}


