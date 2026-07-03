import { Injectable, UnauthorizedException, Inject } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Knex } from 'knex';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    @Inject('KNEX_CONNECTION') private readonly knex: Knex,
    private jwtService: JwtService
  ) {}

  async validateUser(username: string, pass: string): Promise<any> {
    const user = await this.knex('users')
      .join('roles', 'users.role_id', 'roles.id')
      .where('users.username', username)
      .select('users.*', 'roles.name as role_name')
      .first();

    if (user && user.is_active) {
      // Comparar contraseña hasheada
      const isMatch = await bcrypt.compare(pass, user.password_hash);
      if (isMatch) {
        const { password_hash, ...result } = user;
        return result;
      }
    }
    return null;
  }

  async login(user: any) {
    // Generar el payload del JWT con el ID real del usuario y su rol
    const payload = { username: user.username, sub: user.id, role: user.role_name };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        username: user.username,
        role: user.role_name,
        full_name: user.full_name
      }
    };
  }
}
