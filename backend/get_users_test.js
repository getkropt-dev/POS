const { Client } = require('pg');
require('dotenv').config({ path: './.env' });

async function tryConnect(host, port, ssl) {
  console.log(`Trying connection to ${host}:${port} (SSL: ${JSON.stringify(ssl)})`);
  const client = new Client({
    host: host,
    port: port,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: ssl
  });

  try {
    await client.connect();
    console.log(`✅ Connection SUCCESS to ${host}:${port}`);
    const res = await client.query('SELECT id, username, role_id, email FROM users');
    console.log('Users:', res.rows);
    await client.end();
    return true;
  } catch (err) {
    console.error(`❌ Connection FAILED to ${host}:${port}:`, err.message || err);
    try { await client.end(); } catch(e) {}
    return false;
  }
}

async function run() {
  // Try direct host
  const directHost = 'db.pnedvaxdheoyaijzfqoq.supabase.co';
  
  console.log('--- TEST 1: Direct Host with SSL ---');
  let ok = await tryConnect(directHost, 5432, { rejectUnauthorized: false });
  if (ok) return;

  console.log('--- TEST 2: Pooler Host with SSL ---');
  ok = await tryConnect(process.env.DB_HOST, 5432, { rejectUnauthorized: false });
  if (ok) return;

  console.log('--- TEST 3: Pooler Host on Port 6543 (Transaction mode) with SSL ---');
  ok = await tryConnect(process.env.DB_HOST, 6543, { rejectUnauthorized: false });
  if (ok) return;
  
  console.log('--- TEST 4: Direct Host without SSL ---');
  ok = await tryConnect(directHost, 5432, false);
  if (ok) return;

  console.log('--- TEST 5: Pooler Host without SSL ---');
  ok = await tryConnect(process.env.DB_HOST, 5432, false);
}

run();
