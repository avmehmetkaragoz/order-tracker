-- Creating comprehensive script to ensure pricing data exists
-- First, check what pricing data exists
SELECT 'Current pricing data:' as info;
SELECT * FROM pricing ORDER BY created_at DESC;

-- Delete any existing inactive pricing for Ensar + OPP
DELETE FROM pricing 
WHERE supplier = 'Ensar' 
AND material = 'OPP' 
AND is_active = false;

-- Insert or update active pricing for Ensar + OPP
INSERT INTO pricing (
    supplier,
    material,
    price_per_unit,
    currency,
    effective_date,
    is_active,
    created_at,
    updated_at
) VALUES (
    'Ensar',
    'OPP',
    25.50,
    'TL',
    CURRENT_DATE,
    true,
    NOW(),
    NOW()
) ON CONFLICT (supplier, material, effective_date) 
DO UPDATE SET 
    price_per_unit = 25.50,
    currency = 'TL',
    is_active = true,
    updated_at = NOW();

-- Verify the data was inserted
SELECT 'Pricing data after insert:' as info;
SELECT * FROM pricing WHERE supplier = 'Ensar' AND material = 'OPP' ORDER BY created_at DESC;
