import { Knex } from 'knex';
export declare class UsersService {
    private readonly knex;
    constructor(knex: Knex);
    findAll(searchQuery?: string): Promise<any[]>;
    findOne(id: number): Promise<any>;
    getRoles(): Promise<any[]>;
    create(data: any): Promise<{
        success: boolean;
        user: any;
    }>;
    update(id: number, data: any, requesterId: number): Promise<{
        success: boolean;
        user: any;
    }>;
    delete(id: number): Promise<{
        success: boolean;
        message: string;
    }>;
}
