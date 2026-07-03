import { UsersService } from './users.service';
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
    getRoles(): Promise<any[]>;
    getAll(search?: string): Promise<any[]>;
    getOne(id: string): Promise<any>;
    create(body: any): Promise<{
        success: boolean;
        user: any;
    }>;
    update(id: string, body: any, req: any): Promise<{
        success: boolean;
        user: any;
    }>;
    delete(id: string): Promise<{
        success: boolean;
        message: string;
    }>;
}
