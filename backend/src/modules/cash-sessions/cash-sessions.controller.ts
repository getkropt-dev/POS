import { Controller, Post, Get, Body, UseGuards, Request } from '@nestjs/common';
import { CashSessionsService } from './cash-sessions.service';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('cash-sessions')
export class CashSessionsController {
  constructor(private readonly cashSessionsService: CashSessionsService) {}

  @Post('open')
  async openSession(@Body('opening_balance') balance: number, @Body('notes') notes: string, @Request() req: any) {
    const userId = req.user.userId; 
    return await this.cashSessionsService.openSession(userId, balance, notes);
  }

  @Get('current')
  async getCurrentSession(@Request() req: any) {
    const userId = req.user.userId;
    return await this.cashSessionsService.getCurrentSession(userId);
  }

  @Post('close')
  async closeSession(@Body('actual_balance') actualBalance: number, @Body('notes') notes: string, @Request() req: any) {
    const userId = req.user.userId; 
    return await this.cashSessionsService.closeSession(userId, actualBalance, notes);
  }
}

