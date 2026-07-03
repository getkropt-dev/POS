import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { Knex } from 'knex';

@Injectable()
export class InventoryService {
  constructor(@Inject('KNEX_CONNECTION') private readonly knex: Knex) {}

  async adjustStock(productId: number, userId: number, adjustmentType: 'IN' | 'OUT', quantity: number, reason: string, transactionId: string) {
    if (quantity <= 0) {
      throw new BadRequestException('La cantidad a ajustar debe ser mayor a cero.');
    }

    if (!transactionId) {
      throw new BadRequestException('Se requiere un transactionId único para garantizar la idempotencia.');
    }

    return await this.knex.transaction(async (trx) => {
      // 0. VERIFICAR IDEMPOTENCIA
      const existingMovement = await trx('inventory_movements')
        .where({ transaction_id: transactionId })
        .first();

      if (existingMovement) {
        return {
          success: true,
          message: 'Ajuste ya procesado anteriormente (Idempotencia).',
          movementId: existingMovement.id,
          stockAfter: existingMovement.stock_after
        };
      }

      // 1. Bloquear la fila del producto para evitar inconsistencias matemáticas concurrentes
      const product = await trx('products').where({ id: productId }).forUpdate().first();
      
      if (!product) throw new NotFoundException('Producto no encontrado.');
      if (!product.manages_inventory) throw new BadRequestException('Este producto es un servicio y no maneja inventario físico.');

      let stockBefore = Number(product.stock);
      let stockAfter = stockBefore;
      let movementType = '';

      if (adjustmentType === 'IN') {
        stockAfter += quantity;
        movementType = 'ADJUSTMENT_IN';
      } else if (adjustmentType === 'OUT') {
        if (stockBefore < quantity) {
          throw new BadRequestException(`No hay suficiente stock para hacer un ajuste de salida. Actual: ${stockBefore}, Solicitado: ${quantity}`);
        }
        stockAfter -= quantity;
        movementType = 'ADJUSTMENT_OUT';
      } else {
        throw new BadRequestException('El tipo de ajuste debe ser IN o OUT.');
      }

      // 2. Modificar el stock
      await trx('products')
        .where({ id: productId })
        .update({ stock: stockAfter, updated_at: this.knex.fn.now() });

      // 3. Dejar el rastro de auditoría en el Kardex y sellar la transacción
      const [movementRecord] = await trx('inventory_movements').insert({
        product_id: productId,
        movement_type: movementType,
        quantity: quantity,
        stock_before: stockBefore,
        stock_after: stockAfter,
        unit_cost: product.current_cost,
        reference_type: 'MANUAL_ADJUSTMENT',
        reference_id: null,
        transaction_id: transactionId,
        notes: reason || 'Ajuste manual administrativo',
        created_by: userId
      }).returning('id');

      return {
        success: true,
        message: 'Ajuste de inventario aplicado exitosamente.',
        productId: productId,
        movementId: movementRecord.id || movementRecord,
        stockBefore: stockBefore,
        stockAfter: stockAfter,
        movementType: movementType
      };
    });
  }

  async getProductMovements(productId: number) {
    return await this.knex('inventory_movements as im')
      .select('im.*', 'u.full_name as created_by_name')
      .leftJoin('users as u', 'im.created_by', 'u.id')
      .where('im.product_id', productId)
      .orderBy('im.created_at', 'desc');
  }
}

