-- Migración: Cambiar purchase_date de DATE a TIMESTAMPTZ para manejo estandarizado de zonas horarias
BEGIN;

ALTER TABLE purchase_invoices 
    ALTER COLUMN purchase_date TYPE TIMESTAMPTZ 
    USING purchase_date::timestamptz;

COMMIT;
