"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CatalogsService = void 0;
const common_1 = require("@nestjs/common");
const knex_1 = require("knex");
let CatalogsService = class CatalogsService {
    knex;
    constructor(knex) {
        this.knex = knex;
    }
    async findAll(table) {
        return await this.knex(table).select('*').orderBy('id', 'asc');
    }
    async findOne(table, id) {
        const record = await this.knex(table).where({ id }).first();
        if (!record)
            throw new common_1.NotFoundException(`Registro no encontrado en ${table}`);
        return record;
    }
    async create(table, data) {
        const [newRecord] = await this.knex(table).insert(data).returning('*');
        return { success: true, data: newRecord };
    }
    async update(table, id, data) {
        const [updated] = await this.knex(table).where({ id }).update(data).returning('*');
        if (!updated)
            throw new common_1.NotFoundException(`Registro no encontrado en ${table}`);
        return { success: true, data: updated };
    }
};
exports.CatalogsService = CatalogsService;
exports.CatalogsService = CatalogsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)('KNEX_CONNECTION')),
    __metadata("design:paramtypes", [Function])
], CatalogsService);
//# sourceMappingURL=catalogs.service.js.map