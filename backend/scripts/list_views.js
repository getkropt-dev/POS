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
  
  const res = await client.query(`SELECT table_name FROM information_schema.views WHERE table_schema = 'public'`);
  console.log("Views in public schema:");
  res.rows.forEach(r => console.log(` - ${r.table_name}`));
  
  await client.end();
}

run().catch(console.error);
