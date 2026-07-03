import { CashSessionsService } from './cash-sessions.service';
export declare class CashSessionsController {
    private readonly cashSessionsService;
    constructor(cashSessionsService: CashSessionsService);
    openSession(balance: number, notes: string, req: any): Promise<{
        success: boolean;
        message: string;
        session: any;
    }>;
    getCurrentSession(req: any): Promise<{
        session: any;
        live_metrics: {
            total_cash_sales: number;
            expected_balance: number;
        };
    }>;
    closeSession(actualBalance: number, notes: string, req: any): Promise<{
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
