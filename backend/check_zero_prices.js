const { Client } = require('pg');
require('dotenv').config({ path: './.env' });

async function checkZeroPrices() {
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
    const res = await client.query('SELECT count(*) FROM products WHERE selling_price = 0 OR current_cost = 0');
    console.log('Products with zero prices:', res.rows[0].count);
    
    if (res.rows[0].count > 0) {
        const samples = await client.query('SELECT name, current_cost, selling_price FROM products WHERE selling_price = 0 OR current_cost = 0 LIMIT 5');
        console.log('Sample zero price products:', JSON.stringify(samples.rows, null, 2));
    }
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
}

checkZeroPrices();
