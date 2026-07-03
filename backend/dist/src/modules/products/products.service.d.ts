import { Knex } from 'knex';
export declare class ProductsService {
    private readonly knex;
    constructor(knex: Knex);
    private mapToFrontend;
    private mapToDatabase;
    findAll(searchQuery?: string): Promise<any[]>;
    findOne(id: number): Promise<any>;
    create(data: any): Promise<{
        success: boolean;
        product: any;
    }>;
    update(id: number, data: any): Promise<{
        success: boolean;
        product: any;
    }>;
    remove(id: number): Promise<{
        success: boolean;
        message: string;
    }>;
    suggestSellingPrice(id: number, marginPercent: number): Promise<{
        success: boolean;
        product_id: number;
        margin_applied: number;
        suggested_selling_price: number;
    }>;
}
