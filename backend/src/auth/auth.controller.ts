import { Controller, Post, Body, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  async login(@Body() body: any) {
    try {
      const user = await this.authService.validateUser(body.username, body.password);
      if (!user) {
        throw new UnauthorizedException('Credenciales inválidas o usuario inactivo');
      }
      return this.authService.login(user);
    } catch (error) {
      console.error("ERROR REAL DEL LOGIN:", error);
      throw error;
    }
  }
}
