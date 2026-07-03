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
exports.ProductsService = void 0;
const common_1 = require("@nestjs/common");
const knex_1 = require("knex");
let ProductsService = class ProductsService {
    knex;
    constructor(knex) {
        this.knex = knex;
    }
    mapToFrontend(product) {
        if (!product)
            return null;
        return {
            ...product,
            unit_price: Number(product.selling_price),
            unit_cost: Number(product.current_cost),
            stock_quantity: Number(product.stock),
            tax_rate: Number(product.tax_percentage),
            min_stock: Number(product.min_stock_alert),
        };
    }
    mapToDatabase(data) {
        const mapped = { ...data };
        if (data.unit_price !== undefined)
            mapped.selling_price = data.unit_price;
        if (data.unit_cost !== undefined)
            mapped.current_cost = data.unit_cost;
        if (data.stock_quantity !== undefined)
            mapped.stock = data.stock_quantity;
        if (data.tax_rate !== undefined)
            mapped.tax_percentage = data.tax_rate;
        if (data.min_stock !== undefined)
            mapped.min_stock_alert = data.min_stock;
        delete mapped.unit_price;
        delete mapped.unit_cost;
        delete mapped.stock_quantity;
        delete mapped.tax_rate;
        delete mapped.min_stock;
        return mapped;
    }
    async findAll(searchQuery) {
        const query = this.knex('products').select('*').where('is_active', true);
        if (searchQuery) {
            query.andWhere(q => {
                q.where('name', 'ilike', `%${searchQuery}%`)
                    .orWhere('sku', 'ilike', `%${searchQuery}%`);
            });
        }
        const products = await query.orderBy('name', 'asc');
        return products.map(p => this.mapToFrontend(p));
    }
    async findOne(id) {
        const product = await this.knex('products').where({ id }).first();
        if (!product)
            throw new common_1.NotFoundException('Producto no encontrado');
        return this.mapToFrontend(product);
    }
    async create(data) {
        const mappedData = this.mapToDatabase(data);
        if (!mappedData.sku || mappedData.sku.trim() === '') {
            mappedData.sku = 'SKU-' + Math.random().toString(36).substring(2, 10).toUpperCase();
        }
        const [newProduct] = await this.knex('products')
            .insert({ ...mappedData, is_active: true })
            .returning('*');
        return { success: true, product: this.mapToFrontend(newProduct) };
    }
    async update(id, data) {
        const mappedData = this.mapToDatabase(data);
        const [updatedProduct] = await this.knex('products')
            .where({ id })
            .update({ ...mappedData, updated_at: this.knex.fn.now() })
            .returning('*');
        if (!updatedProduct)
            throw new common_1.NotFoundException('Producto no encontrado');
        return { success: true, product: this.mapToFrontend(updatedProduct) };
    }
    async remove(id) {
        const updatedCount = await this.knex('products')
            .where({ id })
            .update({ is_active: false, updated_at: this.knex.fn.now() });
        if (updatedCount === 0)
            throw new common_1.NotFoundException('Producto no encontrado');
        return { success: true, message: 'Producto desactivado correctamente' };
    }
    async suggestSellingPrice(id, marginPercent) {
        const result = await this.knex.raw(`SELECT fn_sugerir_precio_venta(?, ?) AS suggested_price`, [id, marginPercent]);
        const price = result.rows[0]?.suggested_price;
        if (price == null)
            throw new common_1.NotFoundException('Producto no encontrado para sugerencia');
        return {
            success: true,
            product_id: id,
            margin_applied: marginPercent,
            suggested_selling_price: Number(price)
        };
    }
};
exports.ProductsService = ProductsService;
exports.ProductsService = ProductsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)('KNEX_CONNECTION')),
    __metadata("design:paramtypes", [Function])
], ProductsService);
//# sourceMappingURL=products.service.js.map