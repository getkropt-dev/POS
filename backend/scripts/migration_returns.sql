-- ============================================================
-- MIGRACIÓN: Corrección de Flujo de Devoluciones y Anulaciones
-- ============================================================

-- FASE 1: Revertir pagos al anular la venta
CREATE OR REPLACE FUNCTION fn_void_sale(
    p_sale_id   INTEGER,
    p_user_id   INTEGER,
    p_reason    TEXT
) RETURNS VOID LANGUAGE plpgsql AS $$
DECLARE
    v_sale   sales%ROWTYPE;
    v_detail sale_details%ROWTYPE;
    v_payment sale_payments%ROWTYPE;
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

    -- Marcar venta como anulada ANTES de insertar los pagos negativos para no disparar fn_check_sale_payment
    UPDATE sales SET
        status      = 'VOIDED',
        voided_at   = CURRENT_TIMESTAMP,
        voided_by   = p_user_id,
        void_reason = p_reason
    WHERE id = p_sale_id;

    -- FASE 1: Movimientos compensatorios de pagos (Revertir pagos)
    FOR v_payment IN SELECT * FROM sale_payments WHERE sale_id = p_sale_id AND amount > 0 LOOP
        INSERT INTO sale_payments (
            sale_id, payment_method_id, amount, reference_code, paid_at
        ) VALUES (
            p_sale_id, v_payment.payment_method_id, -v_payment.amount, 'VOID-' || v_payment.id, CURRENT_TIMESTAMP
        );
    END LOOP;
END;
$$;


-- FASE 2: Evitar sobre-devoluciones a nivel de base de datos
-- Agregar la columna quantity_returned si no existe
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sale_details' AND column_name = 'quantity_returned') THEN
        ALTER TABLE sale_details ADD COLUMN quantity_returned NUMERIC(15,3) NOT NULL DEFAULT 0.000;
        ALTER TABLE sale_details ADD CONSTRAINT chk_quantity_returned CHECK (quantity_returned <= quantity AND quantity_returned >= 0);
    END IF;
END $$;
