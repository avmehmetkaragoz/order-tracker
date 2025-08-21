-- Migration: Convert warehouse_items.id from UUID to TEXT with new format
-- This script will migrate existing UUID IDs to new DK format

-- Step 1: Create a backup table
CREATE TABLE IF NOT EXISTS warehouse_items_backup AS 
SELECT * FROM warehouse_items;

-- Step 2: Add a new temporary column for new IDs
ALTER TABLE warehouse_items ADD COLUMN new_id TEXT;

-- Step 3: Generate new IDs for existing items
-- Note: This will be done via application code since we need customer info

-- Step 4: Create new table with TEXT ID
CREATE TABLE IF NOT EXISTS warehouse_items_new (
  id TEXT PRIMARY KEY,
  barcode TEXT UNIQUE NOT NULL,
  order_id UUID REFERENCES orders(id),
  material TEXT NOT NULL,
  cm INTEGER NOT NULL,
  mikron INTEGER NOT NULL,
  current_weight DECIMAL(10,2) NOT NULL DEFAULT 0,
  original_weight DECIMAL(10,2) NOT NULL,
  coil_count INTEGER NOT NULL DEFAULT 1,
  original_coil_count INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'Stokta',
  stock_type TEXT DEFAULT 'general',
  customer_name TEXT,
  location TEXT DEFAULT 'Depo',
  supplier TEXT NOT NULL,
  notes TEXT,
  tags TEXT[],
  qr_code TEXT,
  code_type VARCHAR(10) DEFAULT 'qr',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 5: Create new stock_movements table with TEXT foreign key
CREATE TABLE IF NOT EXISTS stock_movements_new (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  warehouse_item_id TEXT NOT NULL REFERENCES warehouse_items_new(id) ON DELETE CASCADE,
  barcode TEXT,
  type TEXT NOT NULL,
  quantity DECIMAL(10,2) NOT NULL,
  destination TEXT,
  operator TEXT,
  notes TEXT,
  order_id UUID REFERENCES orders(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 6: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_warehouse_items_new_barcode ON warehouse_items_new(barcode);
CREATE INDEX IF NOT EXISTS idx_warehouse_items_new_material ON warehouse_items_new(material);
CREATE INDEX IF NOT EXISTS idx_warehouse_items_new_supplier ON warehouse_items_new(supplier);
CREATE INDEX IF NOT EXISTS idx_warehouse_items_new_status ON warehouse_items_new(status);
CREATE INDEX IF NOT EXISTS idx_warehouse_items_new_qr_code ON warehouse_items_new(qr_code);
CREATE INDEX IF NOT EXISTS idx_warehouse_items_new_stock_type ON warehouse_items_new(stock_type);
CREATE INDEX IF NOT EXISTS idx_warehouse_items_new_customer_name ON warehouse_items_new(customer_name);

CREATE INDEX IF NOT EXISTS idx_stock_movements_new_warehouse_item_id ON stock_movements_new(warehouse_item_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_new_type ON stock_movements_new(type);
CREATE INDEX IF NOT EXISTS idx_stock_movements_new_created_at ON stock_movements_new(created_at);

-- Note: The actual data migration will be done via Node.js script
-- to properly generate new IDs with customer information

COMMENT ON TABLE warehouse_items_new IS 'New warehouse items table with TEXT ID using DK format';
COMMENT ON TABLE stock_movements_new IS 'New stock movements table referencing TEXT IDs';
COMMENT ON COLUMN warehouse_items_new.id IS 'New format: DK + YYMMDD + Customer + Sequence (e.g., DK240821A01)';