const { Client } = require('pg');
require('dotenv').config({ path: './.env' });

async function run() {
  const client = new Client({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    
    // First, let's see if the constraint exists
    const res = await client.query(`
      SELECT conname
      FROM pg_constraint
      WHERE conrelid = 'sale_payments'::regclass;
    `);
    console.log('Constraints on sale_payments:', res.rows);

    // Drop the check constraint
    console.log('Dropping sale_payments_amount_check constraint...');
    await client.query(`ALTER TABLE sale_payments DROP CONSTRAINT IF EXISTS sale_payments_amount_check;`);
    
    console.log('Constraint dropped successfully!');
  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}
run();
