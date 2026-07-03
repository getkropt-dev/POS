import { Controller, Get, Post, Put, Delete, Param, Body, Query, UseGuards, Request } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('roles')
  async getRoles() {
    return await this.usersService.getRoles();
  }

  @Get()
  async getAll(@Query('search') search?: string) {
    return await this.usersService.findAll(search);
  }

  @Get(':id')
  async getOne(@Param('id') id: string) {
    return await this.usersService.findOne(Number(id));
  }

  @Post()
  async create(@Body() body: any) {
    return await this.usersService.create(body);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() body: any, @Request() req: any) {
    const requesterId = req.user.id;
    return await this.usersService.update(Number(id), body, requesterId);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return await this.usersService.delete(Number(id));
  }
}
