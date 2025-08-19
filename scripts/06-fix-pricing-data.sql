-- Check current pricing data
SELECT * FROM pricing WHERE supplier = 'Ensar' AND material = 'OPP';

-- Delete any existing inactive pricing for this combination
DELETE FROM pricing WHERE supplier = 'Ensar' AND material = 'OPP' AND is_active = false;

-- Insert active pricing data for Ensar + OPP
INSERT INTO pricing (
    id,
    supplier,
    material,
    price_per_unit,
    currency,
    effective_date,
    is_active,
    created_at,
    updated_at
) VALUES (
    gen_random_uuid(),
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
    is_active = true,
    updated_at = NOW();

-- Verify the data was inserted
SELECT * FROM pricing WHERE supplier = 'Ensar' AND material = 'OPP' AND is_active = true;
