import { Global, Module } from '@nestjs/common';
import knex from 'knex';

const KnexProvider = {
  provide: 'KNEX_CONNECTION',
  useFactory: () => {
    return knex({
      client: 'pg',
      connection: {
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false },
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
