import { Knex } from 'knex';
export declare class CatalogsService {
    private readonly knex;
    constructor(knex: Knex);
    findAll(table: string): Promise<any[]>;
    findOne(table: string, id: number): Promise<any>;
    create(table: string, data: any): Promise<{
        success: boolean;
        data: any;
    }>;
    update(table: string, id: number, data: any): Promise<{
        success: boolean;
        data: any;
    }>;
}
