import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';
import * as bcrypt from 'bcrypt';
import { Knex } from 'knex';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const knex = app.get<Knex>('KNEX_CONNECTION');

  try {
    const passwordHash = await bcrypt.hash('admin123', 10);
    
    // Asumimos que el rol ADMIN tiene el ID 1 (creado en schema.sql)
    await knex('users').insert({
      role_id: 1,
      username: 'admin123',
      password_hash: passwordHash,
      full_name: 'Administrador del Sistema',
      email: 'admin@nexuspos.com',
      is_active: true
    }).onConflict('username').ignore(); // Para que no de error si lo corremos 2 veces

    console.log('✅ Usuario administrador creado exitosamente.');
    console.log('   Usuario: admin123');
    console.log('   Clave:   admin123');
  } catch (error) {
    console.error('❌ Error creando el usuario:', error);
  } finally {
    await app.close();
  }
}

bootstrap();
