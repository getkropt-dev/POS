import { ProductsService } from './products.service';
export declare class ProductsController {
    private readonly productsService;
    constructor(productsService: ProductsService);
    getAll(search?: string): Promise<any[]>;
    getOne(id: string): Promise<any>;
    create(body: any): Promise<{
        success: boolean;
        product: any;
    }>;
    update(id: string, body: any): Promise<{
        success: boolean;
        product: any;
    }>;
    delete(id: string): Promise<{
        success: boolean;
        message: string;
    }>;
    suggestPrice(id: string, margin: string): Promise<{
        success: boolean;
        product_id: number;
        margin_applied: number;
        suggested_selling_price: number;
    }>;
}
