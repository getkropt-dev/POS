import { PurchasesService } from './purchases.service';
export declare class PurchasesController {
    private readonly purchasesService;
    constructor(purchasesService: PurchasesService);
    createPurchaseInvoice(body: any, req: any): Promise<{
        success: boolean;
        message: string;
        invoiceId: any;
    }>;
    assignPeriod(body: {
        invoiceIds: number[];
        period: string;
        include: boolean;
    }): Promise<{
        success: boolean;
        message: string;
    }>;
}
