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
    
    const res1 = await client.query(`
      SELECT prosrc 
      FROM pg_proc 
      WHERE proname = 'fn_check_sale_payment';
    `);
    console.log('fn_check_sale_payment:', res1.rows[0]?.prosrc);

    const res2 = await client.query(`
      SELECT prosrc 
      FROM pg_proc 
      WHERE proname = 'fn_recalculate_sale_paid';
    `);
    console.log('fn_recalculate_sale_paid:', res2.rows[0]?.prosrc);

  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}
run();
