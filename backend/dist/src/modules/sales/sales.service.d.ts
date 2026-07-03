import { Knex } from 'knex';
export declare class SalesService {
    private readonly knex;
    constructor(knex: Knex);
    getSales(query: any): Promise<any[]>;
    getSaleById(id: number): Promise<any>;
    createSale(data: any, userId: number, cashSessionId: number): Promise<{
        success: boolean;
        message: string;
        saleId: any;
    }>;
    voidSale(saleId: number, userId: number, reason: string): Promise<{
        success: boolean;
        message: string;
    }>;
    processPartialReturn(saleId: number, userId: number, reason: string, refundMethodId: number, items: any[]): Promise<{
        success: boolean;
        message: string;
        saleReturnId: any;
        totalRefund: number;
    }>;
}
