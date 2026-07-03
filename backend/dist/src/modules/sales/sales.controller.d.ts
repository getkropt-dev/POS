import { SalesService } from './sales.service';
export declare class SalesController {
    private readonly salesService;
    constructor(salesService: SalesService);
    getSales(query: any): Promise<any[]>;
    getSaleById(id: string): Promise<any>;
    createSale(body: any, req: any): Promise<{
        success: boolean;
        message: string;
        saleId: any;
    }>;
    voidSale(id: string, reason: string, req: any): Promise<{
        success: boolean;
        message: string;
    }>;
    processReturn(id: string, reason: string, refundMethodId: number, items: any[], req: any): Promise<{
        success: boolean;
        message: string;
        saleReturnId: any;
        totalRefund: number;
    }>;
}
