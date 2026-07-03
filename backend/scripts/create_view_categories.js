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
  
  const query = `
    CREATE OR REPLACE VIEW v_sales_with_categories WITH (security_invoker = true) AS
    SELECT
        s.id AS sale_id,
        s.invoice_number,
        s.sale_date,
        s.status,
        p.name AS product_name,
        p.category_id,
        c.name AS category_name,
        sd.quantity,
        sd.unit_price,
        sd.unit_cost,
        sd.line_subtotal,
        sd.line_tax,
        sd.line_total,
        sd.line_profit
    FROM sales s
    JOIN sale_details sd ON s.id = sd.sale_id
    JOIN products p ON sd.product_id = p.id
    LEFT JOIN categories c ON p.category_id = c.id;
  `;
  
  await client.query(query);
  console.log("View v_sales_with_categories created successfully.");
  
  await client.end();
}

run().catch(console.error);
