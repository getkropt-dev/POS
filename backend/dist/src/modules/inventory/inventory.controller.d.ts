import { InventoryService } from './inventory.service';
export declare class InventoryController {
    private readonly inventoryService;
    constructor(inventoryService: InventoryService);
    adjustInventory(productId: number, adjustmentType: 'IN' | 'OUT', quantity: number, reason: string, transactionId: string, req: any): Promise<{
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
    getMovements(productId: string): Promise<any[]>;
}
