const { Client } = require('pg');
require('dotenv').config({ path: './.env' });

async function checkViews() {
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
    const res = await client.query(`
      SELECT table_name 
      FROM information_schema.views 
      WHERE table_schema = 'public' 
      AND table_name ILIKE '%cash%' 
      OR table_name ILIKE '%inventory%' 
      OR table_name ILIKE '%purchase%' 
      OR table_name ILIKE '%credit%'
      OR table_name ILIKE '%customer%'
      OR table_name ILIKE '%v_%'
      OR table_name ILIKE '%vw_%'
    `);
    console.log('Relevant Views in DB:');
    res.rows.forEach(r => console.log(r.table_name));
  } catch (err) {
    console.error('Error connecting or querying:', err);
  } finally {
    await client.end();
  }
}

checkViews();
