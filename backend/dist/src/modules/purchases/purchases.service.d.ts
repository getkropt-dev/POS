import { Knex } from 'knex';
export declare class PurchasesService {
    private readonly knex;
    constructor(knex: Knex);
    createInvoice(data: any, userId: number): Promise<{
        success: boolean;
        message: string;
        invoiceId: any;
    }>;
    assignTaxPeriod(invoiceIds: number[], period: string, include: boolean): Promise<{
        success: boolean;
        message: string;
    }>;
}
