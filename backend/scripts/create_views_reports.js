const { Client } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function createViews() {
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
    
    // 1. v_cash_sessions_report
    await client.query(`
      CREATE OR REPLACE VIEW v_cash_sessions_report WITH (security_invoker = true) AS
      SELECT 
          cs.id,
          u.full_name AS user_name,
          cs.opening_balance,
          cs.expected_balance,
          cs.actual_balance,
          cs.difference,
          cs.status,
          cs.opened_at AS open_date,
          cs.closed_at AS close_date,
          cs.notes,
          cs.opened_at
      FROM cash_sessions cs
      JOIN users u ON cs.user_id = u.id;
    `);
    console.log('Created v_cash_sessions_report');

    // 2. v_inventory_movements_report
    await client.query(`
      CREATE OR REPLACE VIEW v_inventory_movements_report WITH (security_invoker = true) AS
      SELECT 
          im.id,
          p.name AS product_name,
          im.movement_type,
          im.quantity,
          im.stock_before,
          im.stock_after,
          im.unit_cost,
          im.reference_type,
          im.notes,
          u.full_name AS user_name,
          im.created_at AS movement_date,
          im.created_at
      FROM inventory_movements im
      JOIN products p ON im.product_id = p.id
      LEFT JOIN users u ON im.created_by = u.id;
    `);
    console.log('Created v_inventory_movements_report');

    // 3. v_purchases_billing_report
    await client.query(`
      CREATE OR REPLACE VIEW v_purchases_billing_report WITH (security_invoker = true) AS
      SELECT 
          pi.id,
          pi.invoice_number,
          pi.purchase_date,
          pi.invoice_type,
          pi.is_deductible,
          pi.periodo_tributario_asignado AS assigned_tax_period,
          pi.incluir_en_declaracion AS include_in_declaration,
          pi.total_net_amount,
          pi.total_tax_amount,
          pi.total_invoice_amount,
          pi.status,
          s.name AS supplier_name
      FROM purchase_invoices pi
      LEFT JOIN suppliers s ON pi.supplier_id = s.id;
    `);
    console.log('Created v_purchases_billing_report');

    // 4. v_customer_credit_report
    await client.query(`
      CREATE OR REPLACE VIEW v_customer_credit_report WITH (security_invoker = true) AS
      SELECT 
          cp.id,
          c.name AS customer_name,
          c.tax_id,
          c.current_balance,
          c.credit_limit,
          cp.amount AS payment_amount,
          pm.name AS payment_method,
          cp.created_at AS payment_date,
          cp.notes,
          cp.customer_id,
          cp.created_at
      FROM customer_payments cp
      JOIN customers c ON cp.customer_id = c.id
      LEFT JOIN payment_methods pm ON cp.payment_method_id = pm.id;
    `);
    console.log('Created v_customer_credit_report');

    console.log('All views created successfully!');
  } catch (err) {
    console.error('Error creating views:', err);
  } finally {
    await client.end();
  }
}

createViews();
