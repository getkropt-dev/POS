import { Knex } from 'knex';
export declare class CustomersService {
    private readonly knex;
    constructor(knex: Knex);
    findAll(searchQuery?: string): Promise<any[]>;
    findOne(id: number): Promise<any>;
    create(data: any): Promise<{
        success: boolean;
        customer: any;
    }>;
    update(id: number, data: any): Promise<{
        success: boolean;
        customer: any;
    }>;
    getDebts(): Promise<any[]>;
    payDebt(customerId: number, amount: number, paymentMethodId: number, idempotencyKey: string, userId: number, notes?: string): Promise<{
        success: boolean;
        message: string;
        paymentId: any;
        amountPaid: number;
        previousBalance?: undefined;
        newBalance?: undefined;
    } | {
        success: boolean;
        message: string;
        paymentId: any;
        previousBalance: number;
        amountPaid: number;
        newBalance: number;
    }>;
}
