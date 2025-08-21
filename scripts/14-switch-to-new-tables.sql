-- Final step: Switch to new tables with TEXT IDs
-- Run this AFTER running the Node.js migration script

-- Step 1: Rename old tables (backup)
ALTER TABLE warehouse_items RENAME TO warehouse_items_uuid_backup;
ALTER TABLE stock_movements RENAME TO stock_movements_uuid_backup;

-- Step 2: Rename new tables to active names
ALTER TABLE warehouse_items_new RENAME TO warehouse_items;
ALTER TABLE stock_movements_new RENAME TO stock_movements;

-- Step 3: Update any remaining references
-- Note: Application code should already be updated to use TEXT IDs

-- Step 4: Verify the switch
SELECT
  'warehouse_items' as table_name,
  COUNT(*) as record_count
FROM warehouse_items;

SELECT
  'stock_movements' as table_name,
  COUNT(*) as record_count
FROM stock_movements;

-- Check ID types separately
SELECT
  pg_typeof(id) as id_type
FROM warehouse_items
LIMIT 1;

SELECT
  pg_typeof(warehouse_item_id) as warehouse_item_id_type
FROM stock_movements
LIMIT 1;

-- Step 5: Show sample new IDs
SELECT 
  id,
  barcode,
  supplier,
  customer_name,
  stock_type,
  created_at
FROM warehouse_items
ORDER BY created_at DESC
LIMIT 5;

COMMENT ON TABLE warehouse_items IS 'Active warehouse items table with TEXT ID format (DK+YYMMDD+Customer+Sequence)';
COMMENT ON TABLE stock_movements IS 'Active stock movements table with TEXT foreign keys';
COMMENT ON TABLE warehouse_items_uuid_backup IS 'Backup of original UUID-based warehouse items';
COMMENT ON TABLE stock_movements_uuid_backup IS 'Backup of original UUID-based stock movements';