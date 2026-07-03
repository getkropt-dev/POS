import { Global, Module } from '@nestjs/common';
import knex from 'knex';

const KnexProvider = {
  provide: 'KNEX_CONNECTION',
  useFactory: () => {
    return knex({
      client: 'pg',
      connection: {
        host: process.env.DB_HOST || '127.0.0.1',
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || 'postgres',
        database: process.env.DB_NAME || 'pos_db',
        port: Number(process.env.DB_PORT) || 5432,
        ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
      },
      pool: { min: 2, max: 10 },
    });
  },
};

@Global()
@Module({
  providers: [KnexProvider],
  exports: [KnexProvider],
})
export class DatabaseModule {}
