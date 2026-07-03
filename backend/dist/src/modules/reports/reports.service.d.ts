import { Knex } from 'knex';
export declare class ReportsService {
    private readonly knex;
    constructor(knex: Knex);
    getRegimenSimplificadoReport(periodoDeclarado?: string): Promise<any[]>;
    getPendingTaxInvoices(): Promise<any[]>;
    getTaxLiquidationReport(): Promise<any[]>;
    getLimitAlertReport(): Promise<any[]>;
    getAbcAnalysis(): Promise<any[]>;
    getKardex(productId: number): Promise<any[]>;
    getLowStock(): Promise<any[]>;
    getDailySales(): Promise<any[]>;
    getSalesByPayment(): Promise<any[]>;
    refreshMaterializedViews(): Promise<{
        success: boolean;
        message: string;
    }>;
    getSalesProfitsReport(startDate?: string, endDate?: string, categoryId?: string): Promise<any[]>;
    getCashSessionsReport(startDate?: string, endDate?: string): Promise<any[]>;
    getInventoryMovementsReport(startDate?: string, endDate?: string): Promise<any[]>;
    getPurchasesBillingReport(startDate?: string, endDate?: string, period?: string, includeInDeclaration?: string): Promise<any[]>;
    getCustomerCreditReport(startDate?: string, endDate?: string, customerId?: string): Promise<any[]>;
    getExecutiveSalesReport(startDate?: string, endDate?: string): Promise<{
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
