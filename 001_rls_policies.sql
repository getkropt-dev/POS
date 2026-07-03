-- =================================================================================
-- Migración: Implementación de Políticas RLS para Arquitectura Backend (NestJS)
-- =================================================================================
--
-- Justificación:
-- 1. La aplicación utiliza un backend de NestJS que gestiona su propia tabla
--    de usuarios (`public.users`) y su propia autenticación JWT.
-- 2. El backend se conecta como un usuario administrador (pooler/postgres),
--    por lo cual bypassea naturalmente RLS.
-- 3. No se utilizan roles como `anon` o `authenticated` de Supabase Auth.
-- 4. Para mantener la seguridad más restrictiva posible (Deny All) y solventar
--    el aviso del Database Linter ("RLS Enabled No Policy"), se establecen políticas 
--    exclusivas para el `service_role`.
--
-- Esto garantiza que si alguna vez se expone la API de PostgREST, los usuarios
-- anónimos o no autorizados NO tendrán acceso por defecto.
-- =================================================================================

-- 1. Tabla: audit_log
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Restricted to service_role" ON public.audit_log;
CREATE POLICY "Restricted to service_role" 
ON public.audit_log FOR ALL TO service_role 
USING (true) WITH CHECK (true);

-- 2. Tabla: cash_sessions
ALTER TABLE public.cash_sessions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Restricted to service_role" ON public.cash_sessions;
CREATE POLICY "Restricted to service_role" 
ON public.cash_sessions FOR ALL TO service_role 
USING (true) WITH CHECK (true);

-- 3. Tabla: categories
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Restricted to service_role" ON public.categories;
CREATE POLICY "Restricted to service_role" 
ON public.categories FOR ALL TO service_role 
USING (true) WITH CHECK (true);

-- 4. Tabla: customer_payments
ALTER TABLE public.customer_payments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Restricted to service_role" ON public.customer_payments;
CREATE POLICY "Restricted to service_role" 
ON public.customer_payments FOR ALL TO service_role 
USING (true) WITH CHECK (true);

-- 5. Tabla: customers
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Restricted to service_role" ON public.customers;
CREATE POLICY "Restricted to service_role" 
ON public.customers FOR ALL TO service_role 
USING (true) WITH CHECK (true);

-- 6. Tabla: inventory_movements
ALTER TABLE public.inventory_movements ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Restricted to service_role" ON public.inventory_movements;
CREATE POLICY "Restricted to service_role" 
ON public.inventory_movements FOR ALL TO service_role 
USING (true) WITH CHECK (true);

-- 7. Tabla: payment_methods
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Restricted to service_role" ON public.payment_methods;
CREATE POLICY "Restricted to service_role" 
ON public.payment_methods FOR ALL TO service_role 
USING (true) WITH CHECK (true);

-- 8. Tabla: products
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Restricted to service_role" ON public.products;
CREATE POLICY "Restricted to service_role" 
ON public.products FOR ALL TO service_role 
USING (true) WITH CHECK (true);

-- 9. Tabla: purchase_invoice_details
ALTER TABLE public.purchase_invoice_details ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Restricted to service_role" ON public.purchase_invoice_details;
CREATE POLICY "Restricted to service_role" 
ON public.purchase_invoice_details FOR ALL TO service_role 
USING (true) WITH CHECK (true);

-- 10. Tabla: purchase_invoices
ALTER TABLE public.purchase_invoices ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Restricted to service_role" ON public.purchase_invoices;
CREATE POLICY "Restricted to service_role" 
ON public.purchase_invoices FOR ALL TO service_role 
USING (true) WITH CHECK (true);

-- 11. Tabla: roles
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Restricted to service_role" ON public.roles;
CREATE POLICY "Restricted to service_role" 
ON public.roles FOR ALL TO service_role 
USING (true) WITH CHECK (true);

-- 12. Tabla: sale_details
ALTER TABLE public.sale_details ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Restricted to service_role" ON public.sale_details;
CREATE POLICY "Restricted to service_role" 
ON public.sale_details FOR ALL TO service_role 
USING (true) WITH CHECK (true);

-- 13. Tabla: sale_payments
ALTER TABLE public.sale_payments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Restricted to service_role" ON public.sale_payments;
CREATE POLICY "Restricted to service_role" 
ON public.sale_payments FOR ALL TO service_role 
USING (true) WITH CHECK (true);

-- 14. Tabla: sale_return_details
ALTER TABLE public.sale_return_details ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Restricted to service_role" ON public.sale_return_details;
CREATE POLICY "Restricted to service_role" 
ON public.sale_return_details FOR ALL TO service_role 
USING (true) WITH CHECK (true);

-- 15. Tabla: sale_returns
ALTER TABLE public.sale_returns ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Restricted to service_role" ON public.sale_returns;
CREATE POLICY "Restricted to service_role" 
ON public.sale_returns FOR ALL TO service_role 
USING (true) WITH CHECK (true);

-- 16. Tabla: sales
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Restricted to service_role" ON public.sales;
CREATE POLICY "Restricted to service_role" 
ON public.sales FOR ALL TO service_role 
USING (true) WITH CHECK (true);

-- 17. Tabla: suppliers
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Restricted to service_role" ON public.suppliers;
CREATE POLICY "Restricted to service_role" 
ON public.suppliers FOR ALL TO service_role 
USING (true) WITH CHECK (true);

-- 18. Tabla: tax_rates
ALTER TABLE public.tax_rates ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Restricted to service_role" ON public.tax_rates;
CREATE POLICY "Restricted to service_role" 
ON public.tax_rates FOR ALL TO service_role 
USING (true) WITH CHECK (true);

-- 19. Tabla: users
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Restricted to service_role" ON public.users;
CREATE POLICY "Restricted to service_role" 
ON public.users FOR ALL TO service_role 
USING (true) WITH CHECK (true);
