"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatabaseModule = void 0;
const common_1 = require("@nestjs/common");
const knex_1 = __importDefault(require("knex"));
const KnexProvider = {
    provide: 'KNEX_CONNECTION',
    useFactory: () => {
        return (0, knex_1.default)({
            client: 'pg',
            connection: {
                host: process.env.DB_HOST || '127.0.0.1',
                user: process.env.DB_USER || 'postgres',
                password: process.env.DB_PASSWORD || 'postgres',
                database: process.env.DB_NAME || 'pos_db',
                port: Number(process.env.DB_PORT) || 5432,
                ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
            },
            pool: { min: 2, max: 10 },
        });
    },
};
let DatabaseModule = class DatabaseModule {
};
exports.DatabaseModule = DatabaseModule;
exports.DatabaseModule = DatabaseModule = __decorate([
    (0, common_1.Global)(),
    (0, common_1.Module)({
        providers: [KnexProvider],
        exports: [KnexProvider],
    })
], DatabaseModule);
//# sourceMappingURL=database.module.js.map