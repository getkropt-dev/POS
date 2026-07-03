const knex = require('knex');
require('dotenv').config();

const db = knex({
  client: 'pg',
  connection: {
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: { rejectUnauthorized: false }
  }
});

async function test() {
  try {
    const res = await db.raw("SELECT column_name FROM information_schema.columns WHERE table_name = 'purchase_invoices'");
    console.log('Columns in purchase_invoices:', res.rows.map(r => r.column_name));
  } catch (error) {
    console.error('Error executing query:', error.message);
  } finally {
    db.destroy();
  }
}

test();
