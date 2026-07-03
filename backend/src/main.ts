import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { PgExceptionFilter } from './common/filters/pg-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Habilitar CORS para permitir peticiones desde el frontend (Vite)
  app.enableCors({
    origin: '*', // Habilitado para todos temporalmente (o añade los dominios de producción y desarrollo)
    credentials: true,
  });
  
  // Registrar el filtro global para Postgres
  app.useGlobalFilters(new PgExceptionFilter());
  
  const port = process.env.PORT || 3000;
  await app.listen(port);
}
bootstrap();
