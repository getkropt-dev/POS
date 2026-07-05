import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { Knex } from 'knex';

@Injectable()
export class ProductsService {
  constructor(@Inject('KNEX_CONNECTION') private readonly knex: Knex) {}

  private mapToFrontend(product: any) {
    if (!product) return null;
    return {
      ...product,
      unit_price: Number(product.selling_price),
      unit_cost: Number(product.current_cost),
      stock_quantity: Number(product.stock),
      tax_rate: Number(product.tax_percentage),
      min_stock: Number(product.min_stock_alert),
    };
  }

  private mapToDatabase(data: any) {
    // Definir explícitamente los campos permitidos para la base de datos
    const allowedFields = [
      'name', 'sku', 'barcode', 'description', 'category_id', 'supplier_id',
      'manages_inventory', 'has_tax', 'is_active'
    ];
    
    const mapped: any = {};
    for (const field of allowedFields) {
      if (data[field] !== undefined) {
        mapped[field] = data[field];
      }
    }
    
    if (data.unit_price !== undefined) mapped.selling_price = data.unit_price;
    if (data.unit_cost !== undefined) mapped.current_cost = data.unit_cost;
    if (data.stock_quantity !== undefined) mapped.stock = data.stock_quantity;
    if (data.tax_rate !== undefined) mapped.tax_percentage = data.tax_rate;
    if (data.min_stock !== undefined) mapped.min_stock_alert = data.min_stock;
    
    return mapped;
  }

  async findAll(searchQuery?: string) {
    const query = this.knex('products').select('*').where('is_active', true);

    if (searchQuery) {
      query.andWhere(q => {
        q.where('name', 'ilike', `%${searchQuery}%`)
         .orWhere('sku', 'ilike', `%${searchQuery}%`)
         .orWhere('barcode', 'ilike', `%${searchQuery}%`);
      });
    }

    const products = await query.orderBy('name', 'asc');
    return products.map(p => this.mapToFrontend(p));
  }

  async findOne(id: number) {
    const product = await this.knex('products').where({ id }).first();
    if (!product) throw new NotFoundException('Producto no encontrado');
    return this.mapToFrontend(product);
  }

  async create(data: any) {
    const mappedData = this.mapToDatabase(data);
    
    // Si no viene SKU, generamos uno automáticamente
    if (!mappedData.sku || mappedData.sku.trim() === '') {
      mappedData.sku = 'SKU-' + Math.random().toString(36).substring(2, 10).toUpperCase();
    }

    const [newProduct] = await this.knex('products')
      .insert({ ...mappedData, is_active: true })
      .returning('*');
    return { success: true, product: this.mapToFrontend(newProduct) };
  }

  async update(id: number, data: any) {
    const mappedData = this.mapToDatabase(data);
    const [updatedProduct] = await this.knex('products')
      .where({ id })
      .update({ ...mappedData, updated_at: this.knex.fn.now() })
      .returning('*');
    
    if (!updatedProduct) throw new NotFoundException('Producto no encontrado');
    return { success: true, product: this.mapToFrontend(updatedProduct) };
  }

  async remove(id: number) {
    // Realizamos un "Soft Delete" para no romper la integridad referencial 
    // (si el producto tiene ventas o movimientos asociados).
    const updatedCount = await this.knex('products')
      .where({ id })
      .update({ is_active: false, updated_at: this.knex.fn.now() });
      
    if (updatedCount === 0) throw new NotFoundException('Producto no encontrado');
    return { success: true, message: 'Producto desactivado correctamente' };
  }

  // Integración con Procedimiento Almacenado de Costa Rica (Régimen Simplificado)
  async suggestSellingPrice(id: number, marginPercent: number) {
    // Llamamos a la BD para que calcule el precio basándose en el Costo Promedio Ponderado 
    // real (con el IVA proporcionado ya sumado).
    const result = await this.knex.raw(
      `SELECT fn_sugerir_precio_venta(?, ?) AS suggested_price`,
      [id, marginPercent]
    );

    const price = result.rows[0]?.suggested_price;
    if (price == null) throw new NotFoundException('Producto no encontrado para sugerencia');
    
    return { 
      success: true, 
      product_id: id, 
      margin_applied: marginPercent, 
      suggested_selling_price: Number(price) 
    };
  }
}
