-- Add actual quantity columns to orders table for tracking received vs ordered amounts
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS actual_quantity NUMERIC,
ADD COLUMN IF NOT EXISTS actual_bobin_sayisi INTEGER,
ADD COLUMN IF NOT EXISTS actual_total_price NUMERIC,
ADD COLUMN IF NOT EXISTS is_in_warehouse BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS warehouse_item_id UUID,
ADD COLUMN IF NOT EXISTS spec TEXT;

-- Add comment to explain the new columns
COMMENT ON COLUMN orders.actual_quantity IS 'Gerçek gelen miktar (depoya alınırken girilen)';
COMMENT ON COLUMN orders.actual_bobin_sayisi IS 'Gerçek gelen bobin sayısı (depoya alınırken girilen)';
COMMENT ON COLUMN orders.actual_total_price IS 'Gerçek miktara göre hesaplanan toplam fiyat';
COMMENT ON COLUMN orders.is_in_warehouse IS 'Siparişin depoda olup olmadığı';
COMMENT ON COLUMN orders.warehouse_item_id IS 'İlişkili depo ürünü ID''si';
COMMENT ON COLUMN orders.spec IS 'Ürün spesifikasyonu (örn: 1.90 OPP)';

-- Create index for warehouse queries
CREATE INDEX IF NOT EXISTS idx_orders_is_in_warehouse ON orders(is_in_warehouse);
CREATE INDEX IF NOT EXISTS idx_orders_warehouse_item_id ON orders(warehouse_item_id);
