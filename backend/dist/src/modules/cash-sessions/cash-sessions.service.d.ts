import { Knex } from 'knex';
export declare class CashSessionsService {
    private readonly knex;
    constructor(knex: Knex);
    openSession(userId: number, openingBalance: number, notes?: string): Promise<{
        success: boolean;
        message: string;
        session: any;
    }>;
    getCurrentSession(userId: number): Promise<{
        session: any;
        live_metrics: {
            total_cash_sales: number;
            expected_balance: number;
        };
    }>;
    closeSession(userId: number, actualBalance: number, notes?: string): Promise<{
        success: boolean;
        message: string;
        result: {
            expected_balance: number;
            actual_balance: number;
            difference: number;
            status: string;
        };
    }>;
}
