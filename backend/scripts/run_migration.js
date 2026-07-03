const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: './.env' });

async function runMigration() {
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
    console.log('Connected to the database.');

    const sqlPath = path.join(__dirname, 'enable_rls.sql');
    console.log(`Reading SQL migration from: ${sqlPath}`);
    const sql = fs.readFileSync(sqlPath, 'utf8');

    console.log('Executing SQL migration...');
    await client.query(sql);
    console.log('Migration executed successfully! Row Level Security (RLS) is now enabled for all public tables.');

  } catch (err) {
    console.error('Error executing migration:', err);
  } finally {
    await client.end();
    console.log('Database connection closed.');
  }
}

runMigration();
