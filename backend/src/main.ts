import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { PgExceptionFilter } from './common/filters/pg-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Habilitar CORS para permitir peticiones desde el frontend (Vite)
  app.enableCors({
    origin: 'http://localhost:5173', // O '*' para desarrollo
    credentials: true,
  });
  
  // Registrar el filtro global para Postgres
  app.useGlobalFilters(new PgExceptionFilter());
  
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
