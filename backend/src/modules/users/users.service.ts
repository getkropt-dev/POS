import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { Knex } from 'knex';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(@Inject('KNEX_CONNECTION') private readonly knex: Knex) {}

  async findAll(searchQuery?: string) {
    const query = this.knex('users')
      .join('roles', 'users.role_id', 'roles.id')
      .select(
        'users.id', 
        'users.username', 
        'users.full_name', 
        'users.email', 
        'users.phone', 
        'users.is_active', 
        'users.last_login_at', 
        'users.created_at', 
        'users.role_id', 
        'roles.name as role_name'
      );

    if (searchQuery) {
      query.where('users.username', 'ilike', `%${searchQuery}%`)
           .orWhere('users.full_name', 'ilike', `%${searchQuery}%`);
    }

    return await query.orderBy('users.id', 'asc');
  }

  async findOne(id: number) {
    const user = await this.knex('users')
      .join('roles', 'users.role_id', 'roles.id')
      .select(
        'users.id', 
        'users.username', 
        'users.full_name', 
        'users.email', 
        'users.phone', 
        'users.is_active', 
        'users.last_login_at', 
        'users.created_at', 
        'users.role_id', 
        'roles.name as role_name'
      )
      .where('users.id', id)
      .first();

    if (!user) throw new NotFoundException('Usuario no encontrado');
    return user;
  }

  async getRoles() {
    return await this.knex('roles').select('*').orderBy('id', 'asc');
  }

  async create(data: any) {
    const existingUser = await this.knex('users').where({ username: data.username }).first();
    if (existingUser) throw new BadRequestException('El nombre de usuario ya está en uso.');

    if (!data.password) throw new BadRequestException('La contraseña es requerida.');

    const salt = await bcrypt.genSalt();
    const password_hash = await bcrypt.hash(data.password, salt);

    const { password, ...insertData } = data;

    const [newUser] = await this.knex('users').insert({
      ...insertData,
      password_hash
    }).returning(['id', 'username', 'full_name', 'email', 'phone', 'is_active', 'role_id']);

    return { success: true, user: newUser };
  }

  async update(id: number, data: any, requesterId: number) {
    const updateData = { ...data };
    
    if (updateData.password) {
      // Si se intenta cambiar una contraseña, requerimos la contraseña del administrador actual por seguridad
      if (!updateData.admin_password) {
        throw new BadRequestException('Se requiere su contraseña actual para autorizar el cambio de clave.');
      }

      const requester = await this.knex('users').where({ id: requesterId }).first();
      const isAdminPasswordValid = await bcrypt.compare(updateData.admin_password, requester.password_hash);
      
      if (!isAdminPasswordValid) {
        throw new BadRequestException('Su contraseña de administrador es incorrecta. Autorización denegada.');
      }

      const salt = await bcrypt.genSalt();
      updateData.password_hash = await bcrypt.hash(updateData.password, salt);
      delete updateData.password;
      delete updateData.admin_password;
    }

    if (updateData.username) {
       const existingUser = await this.knex('users').where({ username: updateData.username }).whereNot({ id }).first();
       if (existingUser) throw new BadRequestException('El nombre de usuario ya está en uso.');
    }

    const [updated] = await this.knex('users')
      .where({ id })
      .update({ ...updateData, updated_at: this.knex.fn.now() })
      .returning(['id', 'username', 'full_name', 'email', 'phone', 'is_active', 'role_id']);
      
    if (!updated) throw new NotFoundException('Usuario no encontrado');
    return { success: true, user: updated };
  }

  async delete(id: number) {
     const [updated] = await this.knex('users')
       .where({ id })
       .update({ is_active: false, updated_at: this.knex.fn.now() })
       .returning(['id', 'username', 'is_active']);

     if (!updated) throw new NotFoundException('Usuario no encontrado');
     return { success: true, message: 'Usuario desactivado correctamente' };
  }
}
