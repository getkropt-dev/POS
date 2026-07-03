import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { Knex } from 'knex';

@Injectable()
export class CatalogsService {
  constructor(@Inject('KNEX_CONNECTION') private readonly knex: Knex) {}

  async findAll(table: string) {
    return await this.knex(table).select('*').orderBy('id', 'asc');
  }

  async findOne(table: string, id: number) {
    const record = await this.knex(table).where({ id }).first();
    if (!record) throw new NotFoundException(`Registro no encontrado en ${table}`);
    return record;
  }

  async create(table: string, data: any) {
    const [newRecord] = await this.knex(table).insert(data).returning('*');
    return { success: true, data: newRecord };
  }

  async update(table: string, id: number, data: any) {
    const [updated] = await this.knex(table).where({ id }).update(data).returning('*');
    if (!updated) throw new NotFoundException(`Registro no encontrado en ${table}`);
    return { success: true, data: updated };
  }
}
