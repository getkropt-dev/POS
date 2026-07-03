import { Controller, Post, Body, UseGuards, Request, ForbiddenException, Get, Param } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Post('adjust')
  async adjustInventory(
    @Body('productId') productId: number,
    @Body('adjustmentType') adjustmentType: 'IN' | 'OUT',
    @Body('quantity') quantity: number,
    @Body('reason') reason: string,
    @Body('transactionId') transactionId: string,
    @Request() req: any
  ) {
    const userRole = req.user.role;
    // Solo permitimos ajustes a los administradores para proteger el Kardex
    if (userRole !== 'ADMIN') {
      throw new ForbiddenException('Acceso denegado: Solo el rol ADMIN puede realizar ajustes manuales de inventario.');
    }

    const userId = req.user.userId;
    return await this.inventoryService.adjustStock(productId, userId, adjustmentType, quantity, reason, transactionId);
  }

  @Get(':productId/movements')
  async getMovements(@Param('productId') productId: string) {
    return await this.inventoryService.getProductMovements(Number(productId));
  }
}
