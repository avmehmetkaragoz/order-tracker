-- Add stock type and customer name fields to warehouse_items table
-- This will help organize warehouse into customer-specific and general stock

-- Step 1: Add stock_type column
ALTER TABLE warehouse_items 
ADD COLUMN stock_type VARCHAR(20) DEFAULT 'general' 
CHECK (stock_type IN ('general', 'customer'));

-- Step 2: Add customer_name column to store customer info from orders
ALTER TABLE warehouse_items 
ADD COLUMN customer_name VARCHAR(255);

-- Step 3: Update existing records based on order_id
-- If item has order_id, check if that order has a customer
UPDATE warehouse_items 
SET stock_type = CASE 
  WHEN order_id IS NOT NULL THEN (
    SELECT CASE 
      WHEN o.customer IS NOT NULL AND o.customer != '' THEN 'customer'
      ELSE 'general'
    END
    FROM orders o 
    WHERE o.id = warehouse_items.order_id
  )
  ELSE 'general'
END;

-- Step 4: Update customer_name from orders table
UPDATE warehouse_items 
SET customer_name = (
  SELECT o.customer
  FROM orders o 
  WHERE o.id = warehouse_items.order_id
  AND o.customer IS NOT NULL 
  AND o.customer != ''
)
WHERE order_id IS NOT NULL;

-- Step 5: Add index for better performance
CREATE INDEX IF NOT EXISTS idx_warehouse_items_stock_type ON warehouse_items(stock_type);
CREATE INDEX IF NOT EXISTS idx_warehouse_items_customer_name ON warehouse_items(customer_name);

-- Step 6: Verify the changes
SELECT 
  stock_type,
  COUNT(*) as count,
  SUM(current_weight) as total_weight
FROM warehouse_items 
GROUP BY stock_type;

-- Step 7: Show customer stock breakdown
SELECT 
  customer_name,
  COUNT(*) as items,
  SUM(current_weight) as total_weight
FROM warehouse_items 
WHERE stock_type = 'customer'
  AND customer_name IS NOT NULL
GROUP BY customer_name
ORDER BY total_weight DESC;
