-- ============================================================
-- Add barcode to products table
-- ============================================================

ALTER TABLE products ADD COLUMN IF NOT EXISTS barcode VARCHAR(100) UNIQUE;

-- Create an index for faster barcode lookups
CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode) WHERE barcode IS NOT NULL;
