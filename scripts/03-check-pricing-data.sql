-- Check existing pricing data
SELECT * FROM pricing;

-- If no data exists, insert test pricing for Ensar + OPP
INSERT INTO pricing (
  supplier,
  material,
  price_per_unit,
  currency,
  effective_date,
  is_active
) VALUES (
  'Ensar',
  'OPP',
  25.50,
  'TL',
  CURRENT_DATE,
  true
) ON CONFLICT DO NOTHING;

-- Verify the data was inserted
SELECT * FROM pricing WHERE supplier = 'Ensar' AND material = 'OPP';
