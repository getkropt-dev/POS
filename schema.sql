-- ============================================================
--  POS DATABASE SCHEMA v3.0
--  Máxima eficiencia desde la BD:
--  triggers, vistas materializadas, funciones, constraints
-- ============================================================


-- ============================================================
-- 0. EXTENSIONES
-- ============================================================
CREATE EXTENSION IF NOT EXISTS pg_trgm;   -- Búsqueda fuzzy en productos


-- ============================================================
-- 1. USUARIOS Y SEGURIDAD
-- ============================================================

CREATE TABLE roles (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(50) NOT NULL UNIQUE,
    description TEXT
);

CREATE TABLE users (
    id            SERIAL PRIMARY KEY,
    role_id       INTEGER      NOT NULL REFERENCES roles(id),
    username      VARCHAR(50)  NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name     VARCHAR(150) NOT NULL,
    email         VARCHAR(100) UNIQUE,
    phone         VARCHAR(20),
    is_active     BOOLEAN      NOT NULL DEFAULT TRUE,
    last_login_at TIMESTAMPTZ,
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP
);


-- ============================================================
-- 2. CATÁLOGOS
-- ============================================================

CREATE TABLE tax_rates (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL, -- 'General', 'Canasta Básica', 'Servicios'
    percentage NUMERIC(5,2) NOT NULL UNIQUE, -- 13.00, 1.00, 2.00, 0.00
    is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE suppliers (
    id           SERIAL PRIMARY KEY,
    tax_id       VARCHAR(20)  UNIQUE,
    name         VARCHAR(150) NOT NULL,
    contact_name VARCHAR(100),
    phone        VARCHAR(20),
    email        VARCHAR(100),
    address      TEXT,
    is_active    BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at   TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at   TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE customers (
    id                 SERIAL PRIMARY KEY,
    tax_id             VARCHAR(20),
    name               VARCHAR(150) NOT NULL,
    phone              VARCHAR(20),
    email              VARCHAR(100),
    address            TEXT,
    is_credit_customer BOOLEAN      NOT NULL DEFAULT FALSE,
    credit_limit       NUMERIC(15,4) NOT NULL DEFAULT 0.0000 CHECK (credit_limit >= 0),
    current_balance    NUMERIC(15,4) NOT NULL DEFAULT 0.0000 CHECK (current_balance >= 0),
    is_active          BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at         TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at         TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE categories (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    is_active   BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE payment_methods (
    id        SERIAL PRIMARY KEY,
    name      VARCHAR(50) NOT NULL UNIQUE,
    is_active BOOLEAN     NOT NULL DEFAULT TRUE
);

CREATE TABLE customer_payments (
    id                SERIAL PRIMARY KEY,
    customer_id       INTEGER       NOT NULL REFERENCES customers(id),
    amount            NUMERIC(15,4) NOT NULL CHECK (amount > 0),
    payment_method_id INTEGER       NOT NULL REFERENCES payment_methods(id),
    idempotency_key   VARCHAR(100)  UNIQUE NOT NULL,
    notes             TEXT,
    created_by        INTEGER       NOT NULL REFERENCES users(id),
    created_at        TIMESTAMPTZ   NOT NULL DEFAULT CURRENT_TIMESTAMP
);



-- ============================================================
-- 3. PRODUCTOS
-- ============================================================

CREATE TABLE products (
    id                SERIAL PRIMARY KEY,
    sku               VARCHAR(50)   UNIQUE,
    barcode           VARCHAR(100)  UNIQUE,
    name              VARCHAR(200)  NOT NULL,
    description       TEXT,
    category_id       INTEGER       REFERENCES categories(id),
    supplier_id       INTEGER       REFERENCES suppliers(id),
    manages_inventory BOOLEAN       NOT NULL DEFAULT TRUE,
    has_tax           BOOLEAN       NOT NULL DEFAULT TRUE,
    tax_percentage    NUMERIC(5,2)  NOT NULL DEFAULT 0.00
                          CHECK (tax_percentage >= 0 AND tax_percentage <= 100),
    current_cost      NUMERIC(15,4) NOT NULL DEFAULT 0.0000 CHECK (current_cost >= 0),
    selling_price     NUMERIC(15,4) NOT NULL CHECK (selling_price >= 0),
    stock             NUMERIC(15,3) NOT NULL DEFAULT 0.000,
    min_stock_alert   NUMERIC(15,3) NOT NULL DEFAULT 0.000 CHECK (min_stock_alert >= 0),
    is_active         BOOLEAN       NOT NULL DEFAULT TRUE,
    created_at        TIMESTAMPTZ   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at        TIMESTAMPTZ   NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_stock_not_negative
        CHECK (stock >= 0 OR manages_inventory = FALSE)
);


-- ============================================================
-- 4. COMPRAS
-- ============================================================

CREATE TABLE purchase_invoices (
    id SERIAL PRIMARY KEY,
    supplier_id INTEGER NOT NULL REFERENCES suppliers(id),
    invoice_number VARCHAR(50) NOT NULL, -- Número de factura del proveedor
    purchase_date TIMESTAMPTZ NOT NULL,
    received_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    
    -- Totales desglosados
    total_net_amount NUMERIC(15,4) NOT NULL DEFAULT 0, -- Gravado
    total_tax_amount NUMERIC(15,4) NOT NULL DEFAULT 0, -- Total IVA pagado
    total_exempt_amount NUMERIC(15,4) NOT NULL DEFAULT 0, -- Lo que no lleva IVA
    total_invoice_amount NUMERIC(15,4) NOT NULL DEFAULT 0, -- Total final
    
    invoice_type VARCHAR(30) CHECK (invoice_type IN ('ELECTRONICA', 'FISICA', 'GASTO_AUTORIZADO')),
    is_deductible BOOLEAN DEFAULT TRUE,
    incluir_en_declaracion BOOLEAN DEFAULT TRUE,
    periodo_tributario_asignado VARCHAR(20),
    status VARCHAR(20) DEFAULT 'PROCESSED' CHECK (status IN ('DRAFT', 'PROCESSED', 'CANCELLED')),
    created_by INTEGER REFERENCES users(id),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uq_supplier_invoice UNIQUE (supplier_id, invoice_number)
);

CREATE TABLE purchase_invoice_details (
    id SERIAL PRIMARY KEY,
    purchase_invoice_id INTEGER REFERENCES purchase_invoices(id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES products(id),
    quantity NUMERIC(15,3) NOT NULL,
    unit_cost_net NUMERIC(15,4) NOT NULL, -- Costo sin IVA
    tax_percentage NUMERIC(5,2) NOT NULL, -- 13%, 4%, 1%, etc.
    tax_amount NUMERIC(15,4) NOT NULL,    -- Monto de IVA por esta línea
    line_total NUMERIC(15,4) NOT NULL     -- (cost * qty) + tax
);


-- ============================================================
-- 5. KARDEX
-- ============================================================

CREATE TABLE inventory_movements (
    id            SERIAL PRIMARY KEY,
    product_id    INTEGER       NOT NULL REFERENCES products(id),
    movement_type VARCHAR(30)   NOT NULL
                      CHECK (movement_type IN (
                          'SALE','SALE_RETURN',
                          'PURCHASE','PURCHASE_RETURN',
                          'ADJUSTMENT_IN','ADJUSTMENT_OUT',
                          'TRANSFER_IN','TRANSFER_OUT'
                      )),
    quantity      NUMERIC(15,3) NOT NULL CHECK (quantity > 0),
    stock_before  NUMERIC(15,3) NOT NULL,
    stock_after   NUMERIC(15,3) NOT NULL,
    unit_cost     NUMERIC(15,4) CHECK (unit_cost >= 0),
    reference_id  INTEGER,
    reference_type VARCHAR(20),
    transaction_id VARCHAR(100) UNIQUE, -- Idempotencia para ajustes manuales
    notes         TEXT,
    created_by    INTEGER       REFERENCES users(id),
    created_at    TIMESTAMPTZ   NOT NULL DEFAULT CURRENT_TIMESTAMP
);


-- ============================================================
-- 5.5 CAJAS
-- ============================================================

CREATE TABLE cash_sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    opened_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    closed_at TIMESTAMPTZ,
    opening_balance NUMERIC(15,4) NOT NULL, -- Con cuánto inicia caja
    expected_balance NUMERIC(15,4),         -- Calculado por sistema: opening + ventas cash
    actual_balance NUMERIC(15,4),           -- Lo que el cajero contó al cerrar
    difference NUMERIC(15,4),               -- Faltante o Sobrante
    status VARCHAR(20) DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'CLOSED')),
    notes TEXT
);


-- ============================================================
-- 6. VENTAS
-- ============================================================

CREATE TABLE sales (
    id                 SERIAL PRIMARY KEY,
    invoice_number     VARCHAR(50)   UNIQUE NOT NULL,
    sale_date          TIMESTAMPTZ   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    customer_id        INTEGER       REFERENCES customers(id),
    created_by         INTEGER       NOT NULL REFERENCES users(id),
    status             VARCHAR(20)   NOT NULL DEFAULT 'COMPLETED'
                           CHECK (status IN ('COMPLETED','VOIDED','PARTIAL_RETURN')),
    voided_at          TIMESTAMPTZ,
    voided_by          INTEGER       REFERENCES users(id),
    void_reason        TEXT,
    cash_session_id    INTEGER       REFERENCES cash_sessions(id),
    total_cost_sum     NUMERIC(15,4) NOT NULL DEFAULT 0.0000 CHECK (total_cost_sum >= 0),
    total_tax_sum      NUMERIC(15,4) NOT NULL DEFAULT 0.0000 CHECK (total_tax_sum >= 0),
    total_net_amount   NUMERIC(15,4) NOT NULL DEFAULT 0.0000 CHECK (total_net_amount >= 0),
    total_final_amount NUMERIC(15,4) NOT NULL DEFAULT 0.0000 CHECK (total_final_amount >= 0),
    total_paid         NUMERIC(15,4) NOT NULL DEFAULT 0.0000 CHECK (total_paid >= 0),
    change_given       NUMERIC(15,4) NOT NULL DEFAULT 0.0000 CHECK (change_given >= 0),
    notes              TEXT,
    created_at         TIMESTAMPTZ   NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_void_consistency
        CHECK (
            (status = 'VOIDED' AND voided_at IS NOT NULL AND voided_by IS NOT NULL)
            OR status != 'VOIDED'
        )
);

CREATE TABLE sale_details (
    id                 SERIAL PRIMARY KEY,
    sale_id            INTEGER       NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
    product_id         INTEGER       NOT NULL REFERENCES products(id),
    quantity           NUMERIC(15,3) NOT NULL CHECK (quantity > 0),
    unit_cost          NUMERIC(15,4) NOT NULL CHECK (unit_cost >= 0),
    unit_price         NUMERIC(15,4) NOT NULL CHECK (unit_price >= 0),
    tax_rate_applied   NUMERIC(5,2)  NOT NULL CHECK (tax_rate_applied >= 0),
    tax_amount_applied NUMERIC(15,4) NOT NULL CHECK (tax_amount_applied >= 0),
    line_subtotal      NUMERIC(15,4) NOT NULL CHECK (line_subtotal >= 0),
    line_tax           NUMERIC(15,4) NOT NULL CHECK (line_tax >= 0),
    line_total         NUMERIC(15,4) NOT NULL CHECK (line_total >= 0),
    line_profit        NUMERIC(15,4) NOT NULL
);

CREATE TABLE sale_payments (
    id                SERIAL PRIMARY KEY,
    sale_id           INTEGER       NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
    payment_method_id INTEGER       NOT NULL REFERENCES payment_methods(id),
    amount            NUMERIC(15,4) NOT NULL CHECK (amount > 0),
    reference_code    VARCHAR(100),
    paid_at           TIMESTAMPTZ   NOT NULL DEFAULT CURRENT_TIMESTAMP
);


-- ============================================================
-- 7. DEVOLUCIONES
-- ============================================================

CREATE TABLE sale_returns (
    id               SERIAL PRIMARY KEY,
    original_sale_id INTEGER       NOT NULL REFERENCES sales(id),
    return_date      TIMESTAMPTZ   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    reason           TEXT,
    status           VARCHAR(20)   NOT NULL DEFAULT 'COMPLETED'
                         CHECK (status IN ('COMPLETED','CANCELLED')),
    total_refund     NUMERIC(15,4) NOT NULL DEFAULT 0.0000 CHECK (total_refund >= 0),
    refund_method_id INTEGER       REFERENCES payment_methods(id),
    created_by       INTEGER       NOT NULL REFERENCES users(id),
    created_at       TIMESTAMPTZ   NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE sale_return_details (
    id               SERIAL PRIMARY KEY,
    sale_return_id   INTEGER       NOT NULL REFERENCES sale_returns(id) ON DELETE CASCADE,
    sale_detail_id   INTEGER       NOT NULL REFERENCES sale_details(id),
    product_id       INTEGER       NOT NULL REFERENCES products(id),
    quantity_returned NUMERIC(15,3) NOT NULL CHECK (quantity_returned > 0),
    unit_price       NUMERIC(15,4) NOT NULL CHECK (unit_price >= 0),
    line_refund      NUMERIC(15,4) NOT NULL CHECK (line_refund >= 0),
    restock          BOOLEAN       NOT NULL DEFAULT TRUE
);


-- ============================================================
-- 8. AUDITORÍA
-- ============================================================

CREATE TABLE audit_log (
    id         BIGSERIAL PRIMARY KEY,
    user_id    INTEGER     REFERENCES users(id),
    action     VARCHAR(50) NOT NULL,
    table_name VARCHAR(100),
    record_id  INTEGER,
    old_data   JSONB,
    new_data   JSONB,
    ip_address VARCHAR(45),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);


-- ============================================================
-- 9. ÍNDICES
-- ============================================================

-- Ventas
CREATE INDEX idx_sales_date            ON sales(sale_date DESC);
CREATE INDEX idx_sales_customer        ON sales(customer_id) WHERE customer_id IS NOT NULL;
CREATE INDEX idx_sales_status          ON sales(status) WHERE status != 'VOIDED';
CREATE INDEX idx_sales_created_by      ON sales(created_by);
CREATE INDEX idx_sales_invoice         ON sales(invoice_number);

-- Detalle ventas
CREATE INDEX idx_sale_details_sale     ON sale_details(sale_id);
CREATE INDEX idx_sale_details_product  ON sale_details(product_id);
CREATE INDEX idx_perf_sales_reports    ON sale_details(product_id) INCLUDE (quantity, line_subtotal, line_profit);

-- Pagos
CREATE INDEX idx_sale_payments_sale    ON sale_payments(sale_id);

-- Productos
CREATE INDEX idx_products_supplier     ON products(supplier_id) WHERE is_active = TRUE;
CREATE INDEX idx_products_category     ON products(category_id) WHERE is_active = TRUE;
CREATE INDEX idx_products_sku          ON products(sku) WHERE sku IS NOT NULL;
CREATE INDEX idx_products_barcode      ON products(barcode) WHERE barcode IS NOT NULL;
CREATE INDEX idx_products_low_stock    ON products(stock) WHERE manages_inventory = TRUE AND is_active = TRUE;
CREATE INDEX idx_products_name_trgm    ON products USING gin(name gin_trgm_ops);

-- Kardex
CREATE INDEX idx_inv_movements_product ON inventory_movements(product_id, created_at DESC);
CREATE INDEX idx_inv_movements_type    ON inventory_movements(movement_type);
CREATE INDEX idx_inv_movements_ref     ON inventory_movements(reference_type, reference_id);

-- Compras
CREATE INDEX idx_purchase_invoices_supplier ON purchase_invoices(supplier_id);
CREATE INDEX idx_purchase_invoices_date     ON purchase_invoices(purchase_date DESC);
CREATE INDEX idx_purchase_inv_details_prod  ON purchase_invoice_details(product_id);
CREATE INDEX idx_compras_tributables        ON purchase_invoices(incluir_en_declaracion) WHERE incluir_en_declaracion = TRUE;

-- Devoluciones
CREATE INDEX idx_returns_original_sale ON sale_returns(original_sale_id);

-- Auditoría
CREATE INDEX idx_audit_user            ON audit_log(user_id);
CREATE INDEX idx_audit_table_record    ON audit_log(table_name, record_id);
CREATE INDEX idx_audit_date            ON audit_log(created_at DESC);

-- Clientes
CREATE INDEX idx_customers_with_debt   ON customers(current_balance) WHERE current_balance > 0;


-- ============================================================
-- 10. FUNCIONES UTILITARIAS
-- ============================================================

-- Auto-actualiza updated_at en cualquier tabla que lo tenga
CREATE OR REPLACE FUNCTION fn_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public, pg_temp AS $
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;

-- Registra cambios en audit_log automáticamente
CREATE OR REPLACE FUNCTION fn_audit_log()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public, pg_temp AS $
DECLARE
    v_record_id INTEGER;
    v_old_data  JSONB := NULL;
    v_new_data  JSONB := NULL;
BEGIN
    IF TG_OP = 'INSERT' THEN
        v_record_id := NEW.id;
        v_new_data  := to_jsonb(NEW);
    ELSIF TG_OP = 'UPDATE' THEN
        v_record_id := NEW.id;
        v_old_data  := to_jsonb(OLD);
        v_new_data  := to_jsonb(NEW);
    ELSIF TG_OP = 'DELETE' THEN
        v_record_id := OLD.id;
        v_old_data  := to_jsonb(OLD);
    END IF;

    INSERT INTO audit_log (action, table_name, record_id, old_data, new_data)
    VALUES (TG_OP, TG_TABLE_NAME, v_record_id, v_old_data, v_new_data);

    RETURN COALESCE(NEW, OLD);
END;
$$;


-- ============================================================
-- 11. TRIGGERS — UPDATED_AT
-- ============================================================

CREATE TRIGGER trg_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

CREATE TRIGGER trg_products_updated_at
    BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

CREATE TRIGGER trg_suppliers_updated_at
    BEFORE UPDATE ON suppliers
    FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

CREATE TRIGGER trg_customers_updated_at
    BEFORE UPDATE ON customers
    FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

CREATE TRIGGER trg_purchase_invoices_updated_at
    BEFORE UPDATE ON purchase_invoices
    FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();


-- ============================================================
-- 12. TRIGGERS — AUDITORÍA AUTOMÁTICA
-- ============================================================

CREATE TRIGGER trg_audit_products
    AFTER INSERT OR UPDATE OR DELETE ON products
    FOR EACH ROW EXECUTE FUNCTION fn_audit_log();

CREATE TRIGGER trg_audit_sales
    AFTER INSERT OR UPDATE OR DELETE ON sales
    FOR EACH ROW EXECUTE FUNCTION fn_audit_log();

CREATE TRIGGER trg_audit_purchase_invoices
    AFTER INSERT OR UPDATE OR DELETE ON purchase_invoices
    FOR EACH ROW EXECUTE FUNCTION fn_audit_log();

CREATE TRIGGER trg_audit_customers
    AFTER INSERT OR UPDATE OR DELETE ON customers
    FOR EACH ROW EXECUTE FUNCTION fn_audit_log();

CREATE TRIGGER trg_audit_users
    AFTER INSERT OR UPDATE OR DELETE ON users
    FOR EACH ROW EXECUTE FUNCTION fn_audit_log();


-- ============================================================
-- 13. TRIGGERS — INVENTARIO AUTOMÁTICO
-- ============================================================

-- Mueve stock y registra kardex al insertar un detalle de venta
CREATE OR REPLACE FUNCTION fn_sale_detail_stock()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public, pg_temp AS $
DECLARE
    v_product     products%ROWTYPE;
    v_sale_status VARCHAR(20);
BEGIN
    SELECT * INTO v_product FROM products WHERE id = NEW.product_id FOR UPDATE;
    SELECT status INTO v_sale_status FROM sales WHERE id = NEW.sale_id;

    IF v_product.manages_inventory AND v_sale_status != 'VOIDED' THEN
        IF v_product.stock < NEW.quantity THEN
            RAISE EXCEPTION 'Stock insuficiente para el producto % (disponible: %, solicitado: %)',
                v_product.name, v_product.stock, NEW.quantity;
        END IF;

        INSERT INTO inventory_movements (
            product_id, movement_type, quantity,
            stock_before, stock_after, unit_cost,
            reference_id, reference_type
        ) VALUES (
            NEW.product_id, 'SALE', NEW.quantity,
            v_product.stock, v_product.stock - NEW.quantity, NEW.unit_cost,
            NEW.sale_id, 'SALE'
        );

        UPDATE products
        SET stock = stock - NEW.quantity
        WHERE id = NEW.product_id;
    END IF;

    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_sale_detail_stock
    AFTER INSERT ON sale_details
    FOR EACH ROW EXECUTE FUNCTION fn_sale_detail_stock();


-- Mueve stock y registra kardex al insertar un detalle de compra con cálculo de Costo Promedio Ponderado
CREATE OR REPLACE FUNCTION fn_process_purchase_item()
RETURNS TRIGGER SET search_path = public, pg_temp AS $
DECLARE
    v_old_stock NUMERIC;
    v_old_cost NUMERIC;
    v_new_cost NUMERIC;
BEGIN
    -- 1. Obtener datos actuales con bloqueo para evitar colisiones
    SELECT stock, current_cost INTO v_old_stock, v_old_cost 
    FROM products WHERE id = NEW.product_id FOR UPDATE;

    -- 2. Calcular nuevo costo sugerido (CPP)
    -- Si el stock es 0 o negativo, el nuevo costo es el de la factura
    IF v_old_stock <= 0 THEN
        v_new_cost := NEW.unit_cost_net;
    ELSE
        v_new_cost := ((v_old_stock * v_old_cost) + (NEW.quantity * NEW.unit_cost_net)) / (v_old_stock + NEW.quantity);
    END IF;

    -- 3. Actualizar Maestro de Productos
    UPDATE products SET 
        stock = stock + NEW.quantity,
        current_cost = v_new_cost,
        updated_at = NOW()
    WHERE id = NEW.product_id;

    -- 4. Registrar en Kardex
    INSERT INTO inventory_movements (
        product_id, movement_type, quantity, 
        stock_before, stock_after, unit_cost, 
        reference_id, reference_type
    ) VALUES (
        NEW.product_id, 'PURCHASE', NEW.quantity, 
        v_old_stock, v_old_stock + NEW.quantity, NEW.unit_cost_net,
        NEW.purchase_invoice_id, 'INVOICE'
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public, pg_temp;

CREATE TRIGGER trg_after_purchase_item
    AFTER INSERT ON purchase_invoice_details
    FOR EACH ROW EXECUTE FUNCTION fn_process_purchase_item();


-- Reincorpora stock al procesar una devolución
CREATE OR REPLACE FUNCTION fn_return_detail_stock()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public, pg_temp AS $
DECLARE
    v_product products%ROWTYPE;
BEGIN
    IF NEW.restock THEN
        SELECT * INTO v_product FROM products WHERE id = NEW.product_id FOR UPDATE;

        INSERT INTO inventory_movements (
            product_id, movement_type, quantity,
            stock_before, stock_after, unit_cost,
            reference_id, reference_type
        ) VALUES (
            NEW.product_id, 'SALE_RETURN', NEW.quantity_returned,
            v_product.stock, v_product.stock + NEW.quantity_returned, NEW.unit_price,
            NEW.sale_return_id, 'SALE_RETURN'
        );

        UPDATE products
        SET stock = stock + NEW.quantity_returned
        WHERE id = NEW.product_id;
    END IF;

    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_return_detail_stock
    AFTER INSERT ON sale_return_details
    FOR EACH ROW EXECUTE FUNCTION fn_return_detail_stock();


-- ============================================================
-- 14. TRIGGERS — TOTALES AUTOMÁTICOS EN VENTAS
-- ============================================================

CREATE OR REPLACE FUNCTION fn_recalculate_sale_totals()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public, pg_temp AS $
DECLARE
    v_sale_id INTEGER;
BEGIN
    v_sale_id := COALESCE(NEW.sale_id, OLD.sale_id);

    UPDATE sales SET
        total_cost_sum     = (SELECT COALESCE(SUM(unit_cost * quantity), 0)    FROM sale_details WHERE sale_id = v_sale_id),
        total_tax_sum      = (SELECT COALESCE(SUM(line_tax), 0)                FROM sale_details WHERE sale_id = v_sale_id),
        total_net_amount   = (SELECT COALESCE(SUM(line_subtotal), 0)           FROM sale_details WHERE sale_id = v_sale_id),
        total_final_amount = (SELECT COALESCE(SUM(line_total), 0)              FROM sale_details WHERE sale_id = v_sale_id)
    WHERE id = v_sale_id;

    RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER trg_sale_totals
    AFTER INSERT OR UPDATE OR DELETE ON sale_details
    FOR EACH ROW EXECUTE FUNCTION fn_recalculate_sale_totals();


-- Actualiza total_paid en sales cuando se registra un pago
CREATE OR REPLACE FUNCTION fn_recalculate_sale_paid()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public, pg_temp AS $
DECLARE
    v_sale_id INTEGER;
BEGIN
    v_sale_id := COALESCE(NEW.sale_id, OLD.sale_id);

    UPDATE sales SET
        total_paid   = (SELECT COALESCE(SUM(amount), 0) FROM sale_payments WHERE sale_id = v_sale_id),
        change_given = GREATEST(
            (SELECT COALESCE(SUM(amount), 0) FROM sale_payments WHERE sale_id = v_sale_id)
            - total_final_amount,
            0
        )
    WHERE id = v_sale_id;

    RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER trg_sale_paid
    AFTER INSERT OR UPDATE OR DELETE ON sale_payments
    FOR EACH ROW EXECUTE FUNCTION fn_recalculate_sale_paid();


-- Actualiza totales de compra cuando se inserta un detalle
CREATE OR REPLACE FUNCTION fn_recalculate_purchase_invoice_totals()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public, pg_temp AS $
DECLARE
    v_invoice_id INTEGER;
BEGIN
    v_invoice_id := COALESCE(NEW.purchase_invoice_id, OLD.purchase_invoice_id);

    UPDATE purchase_invoices SET
        total_net_amount     = (SELECT COALESCE(SUM(quantity * unit_cost_net), 0) FROM purchase_invoice_details WHERE purchase_invoice_id = v_invoice_id),
        total_tax_amount     = (SELECT COALESCE(SUM(tax_amount), 0) FROM purchase_invoice_details WHERE purchase_invoice_id = v_invoice_id),
        total_invoice_amount = (SELECT COALESCE(SUM(line_total), 0) FROM purchase_invoice_details WHERE purchase_invoice_id = v_invoice_id)
    WHERE id = v_invoice_id;

    RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER trg_purchase_invoice_totals
    AFTER INSERT OR UPDATE OR DELETE ON purchase_invoice_details
    FOR EACH ROW EXECUTE FUNCTION fn_recalculate_purchase_invoice_totals();


-- Actualiza balance de crédito del cliente
CREATE OR REPLACE FUNCTION fn_update_customer_balance()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public, pg_temp AS $
DECLARE
    v_is_credit BOOLEAN;
BEGIN
    IF NEW.customer_id IS NOT NULL THEN
        SELECT is_credit_customer INTO v_is_credit
        FROM customers WHERE id = NEW.customer_id;

        IF v_is_credit THEN
            UPDATE customers
            SET current_balance = current_balance + NEW.total_final_amount
            WHERE id = NEW.customer_id;
        END IF;
    END IF;

    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_customer_credit_balance
    AFTER INSERT ON sales
    FOR EACH ROW EXECUTE FUNCTION fn_update_customer_balance();


-- Validación de integridad de pago para ventas COMPLETED
CREATE OR REPLACE FUNCTION fn_check_sale_payment()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public, pg_temp AS $
BEGIN
    IF NEW.status = 'COMPLETED' AND NEW.total_paid < NEW.total_final_amount THEN
        RAISE EXCEPTION 'No se puede completar la venta: el pago (%.4f) es menor al total (%.4f)', NEW.total_paid, NEW.total_final_amount;
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_check_sale_payment
    BEFORE UPDATE ON sales
    FOR EACH ROW EXECUTE FUNCTION fn_check_sale_payment();


-- ============================================================
-- 15. PROCEDIMIENTOS ALMACENADOS
-- ============================================================

-- Asignar periodo tributario a facturas de compra
CREATE OR REPLACE FUNCTION fn_asignar_facturas_a_periodo(
    p_factura_ids INTEGER[],
    p_periodo VARCHAR(20),
    p_incluir BOOLEAN
) RETURNS VOID AS $$
BEGIN
    UPDATE purchase_invoices
    SET incluir_en_declaracion = p_incluir,
        periodo_tributario_asignado = p_periodo
    WHERE id = ANY(p_factura_ids);
END;
$$ LANGUAGE plpgsql SET search_path = public, pg_temp;

-- Sugerencia de Precio (Régimen Simplificado Costa Rica)
CREATE OR REPLACE FUNCTION fn_sugerir_precio_venta(
    p_product_id INTEGER,
    p_margen_deseado_pct NUMERIC
) RETURNS NUMERIC AS $$
DECLARE
    v_costo_con_iva NUMERIC;
BEGIN
    -- Obtenemos el último costo neto + su IVA proporcional
    SELECT (current_cost * (1 + (tax_percentage / 100))) 
    INTO v_costo_con_iva
    FROM products WHERE id = p_product_id;

    -- Sugerimos precio: Costo / (1 - Margen)
    RETURN ROUND(v_costo_con_iva / (1 - (p_margen_deseado_pct / 100)), 2);
END;
$$ LANGUAGE plpgsql SET search_path = public, pg_temp;


-- Anula una venta y revierte el inventario
CREATE OR REPLACE FUNCTION fn_void_sale(
    p_sale_id   INTEGER,
    p_user_id   INTEGER,
    p_reason    TEXT
) RETURNS VOID LANGUAGE plpgsql SET search_path = public, pg_temp AS $
DECLARE
    v_sale   sales%ROWTYPE;
    v_detail sale_details%ROWTYPE;
BEGIN
    SELECT * INTO v_sale FROM sales WHERE id = p_sale_id FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Venta % no encontrada', p_sale_id;
    END IF;

    IF v_sale.status = 'VOIDED' THEN
        RAISE EXCEPTION 'La venta % ya está anulada', p_sale_id;
    END IF;

    -- Revertir stock por cada línea
    FOR v_detail IN SELECT * FROM sale_details WHERE sale_id = p_sale_id LOOP
        DECLARE v_product products%ROWTYPE;
        BEGIN
            SELECT * INTO v_product FROM products WHERE id = v_detail.product_id FOR UPDATE;

            IF v_product.manages_inventory THEN
                INSERT INTO inventory_movements (
                    product_id, movement_type, quantity,
                    stock_before, stock_after, unit_cost,
                    reference_id, reference_type, notes
                ) VALUES (
                    v_detail.product_id, 'SALE_RETURN', v_detail.quantity,
                    v_product.stock, v_product.stock + v_detail.quantity, v_detail.unit_cost,
                    p_sale_id, 'VOID', 'Anulación de venta'
                );

                UPDATE products
                SET stock = stock + v_detail.quantity
                WHERE id = v_detail.product_id;
            END IF;
        END;
    END LOOP;

    -- Marcar venta como anulada
    UPDATE sales SET
        status      = 'VOIDED',
        voided_at   = CURRENT_TIMESTAMP,
        voided_by   = p_user_id,
        void_reason = p_reason
    WHERE id = p_sale_id;
END;
$$;


-- Ajuste manual de inventario con trazabilidad
CREATE OR REPLACE FUNCTION fn_adjust_stock(
    p_product_id    INTEGER,
    p_quantity_new  NUMERIC,
    p_user_id       INTEGER,
    p_notes         TEXT DEFAULT NULL
) RETURNS VOID LANGUAGE plpgsql SET search_path = public, pg_temp AS $
DECLARE
    v_product   products%ROWTYPE;
    v_diff      NUMERIC;
    v_mov_type  VARCHAR(30);
BEGIN
    IF p_quantity_new < 0 THEN
        RAISE EXCEPTION 'El stock nuevo no puede ser negativo';
    END IF;

    SELECT * INTO v_product FROM products WHERE id = p_product_id FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Producto % no encontrado', p_product_id;
    END IF;

    v_diff := p_quantity_new - v_product.stock;

    IF v_diff = 0 THEN RETURN; END IF;

    v_mov_type := CASE WHEN v_diff > 0 THEN 'ADJUSTMENT_IN' ELSE 'ADJUSTMENT_OUT' END;

    INSERT INTO inventory_movements (
        product_id, movement_type, quantity,
        stock_before, stock_after,
        reference_type, notes, created_by
    ) VALUES (
        p_product_id, v_mov_type, ABS(v_diff),
        v_product.stock, p_quantity_new,
        'ADJUSTMENT', p_notes, p_user_id
    );

    UPDATE products SET stock = p_quantity_new WHERE id = p_product_id;
END;
$$;


-- Reporte de Venta Total, Costo y Ganancia por Proveedor en un rango de fechas
CREATE OR REPLACE FUNCTION fn_report_supplier_profitability(
    p_start_date TIMESTAMPTZ,
    p_end_date TIMESTAMPTZ
) RETURNS TABLE (
    producto VARCHAR,
    proveedor VARCHAR,
    cantidad NUMERIC,
    total_venta_neta NUMERIC,
    total_costo NUMERIC,
    total_ganancia NUMERIC
) LANGUAGE plpgsql SET search_path = public, pg_temp AS $
BEGIN
    RETURN QUERY
    SELECT 
        p.name::VARCHAR AS producto,
        s.name::VARCHAR AS proveedor,
        SUM(sd.quantity) AS cantidad,
        SUM(sd.line_subtotal) AS total_venta_neta,
        SUM(sd.unit_cost * sd.quantity) AS total_costo,
        SUM(sd.line_profit) AS total_ganancia
    FROM sale_details sd
    JOIN products p ON p.id = sd.product_id
    JOIN suppliers s ON s.id = p.supplier_id
    JOIN sales sa ON sa.id = sd.sale_id
    WHERE sa.sale_date BETWEEN p_start_date AND p_end_date
      AND sa.status != 'VOIDED'
    GROUP BY p.name, s.name;
END;
$$;


-- ============================================================
-- 16. VISTAS
-- ============================================================

CREATE OR REPLACE VIEW vw_reporte_regimen_simplificado_cr_v2 AS
SELECT 
    tr.name AS tipo_iva,
    tr.percentage AS tarifa,
    COUNT(DISTINCT pi.id) AS cantidad_facturas,
    SUM(pid.line_total) AS monto_total_compras,
    pi.periodo_tributario_asignado AS periodo_declarado
FROM purchase_invoice_details pid
JOIN purchase_invoices pi ON pi.id = pid.purchase_invoice_id
JOIN tax_rates tr ON tr.percentage = pid.tax_percentage
WHERE pi.status = 'PROCESSED' 
  AND pi.incluir_en_declaracion = TRUE
GROUP BY tr.name, tr.percentage, pi.periodo_tributario_asignado;

CREATE OR REPLACE VIEW vw_compras_pendientes_tributacion AS
SELECT 
    id, 
    invoice_number, 
    purchase_date, 
    total_invoice_amount,
    incluir_en_declaracion
FROM purchase_invoices
WHERE periodo_tributario_asignado IS NULL
ORDER BY purchase_date ASC;

CREATE OR REPLACE VIEW vw_alerta_limite_simplificado AS
SELECT 
    EXTRACT(YEAR FROM purchase_date) AS annio,
    SUM(total_invoice_amount) AS acumulado_compras_anual,
    CASE 
        WHEN SUM(total_invoice_amount) > 150000000 THEN 'PELIGRO: Supera límite'
        ELSE 'Dentro del límite'
    END AS estado_regimen
FROM purchase_invoices
WHERE status = 'PROCESSED'
GROUP BY annio;

CREATE OR REPLACE VIEW vw_tax_liquidation_report AS
WITH sales_tax AS (
    SELECT 
        tax_rate_applied as rate,
        SUM(line_tax) as tax_collected,
        0 as tax_paid
    FROM sale_details sd
    JOIN sales s ON s.id = sd.sale_id
    WHERE s.status = 'COMPLETED'
    GROUP BY 1
),
purchase_tax AS (
    SELECT 
        tax_percentage as rate,
        0 as tax_collected,
        SUM(tax_amount) as tax_paid
    FROM purchase_invoice_details pid
    JOIN purchase_invoices pi ON pi.id = pid.purchase_invoice_id
    WHERE pi.status = 'PROCESSED'
    GROUP BY 1
),
combined AS (
    SELECT * FROM sales_tax UNION ALL SELECT * FROM purchase_tax
)
SELECT 
    rate as porcentaje_impuesto,
    SUM(tax_collected) as iva_recaudado_ventas,
    SUM(tax_paid) as iva_pagado_compras,
    (SUM(tax_collected) - SUM(tax_paid)) as balance_iva_a_pagar
FROM combined
GROUP BY rate;

CREATE OR REPLACE VIEW vw_tax_report AS
SELECT 
    DATE_TRUNC('day', s.sale_date) AS day,
    sd.tax_rate_applied,
    SUM(sd.line_subtotal) AS net_taxable,
    SUM(sd.line_tax) AS tax_collected,
    SUM(sd.line_total) AS total_with_tax
FROM sale_details sd
JOIN sales s ON s.id = sd.sale_id
WHERE s.status = 'COMPLETED'
GROUP BY 1, 2
ORDER BY 1 DESC;

CREATE OR REPLACE VIEW vw_inventory_abc_analysis AS
WITH product_stats AS (
    SELECT 
        product_id,
        SUM(line_profit) AS total_profit
    FROM sale_details
    GROUP BY product_id
),
ranked_stats AS (
    SELECT 
        product_id,
        total_profit,
        PERCENT_RANK() OVER (ORDER BY total_profit DESC) AS rank_pct
    FROM product_stats
)
SELECT 
    p.name,
    rs.total_profit,
    CASE 
        WHEN rs.rank_pct <= 0.2 THEN 'A (Alta Rentabilidad)'
        WHEN rs.rank_pct <= 0.5 THEN 'B (Media)'
        ELSE 'C (Baja)'
    END AS abc_category
FROM ranked_stats rs
JOIN products p ON p.id = rs.product_id;

CREATE OR REPLACE VIEW vw_customer_debts AS
SELECT 
    c.name,
    c.phone,
    c.credit_limit,
    c.current_balance,
    (c.credit_limit - c.current_balance) AS available_credit,
    MAX(s.sale_date) AS last_purchase_date,
    NOW() - MAX(s.sale_date) AS days_since_last_purchase
FROM customers c
JOIN sales s ON s.customer_id = c.id
WHERE c.current_balance > 0
GROUP BY c.id;

CREATE OR REPLACE VIEW vw_product_price_history AS
SELECT 
    al.record_id AS product_id,
    p.name AS product_name,
    (al.old_data->>'selling_price')::NUMERIC AS old_price,
    (al.new_data->>'selling_price')::NUMERIC AS new_price,
    al.created_at AS changed_at,
    u.full_name AS changed_by_name
FROM audit_log al
LEFT JOIN products p ON p.id = al.record_id
LEFT JOIN users u ON u.id = al.user_id
WHERE al.table_name = 'products' 
  AND al.action = 'UPDATE'
  AND al.old_data->>'selling_price' IS DISTINCT FROM al.new_data->>'selling_price';

-- Resumen ejecutivo de cada venta
CREATE OR REPLACE VIEW vw_sales_summary AS
SELECT
    s.id,
    s.invoice_number,
    s.sale_date,
    s.status,
    COALESCE(c.name, 'Consumidor Final') AS customer_name,
    u.full_name                          AS seller_name,
    s.total_net_amount,
    s.total_tax_sum,
    s.total_final_amount,
    s.total_paid,
    s.change_given,
    (s.total_final_amount - s.total_cost_sum) AS total_profit,
    CASE
        WHEN s.total_final_amount > 0
        THEN ROUND(((s.total_final_amount - s.total_cost_sum) / s.total_final_amount) * 100, 2)
        ELSE 0
    END AS profit_margin_pct
FROM sales s
LEFT JOIN customers c ON c.id = s.customer_id
JOIN      users u     ON u.id = s.created_by;


-- Kardex completo con nombre de producto
CREATE OR REPLACE VIEW vw_kardex AS
SELECT
    im.id,
    im.created_at,
    p.sku,
    p.name         AS product_name,
    im.movement_type,
    im.quantity,
    im.stock_before,
    im.stock_after,
    im.unit_cost,
    im.reference_type,
    im.reference_id,
    im.notes,
    u.full_name    AS created_by_name
FROM inventory_movements im
JOIN products p          ON p.id = im.product_id
LEFT JOIN users u        ON u.id = im.created_by;


-- Productos con stock bajo
CREATE OR REPLACE VIEW vw_low_stock AS
SELECT
    p.id,
    p.sku,
    p.name,
    c.name        AS category,
    s.name        AS supplier,
    p.stock,
    p.min_stock_alert,
    (p.min_stock_alert - p.stock) AS units_needed
FROM products p
LEFT JOIN categories c ON c.id = p.category_id
LEFT JOIN suppliers  s ON s.id = p.supplier_id
WHERE p.manages_inventory = TRUE
  AND p.is_active         = TRUE
  AND p.stock             <= p.min_stock_alert
ORDER BY units_needed DESC;


-- Rentabilidad por producto
CREATE OR REPLACE VIEW vw_product_profitability AS
SELECT
    p.id,
    p.sku,
    p.name,
    c.name                                    AS category,
    COUNT(DISTINCT sd.sale_id)                AS total_sales,
    COALESCE(SUM(sd.quantity), 0)             AS total_qty_sold,
    COALESCE(SUM(sd.line_profit), 0)          AS total_profit,
    COALESCE(SUM(sd.line_total), 0)           AS total_revenue,
    CASE
        WHEN COALESCE(SUM(sd.line_total), 0) > 0
        THEN ROUND((SUM(sd.line_profit) / SUM(sd.line_total)) * 100, 2)
        ELSE 0
    END AS profit_margin_pct,
    p.current_cost,
    p.selling_price,
    p.stock
FROM products p
LEFT JOIN sale_details sd ON sd.product_id = p.id
LEFT JOIN sales         s  ON s.id = sd.sale_id AND s.status != 'VOIDED'
LEFT JOIN categories    c  ON c.id = p.category_id
WHERE p.is_active = TRUE
GROUP BY p.id, p.sku, p.name, c.name, p.current_cost, p.selling_price, p.stock;


-- ============================================================
-- 17. VISTAS MATERIALIZADAS
-- ============================================================

-- Ventas diarias — refrescar 1x/día o con CONCURRENTLY
CREATE MATERIALIZED VIEW mv_daily_sales AS
SELECT
    DATE(sale_date)            AS sale_day,
    COUNT(*)                   AS total_transactions,
    SUM(total_net_amount)      AS net_amount,
    SUM(total_tax_sum)         AS tax_amount,
    SUM(total_final_amount)    AS final_amount,
    SUM(total_final_amount - total_cost_sum) AS total_profit,
    CASE
        WHEN SUM(total_final_amount) > 0
        THEN ROUND((SUM(total_final_amount - total_cost_sum) / SUM(total_final_amount)) * 100, 2)
        ELSE 0
    END AS profit_margin_pct
FROM sales
WHERE status != 'VOIDED'
GROUP BY DATE(sale_date)
WITH DATA;

CREATE UNIQUE INDEX idx_mv_daily_sales_day ON mv_daily_sales(sale_day);


-- Ranking de productos más vendidos
CREATE MATERIALIZED VIEW mv_top_products AS
SELECT
    p.id                              AS product_id,
    p.sku,
    p.name                            AS product_name,
    c.name                            AS category,
    COUNT(DISTINCT sd.sale_id)        AS total_orders,
    SUM(sd.quantity)                  AS total_qty_sold,
    SUM(sd.line_total)                AS total_revenue,
    SUM(sd.line_profit)               AS total_profit,
    ROUND(AVG(sd.unit_price), 4)      AS avg_sell_price
FROM sale_details sd
JOIN products  p ON p.id = sd.product_id
JOIN sales     s ON s.id = sd.sale_id AND s.status != 'VOIDED'
LEFT JOIN categories c ON c.id = p.category_id
GROUP BY p.id, p.sku, p.name, c.name
WITH DATA;

CREATE UNIQUE INDEX idx_mv_top_products_id ON mv_top_products(product_id);


-- Ventas mensuales por método de pago
CREATE MATERIALIZED VIEW mv_sales_by_payment AS
SELECT
    DATE_TRUNC('month', s.sale_date)  AS sale_month,
    pm.name                           AS payment_method,
    COUNT(DISTINCT s.id)              AS total_sales,
    SUM(sp.amount)                    AS total_collected
FROM sale_payments sp
JOIN sales          s  ON s.id  = sp.sale_id  AND s.status != 'VOIDED'
JOIN payment_methods pm ON pm.id = sp.payment_method_id
GROUP BY DATE_TRUNC('month', s.sale_date), pm.name
WITH DATA;

CREATE UNIQUE INDEX idx_mv_sales_by_payment ON mv_sales_by_payment(sale_month, payment_method);


-- ============================================================
-- 18. FUNCIÓN PARA REFRESCAR VISTAS MATERIALIZADAS
-- ============================================================

CREATE OR REPLACE FUNCTION fn_refresh_materialized_views()
RETURNS VOID LANGUAGE plpgsql SET search_path = public, pg_temp AS $
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_daily_sales;
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_top_products;
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_sales_by_payment;
END;
$$;

-- Invocar con: SELECT fn_refresh_materialized_views();
-- Programar en pg_cron: SELECT cron.schedule('0 1 * * *', 'SELECT fn_refresh_materialized_views();');


-- ============================================================
-- 19. DATOS SEMILLA
-- ============================================================

INSERT INTO tax_rates (name, percentage) VALUES 
    ('IVA General', 13.00),
    ('IVA Reducido (Canasta)', 1.00),
    ('IVA Reducido (Salud/Educación)', 2.00),
    ('Exento', 0.00);

INSERT INTO roles (name, description) VALUES
    ('ADMIN',     'Acceso total al sistema'),
    ('MANAGER',   'Reportes, ajustes y anulaciones'),
    ('CASHIER',   'Ventas y consulta de productos'),
    ('WAREHOUSE', 'Gestión de compras e inventario');

INSERT INTO payment_methods (name) VALUES
    ('Efectivo'),
    ('Tarjeta de Crédito'),
    ('Tarjeta de Débito'),
    ('Transferencia'),
    ('Crédito Cliente');

INSERT INTO categories (name, description) VALUES
    ('General',   'Categoría por defecto'),
    ('Servicios', 'Productos sin manejo de inventario');