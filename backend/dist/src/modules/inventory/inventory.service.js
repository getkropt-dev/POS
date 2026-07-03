"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InventoryService = void 0;
const common_1 = require("@nestjs/common");
const knex_1 = require("knex");
let InventoryService = class InventoryService {
    knex;
    constructor(knex) {
        this.knex = knex;
    }
    async adjustStock(productId, userId, adjustmentType, quantity, reason, transactionId) {
        if (quantity <= 0) {
            throw new common_1.BadRequestException('La cantidad a ajustar debe ser mayor a cero.');
        }
        if (!transactionId) {
            throw new common_1.BadRequestException('Se requiere un transactionId único para garantizar la idempotencia.');
        }
        return await this.knex.transaction(async (trx) => {
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
            const product = await trx('products').where({ id: productId }).forUpdate().first();
            if (!product)
                throw new common_1.NotFoundException('Producto no encontrado.');
            if (!product.manages_inventory)
                throw new common_1.BadRequestException('Este producto es un servicio y no maneja inventario físico.');
            let stockBefore = Number(product.stock);
            let stockAfter = stockBefore;
            let movementType = '';
            if (adjustmentType === 'IN') {
                stockAfter += quantity;
                movementType = 'ADJUSTMENT_IN';
            }
            else if (adjustmentType === 'OUT') {
                if (stockBefore < quantity) {
                    throw new common_1.BadRequestException(`No hay suficiente stock para hacer un ajuste de salida. Actual: ${stockBefore}, Solicitado: ${quantity}`);
                }
                stockAfter -= quantity;
                movementType = 'ADJUSTMENT_OUT';
            }
            else {
                throw new common_1.BadRequestException('El tipo de ajuste debe ser IN o OUT.');
            }
            await trx('products')
                .where({ id: productId })
                .update({ stock: stockAfter, updated_at: this.knex.fn.now() });
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
    async getProductMovements(productId) {
        return await this.knex('inventory_movements as im')
            .select('im.*', 'u.full_name as created_by_name')
            .leftJoin('users as u', 'im.created_by', 'u.id')
            .where('im.product_id', productId)
            .orderBy('im.created_at', 'desc');
    }
};
exports.InventoryService = InventoryService;
exports.InventoryService = InventoryService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)('KNEX_CONNECTION')),
    __metadata("design:paramtypes", [Function])
], InventoryService);
//# sourceMappingURL=inventory.service.js.map