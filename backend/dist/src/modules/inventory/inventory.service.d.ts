import { Knex } from 'knex';
export declare class InventoryService {
    private readonly knex;
    constructor(knex: Knex);
    adjustStock(productId: number, userId: number, adjustmentType: 'IN' | 'OUT', quantity: number, reason: string, transactionId: string): Promise<{
        success: boolean;
        message: string;
        movementId: any;
        stockAfter: any;
        productId?: undefined;
        stockBefore?: undefined;
        movementType?: undefined;
    } | {
        success: boolean;
        message: string;
        productId: number;
        movementId: any;
        stockBefore: number;
        stockAfter: number;
        movementType: string;
    }>;
    getProductMovements(productId: number): Promise<any[]>;
}
