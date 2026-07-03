import { CatalogsService } from './catalogs.service';
export declare class CatalogsController {
    private readonly catalogsService;
    constructor(catalogsService: CatalogsService);
    getCategories(): Promise<any[]>;
    createCategory(body: any): Promise<{
        success: boolean;
        data: any;
    }>;
    updateCategory(id: string, body: any): Promise<{
        success: boolean;
        data: any;
    }>;
    getPaymentMethods(): Promise<any[]>;
    createPaymentMethod(body: any): Promise<{
        success: boolean;
        data: any;
    }>;
    updatePaymentMethod(id: string, body: any): Promise<{
        success: boolean;
        data: any;
    }>;
    getTaxRates(): Promise<any[]>;
    createTaxRate(body: any): Promise<{
        success: boolean;
        data: any;
    }>;
    updateTaxRate(id: string, body: any): Promise<{
        success: boolean;
        data: any;
    }>;
    getSuppliers(): Promise<any[]>;
    createSupplier(body: any): Promise<{
        success: boolean;
        data: any;
    }>;
    updateSupplier(id: string, body: any): Promise<{
        success: boolean;
        data: any;
    }>;
}
