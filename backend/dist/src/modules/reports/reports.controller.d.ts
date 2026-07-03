import { ReportsService } from './reports.service';
export declare class ReportsController {
    private readonly reportsService;
    constructor(reportsService: ReportsService);
    getRegimenSimplificado(periodo?: string): Promise<any[]>;
    getPendingInvoices(): Promise<any[]>;
    getTaxLiquidation(): Promise<any[]>;
    getLimitAlert(): Promise<any[]>;
    getAbcAnalysis(): Promise<any[]>;
    getLowStock(): Promise<any[]>;
    getDailySales(): Promise<any[]>;
    getSalesByPayment(): Promise<any[]>;
    getKardex(productId: string): Promise<any[]>;
    refreshViews(): Promise<{
        success: boolean;
        message: string;
    }>;
    getSalesProfits(startDate?: string, endDate?: string, categoryId?: string): Promise<any[]>;
    getCashSessions(startDate?: string, endDate?: string): Promise<any[]>;
    getInventoryMovements(startDate?: string, endDate?: string): Promise<any[]>;
    getPurchasesBilling(startDate?: string, endDate?: string, period?: string, includeInDeclaration?: string): Promise<any[]>;
    getCustomerCredit(startDate?: string, endDate?: string, customerId?: string): Promise<any[]>;
    getExecutiveSales(startDate?: string, endDate?: string): Promise<{
        summary: {
            totalSales: number;
            totalProfit: number;
        };
        paymentMethods: {
            name: any;
            totalAmount: number;
            percentage: number;
        }[];
        categories: {
            name: any;
            quantity: number;
            totalAmount: number;
            percentage: number;
        }[];
    }>;
}
