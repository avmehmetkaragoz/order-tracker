-- Migration script to transition from barcode to QR code system
-- This script adds QR code support while maintaining backward compatibility

-- Add QR code column to warehouse_items table
ALTER TABLE warehouse_items ADD COLUMN IF NOT EXISTS qr_code TEXT;
ALTER TABLE warehouse_items ADD COLUMN IF NOT EXISTS code_type VARCHAR(10) DEFAULT 'qr';

-- Create index for QR code searches
CREATE INDEX IF NOT EXISTS idx_warehouse_qr_code ON warehouse_items(qr_code);

-- Update existing items to have QR codes
-- For now, we'll generate QR data based on existing barcode
UPDATE warehouse_items 
SET qr_code = barcode,
    code_type = 'qr'
WHERE qr_code IS NULL;

-- Add comments for documentation
COMMENT ON COLUMN warehouse_items.qr_code IS 'QR code data (JSON format with item details)';
COMMENT ON COLUMN warehouse_items.code_type IS 'Type of code: qr or barcode (legacy)';

-- Update any views or functions that reference barcode
-- (Add specific updates here if you have any views)

-- Create a function to generate QR data
CREATE OR REPLACE FUNCTION generate_qr_data(
    item_id TEXT,
    material TEXT,
    cm INTEGER,
    mikron INTEGER,
    weight DECIMAL,
    supplier TEXT,
    created_date TIMESTAMP,
    customer_name TEXT DEFAULT NULL,
    stock_type TEXT DEFAULT 'general',
    location TEXT DEFAULT 'Depo'
) RETURNS TEXT AS $$
BEGIN
    RETURN json_build_object(
        'id', item_id,
        'type', 'warehouse_item',
        'material', material,
        'specs', cm || 'cm x ' || mikron || 'μ',
        'weight', weight,
        'supplier', supplier,
        'date', created_date::date,
        'customer', customer_name,
        'stockType', stock_type,
        'location', location,
        'url', 'https://app.com/warehouse/' || item_id,
        'timestamp', now()
    )::text;
END;
$$ LANGUAGE plpgsql;

-- Update existing records with proper QR data
UPDATE warehouse_items 
SET qr_code = generate_qr_data(
    barcode,
    material,
    cm,
    mikron,
    current_weight,
    supplier,
    created_at,
    customer_name,
    stock_type,
    location
)
WHERE code_type = 'qr';

-- Add trigger to automatically generate QR code for new items
CREATE OR REPLACE FUNCTION auto_generate_qr_code()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.qr_code IS NULL THEN
        NEW.qr_code := generate_qr_data(
            NEW.barcode,
            NEW.material,
            NEW.cm,
            NEW.mikron,
            NEW.current_weight,
            NEW.supplier,
            NEW.created_at,
            NEW.customer_name,
            NEW.stock_type,
            NEW.location
        );
    END IF;
    
    IF NEW.code_type IS NULL THEN
        NEW.code_type := 'qr';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auto_generate_qr_code
    BEFORE INSERT OR UPDATE ON warehouse_items
    FOR EACH ROW
    EXECUTE FUNCTION auto_generate_qr_code();

-- Create a view for QR code items (new system)
CREATE OR REPLACE VIEW qr_warehouse_items AS
SELECT 
    id,
    barcode as legacy_barcode,
    qr_code,
    code_type,
    material,
    cm,
    mikron,
    current_weight,
    original_weight,
    coil_count,
    original_coil_count,
    status,
    stock_type,
    customer_name,
    location,
    supplier,
    notes,
    tags,
    created_at,
    updated_at,
    order_id
FROM warehouse_items
WHERE code_type = 'qr';

-- Create a view for legacy barcode items
CREATE OR REPLACE VIEW legacy_barcode_items AS
SELECT 
    id,
    barcode,
    qr_code,
    code_type,
    material,
    cm,
    mikron,
    current_weight,
    original_weight,
    coil_count,
    original_coil_count,
    status,
    stock_type,
    customer_name,
    location,
    supplier,
    notes,
    tags,
    created_at,
    updated_at,
    order_id
FROM warehouse_items
WHERE code_type = 'barcode';

-- Add some sample QR codes for testing
INSERT INTO warehouse_items (
    barcode, qr_code, code_type, material, cm, mikron, 
    current_weight, original_weight, coil_count, original_coil_count,
    status, stock_type, location, supplier, notes
) VALUES 
(
    'QR' || to_char(now(), 'YYYYMMDDHH24MISS') || '001',
    generate_qr_data(
        'QR' || to_char(now(), 'YYYYMMDDHH24MISS') || '001',
        'QR Test Kraft Kağıt',
        75,
        85,
        1500.0,
        'QR Test Tedarikçi',
        now(),
        'QR Test Müşteri',
        'customer',
        'QR Test Depo'
    ),
    'qr',
    'QR Test Kraft Kağıt',
    75,
    85,
    1500.0,
    1500.0,
    3,
    3,
    'Stokta',
    'customer',
    'QR Test Depo',
    'QR Test Tedarikçi',
    'QR kod sistemi test ürünü'
),
(
    'QR' || to_char(now(), 'YYYYMMDDHH24MISS') || '002',
    generate_qr_data(
        'QR' || to_char(now(), 'YYYYMMDDHH24MISS') || '002',
        'QR Test Oluklu Karton',
        120,
        5,
        2000.0,
        'QR Test Karton A.Ş.',
        now(),
        NULL,
        'general',
        'Ana Depo'
    ),
    'qr',
    'QR Test Oluklu Karton',
    120,
    5,
    2000.0,
    2000.0,
    5,
    5,
    'Stokta',
    'general',
    'Ana Depo',
    'QR Test Karton A.Ş.',
    'QR kod sistemi genel stok test ürünü'
);

-- Show migration summary
SELECT 
    code_type,
    COUNT(*) as item_count,
    SUM(current_weight) as total_weight
FROM warehouse_items 
GROUP BY code_type
ORDER BY code_type;

-- Show sample QR data
SELECT 
    barcode,
    LEFT(qr_code, 100) || '...' as qr_preview,
    code_type,
    material,
    status
FROM warehouse_items 
WHERE code_type = 'qr'
LIMIT 5;