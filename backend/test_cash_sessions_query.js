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
    const query = db('cash_sessions as cs')
      .join('users as u', 'cs.user_id', 'u.id')
      .select(
        'cs.id',
        'u.full_name as user_name',
        'cs.opening_balance',
        'cs.expected_balance',
        'cs.actual_balance',
        'cs.difference',
        'cs.status',
        'cs.opened_at as open_date',
        'cs.closed_at as close_date',
        'cs.notes'
      )
      .orderBy('cs.opened_at', 'desc');

    const res = await query;
    console.log('Success:', res.length, 'rows');
  } catch (error) {
    console.error('Error executing query:', error.message);
  } finally {
    db.destroy();
  }
}

test();
