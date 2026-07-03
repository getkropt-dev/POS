import { JwtService } from '@nestjs/jwt';
import { Knex } from 'knex';
export declare class AuthService {
    private readonly knex;
    private jwtService;
    constructor(knex: Knex, jwtService: JwtService);
    validateUser(username: string, pass: string): Promise<any>;
    login(user: any): Promise<{
        access_token: string;
        user: {
            id: any;
            username: any;
            role: any;
            full_name: any;
        };
    }>;
}
