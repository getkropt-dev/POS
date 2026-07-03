import { CustomersService } from './customers.service';
export declare class CustomersController {
    private readonly customersService;
    constructor(customersService: CustomersService);
    getAll(search?: string): Promise<any[]>;
    getDebts(): Promise<any[]>;
    getOne(id: string): Promise<any>;
    create(body: any): Promise<{
        success: boolean;
        customer: any;
    }>;
    update(id: string, body: any): Promise<{
        success: boolean;
        customer: any;
    }>;
    payDebt(id: string, amount: number, paymentMethodId: number, idempotencyKey: string, notes: string, req: any): Promise<{
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
