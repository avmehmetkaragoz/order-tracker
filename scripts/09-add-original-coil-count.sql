-- Migration: Add original_coil_count field to warehouse_items table
-- This field will store the original coil count when items were first received
-- Purpose: Fix product return validation to check against original quantities

-- STEP 1: Add the new column
ALTER TABLE warehouse_items 
ADD COLUMN IF NOT EXISTS original_coil_count INTEGER;

-- STEP 2: Update existing records to set original_coil_count = current coil_count
-- This ensures backward compatibility for existing data
UPDATE warehouse_items 
SET original_coil_count = coil_count 
WHERE original_coil_count IS NULL;

-- STEP 3: Add a comment to document the purpose
COMMENT ON COLUMN warehouse_items.original_coil_count IS 'Original coil count when item was first received - used for return validation';

-- STEP 4: Verify the migration worked correctly
SELECT 
    id,
    barcode,
    material,
    coil_count as current_coils,
    original_coil_count as original_coils,
    CASE 
        WHEN original_coil_count IS NULL THEN 'MISSING ORIGINAL COUNT'
        WHEN original_coil_count = coil_count THEN 'SAME AS CURRENT'
        ELSE 'DIFFERENT FROM CURRENT'
    END as status
FROM warehouse_items 
ORDER BY created_at DESC 
LIMIT 10;

-- STEP 5: Check if any records are missing original_coil_count
SELECT COUNT(*) as missing_count
FROM warehouse_items 
WHERE original_coil_count IS NULL;

-- If missing_count is 0, migration is successful!
