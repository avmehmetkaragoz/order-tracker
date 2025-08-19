-- Creating database tables for orders, warehouse, settings, and pricing
-- Orders table
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester TEXT NOT NULL,
  supplier TEXT NOT NULL,
  customer TEXT,
  material TEXT NOT NULL,
  cm NUMERIC,
  mikron NUMERIC,
  bobin_sayisi INTEGER,
  description TEXT,
  quantity NUMERIC NOT NULL,
  unit TEXT NOT NULL DEFAULT 'KG',
  custom_price BOOLEAN DEFAULT false,
  price_per_unit NUMERIC,
  currency TEXT DEFAULT 'EUR',
  total_price NUMERIC,
  status TEXT NOT NULL DEFAULT 'Talep Edildi',
  ordered_date DATE,
  eta_date DATE,
  delivered_date DATE,
  notes TEXT,
  tags TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Warehouse items table
CREATE TABLE IF NOT EXISTS warehouse_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  barcode TEXT UNIQUE NOT NULL,
  material TEXT NOT NULL,
  cm NUMERIC,
  mikron NUMERIC,
  supplier TEXT,
  current_weight NUMERIC NOT NULL,
  original_weight NUMERIC NOT NULL,
  coil_count INTEGER NOT NULL DEFAULT 1,
  location TEXT NOT NULL DEFAULT 'Genel Depo',
  status TEXT NOT NULL DEFAULT 'Stokta',
  notes TEXT,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Stock movements table
CREATE TABLE IF NOT EXISTS stock_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  warehouse_item_id UUID NOT NULL REFERENCES warehouse_items(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- 'Gelen', 'Çıkan', 'İade', 'Düzeltme', 'Hasarlı'
  quantity NUMERIC NOT NULL,
  notes TEXT,
  operator TEXT DEFAULT 'Sistem',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Settings table
CREATE TABLE IF NOT EXISTS settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Pricing table
CREATE TABLE IF NOT EXISTS pricing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier TEXT NOT NULL,
  material TEXT NOT NULL,
  price_per_unit NUMERIC NOT NULL,
  currency TEXT NOT NULL DEFAULT 'EUR',
  effective_date DATE NOT NULL DEFAULT CURRENT_DATE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(supplier, material, effective_date)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_supplier ON orders(supplier);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_warehouse_items_status ON warehouse_items(status);
CREATE INDEX IF NOT EXISTS idx_warehouse_items_barcode ON warehouse_items(barcode);
CREATE INDEX IF NOT EXISTS idx_stock_movements_warehouse_item ON stock_movements(warehouse_item_id);
CREATE INDEX IF NOT EXISTS idx_pricing_supplier_material ON pricing(supplier, material);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_warehouse_items_updated_at BEFORE UPDATE ON warehouse_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_settings_updated_at BEFORE UPDATE ON settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_pricing_updated_at BEFORE UPDATE ON pricing FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
