const fs = require('fs');
const path = require('path');
const { Client } = require('pg');
require('dotenv').config();

async function runMigration() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('DATABASE_URL is missing in .env');
    process.exit(1);
  }

  const client = new Client({ 
    connectionString,
    ssl: { rejectUnauthorized: false }
  });
  
  try {
    await client.connect();
    console.log('Connected to database.');
    
    const sqlPath = path.join(__dirname, '..', '002_add_barcode_to_products.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    console.log('Executing migration...');
    await client.query(sql);
    console.log('Migration completed successfully.');
    
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    await client.end();
  }
}

runMigration();
