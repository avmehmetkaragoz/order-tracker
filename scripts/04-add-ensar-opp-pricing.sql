-- Check if pricing data exists for Ensar + OPP
SELECT * FROM pricing WHERE supplier = 'Ensar' AND material = 'OPP';

-- Delete any existing pricing for this combination to start fresh
DELETE FROM pricing WHERE supplier = 'Ensar' AND material = 'OPP';

-- Insert active pricing data for Ensar + OPP combination
INSERT INTO pricing (
    id,
    supplier,
    material,
    price_per_kg,
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
);

-- Verify the data was inserted correctly
SELECT * FROM pricing WHERE supplier = 'Ensar' AND material = 'OPP' AND is_active = true;
