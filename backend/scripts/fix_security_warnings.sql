-- 1. Fix Function Search Path Mutable

CREATE OR REPLACE FUNCTION fn_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public, pg_temp
AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION fn_audit_log()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public, pg_temp
AS $$
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

CREATE OR REPLACE FUNCTION fn_sale_detail_stock()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public, pg_temp
AS $$
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

CREATE OR REPLACE FUNCTION fn_process_purchase_item()
RETURNS TRIGGER SET search_path = public, pg_temp
AS $$
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
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION fn_return_detail_stock()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public, pg_temp
AS $$
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

CREATE OR REPLACE FUNCTION fn_recalculate_sale_totals()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public, pg_temp
AS $$
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

CREATE OR REPLACE FUNCTION fn_recalculate_sale_paid()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public, pg_temp
AS $$
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

CREATE OR REPLACE FUNCTION fn_recalculate_purchase_invoice_totals()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public, pg_temp
AS $$
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

CREATE OR REPLACE FUNCTION fn_update_customer_balance()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public, pg_temp
AS $$
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

CREATE OR REPLACE FUNCTION fn_check_sale_payment()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public, pg_temp
AS $$
BEGIN
    IF NEW.status = 'COMPLETED' AND NEW.total_paid < NEW.total_final_amount THEN
        RAISE EXCEPTION 'No se puede completar la venta: el pago (%.4f) es menor al total (%.4f)', NEW.total_paid, NEW.total_final_amount;
    END IF;
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION fn_asignar_facturas_a_periodo(
    p_factura_ids INTEGER[],
    p_periodo VARCHAR(20),
    p_incluir BOOLEAN
) RETURNS VOID SET search_path = public, pg_temp
AS $$
BEGIN
    UPDATE purchase_invoices
    SET incluir_en_declaracion = p_incluir,
        periodo_tributario_asignado = p_periodo
    WHERE id = ANY(p_factura_ids);
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION fn_sugerir_precio_venta(
    p_product_id INTEGER,
    p_margen_deseado_pct NUMERIC
) RETURNS NUMERIC SET search_path = public, pg_temp
AS $$
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
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION fn_void_sale(
    p_sale_id   INTEGER,
    p_user_id   INTEGER,
    p_reason    TEXT
) RETURNS VOID LANGUAGE plpgsql SET search_path = public, pg_temp
AS $$
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

CREATE OR REPLACE FUNCTION fn_adjust_stock(
    p_product_id    INTEGER,
    p_quantity_new  NUMERIC,
    p_user_id       INTEGER,
    p_notes         TEXT DEFAULT NULL
) RETURNS VOID LANGUAGE plpgsql SET search_path = public, pg_temp
AS $$
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
) LANGUAGE plpgsql SET search_path = public, pg_temp
AS $$
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

CREATE OR REPLACE FUNCTION fn_refresh_materialized_views()
RETURNS VOID LANGUAGE plpgsql SET search_path = public, pg_temp
AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_daily_sales;
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_top_products;
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_sales_by_payment;
END;
$$;

-- 2. Extension in Public
CREATE SCHEMA IF NOT EXISTS extensions;
ALTER EXTENSION pg_trgm SET SCHEMA extensions;

-- 3. Materialized Views Permissions
REVOKE SELECT ON public.mv_daily_sales FROM anon, authenticated;
REVOKE SELECT ON public.mv_top_products FROM anon, authenticated;
REVOKE SELECT ON public.mv_sales_by_payment FROM anon, authenticated;
