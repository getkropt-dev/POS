-- Migración para corregir el error security_definer_view reportado por el Database Linter de Supabase.
-- Se añade WITH (security_invoker = true) a cada vista para que respeten las políticas de RLS (Row Level Security).
-- Al utilizar CREATE OR REPLACE VIEW en lugar de DROP VIEW, se conservan los permisos (GRANTs) que ya existían en las vistas.

-- 1. v_cash_sessions_report
CREATE OR REPLACE VIEW public.v_cash_sessions_report WITH (security_invoker = true) AS
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

-- 2. v_inventory_movements_report
CREATE OR REPLACE VIEW public.v_inventory_movements_report WITH (security_invoker = true) AS
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

-- 3. v_purchases_billing_report
CREATE OR REPLACE VIEW public.v_purchases_billing_report WITH (security_invoker = true) AS
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

-- 4. v_customer_credit_report
CREATE OR REPLACE VIEW public.v_customer_credit_report WITH (security_invoker = true) AS
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

-- 5. v_sales_with_categories
CREATE OR REPLACE VIEW public.v_sales_with_categories WITH (security_invoker = true) AS
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
