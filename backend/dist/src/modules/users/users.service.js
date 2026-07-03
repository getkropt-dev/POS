"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const knex_1 = require("knex");
const bcrypt = __importStar(require("bcrypt"));
let UsersService = class UsersService {
    knex;
    constructor(knex) {
        this.knex = knex;
    }
    async findAll(searchQuery) {
        const query = this.knex('users')
            .join('roles', 'users.role_id', 'roles.id')
            .select('users.id', 'users.username', 'users.full_name', 'users.email', 'users.phone', 'users.is_active', 'users.last_login_at', 'users.created_at', 'users.role_id', 'roles.name as role_name');
        if (searchQuery) {
            query.where('users.username', 'ilike', `%${searchQuery}%`)
                .orWhere('users.full_name', 'ilike', `%${searchQuery}%`);
        }
        return await query.orderBy('users.id', 'asc');
    }
    async findOne(id) {
        const user = await this.knex('users')
            .join('roles', 'users.role_id', 'roles.id')
            .select('users.id', 'users.username', 'users.full_name', 'users.email', 'users.phone', 'users.is_active', 'users.last_login_at', 'users.created_at', 'users.role_id', 'roles.name as role_name')
            .where('users.id', id)
            .first();
        if (!user)
            throw new common_1.NotFoundException('Usuario no encontrado');
        return user;
    }
    async getRoles() {
        return await this.knex('roles').select('*').orderBy('id', 'asc');
    }
    async create(data) {
        const existingUser = await this.knex('users').where({ username: data.username }).first();
        if (existingUser)
            throw new common_1.BadRequestException('El nombre de usuario ya está en uso.');
        if (!data.password)
            throw new common_1.BadRequestException('La contraseña es requerida.');
        const salt = await bcrypt.genSalt();
        const password_hash = await bcrypt.hash(data.password, salt);
        const { password, ...insertData } = data;
        const [newUser] = await this.knex('users').insert({
            ...insertData,
            password_hash
        }).returning(['id', 'username', 'full_name', 'email', 'phone', 'is_active', 'role_id']);
        return { success: true, user: newUser };
    }
    async update(id, data, requesterId) {
        const updateData = { ...data };
        if (updateData.password) {
            if (!updateData.admin_password) {
                throw new common_1.BadRequestException('Se requiere su contraseña actual para autorizar el cambio de clave.');
            }
            const requester = await this.knex('users').where({ id: requesterId }).first();
            const isAdminPasswordValid = await bcrypt.compare(updateData.admin_password, requester.password_hash);
            if (!isAdminPasswordValid) {
                throw new common_1.BadRequestException('Su contraseña de administrador es incorrecta. Autorización denegada.');
            }
            const salt = await bcrypt.genSalt();
            updateData.password_hash = await bcrypt.hash(updateData.password, salt);
            delete updateData.password;
            delete updateData.admin_password;
        }
        if (updateData.username) {
            const existingUser = await this.knex('users').where({ username: updateData.username }).whereNot({ id }).first();
            if (existingUser)
                throw new common_1.BadRequestException('El nombre de usuario ya está en uso.');
        }
        const [updated] = await this.knex('users')
            .where({ id })
            .update({ ...updateData, updated_at: this.knex.fn.now() })
            .returning(['id', 'username', 'full_name', 'email', 'phone', 'is_active', 'role_id']);
        if (!updated)
            throw new common_1.NotFoundException('Usuario no encontrado');
        return { success: true, user: updated };
    }
    async delete(id) {
        const [updated] = await this.knex('users')
            .where({ id })
            .update({ is_active: false, updated_at: this.knex.fn.now() })
            .returning(['id', 'username', 'is_active']);
        if (!updated)
            throw new common_1.NotFoundException('Usuario no encontrado');
        return { success: true, message: 'Usuario desactivado correctamente' };
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)('KNEX_CONNECTION')),
    __metadata("design:paramtypes", [Function])
], UsersService);
//# sourceMappingURL=users.service.js.map