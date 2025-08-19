-- Adding initial settings data
INSERT INTO settings (key, value) VALUES 
('suppliers', '["Ensar", "Beş Yıldız", "Mega Plastik", "Özkan Ambalaj"]'),
('requesters', '["Tugay", "Uğur", "Mehmet", "Ali"]'),
('customers', '["BKB Ambalaj", "Kami", "Plastik Dünyası", "Ambalaj Plus"]')
ON CONFLICT (key) DO NOTHING;

-- Add some sample pricing data
INSERT INTO pricing (supplier, material, price_per_unit, currency, effective_date, is_active) VALUES 
('Ensar', 'OPP', 1.80, 'EUR', CURRENT_DATE, true),
('Ensar', 'CPP', 2.20, 'EUR', CURRENT_DATE, true),
('Beş Yıldız', 'OPP', 1.75, 'EUR', CURRENT_DATE, true),
('Beş Yıldız', 'CPP', 2.15, 'EUR', CURRENT_DATE, true)
ON CONFLICT (supplier, material, effective_date) DO NOTHING;
