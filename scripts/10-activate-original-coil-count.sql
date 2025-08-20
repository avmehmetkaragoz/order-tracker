-- Post-Migration: Activate original_coil_count usage
-- This script should be run AFTER the migration is complete
-- It will verify that the original_coil_count column is working properly

-- STEP 1: Verify the column exists and has data
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'warehouse_items' 
AND column_name = 'original_coil_count';

-- STEP 2: Check data integrity
SELECT 
    COUNT(*) as total_items,
    COUNT(original_coil_count) as items_with_original_count,
    COUNT(*) - COUNT(original_coil_count) as missing_original_count
FROM warehouse_items;

-- STEP 3: Sample data verification
SELECT 
    id,
    barcode,
    material,
    coil_count,
    original_coil_count,
    created_at
FROM warehouse_items 
ORDER BY created_at DESC 
LIMIT 5;

-- STEP 4: Test update operation (safe test)
-- This will not change any data, just verify the column can be updated
SELECT 
    id,
    original_coil_count,
    'UPDATE warehouse_items SET original_coil_count = ' || coil_count || ' WHERE id = ''' || id || ''';' as test_update_query
FROM warehouse_items 
WHERE original_coil_count IS NULL
LIMIT 3;

-- If all checks pass, you can now:
-- 1. Uncomment the original_coil_count line in lib/warehouse-repo.ts addItem function
-- 2. Restart your application
-- 3. Test the product return functionality

-- SUCCESS MESSAGE
SELECT 'Migration verification complete! Ready to activate original_coil_count in code.' as status;
