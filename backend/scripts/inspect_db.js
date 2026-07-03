const { Client } = require('pg');

const client = new Client({
  host: process.env.DB_HOST || 'aws-1-us-east-1.pooler.supabase.com',
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USER || 'postgres.pnedvaxdheoyaijzfqoq',
  password: process.env.DB_PASSWORD || 'Brocolito0987*',
  database: process.env.DB_NAME || 'postgres',
});

async function run() {
  await client.connect();
  
  const tables = ['products', 'categories', 'sales', 'sale_details'];
  for (const table of tables) {
    const res = await client.query(`SELECT column_name, data_type FROM information_schema.columns WHERE table_name = $1`, [table]);
    console.log(`\nTable: ${table}`);
    res.rows.forEach(r => console.log(`  ${r.column_name}: ${r.data_type}`));
  }
  
  await client.end();
}

run().catch(console.error);
