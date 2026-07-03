const { Client } = require('pg');
require('dotenv').config({ path: './.env' });

async function queryDB() {
  const client = new Client({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: false
  });

  try {
    await client.connect();
    const res = await client.query('SELECT id, username, role_id, full_name, email, is_active FROM users');
    console.log('--- Users in Database ---');
    console.log(JSON.stringify(res.rows, null, 2));
    
    const rolesRes = await client.query('SELECT id, name FROM roles');
    console.log('\n--- Roles in Database ---');
    console.log(JSON.stringify(rolesRes.rows, null, 2));
  } catch (err) {
    console.error('Error connecting or querying:', err);
  } finally {
    await client.end();
  }
}

queryDB();
