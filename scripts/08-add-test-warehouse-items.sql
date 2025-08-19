-- Test warehouse items with specific barcodes for barcode scanning functionality
INSERT INTO warehouse_items (
  barcode,
  order_id,
  material,
  cm,
  mikron,
  current_weight,
  original_weight,
  coil_count,
  status,
  location,
  supplier,
  notes,
  created_at,
  updated_at
) VALUES 
(
  'WH123456ABC123',
  '1',
  'OPP',
  70,
  25,
  1000,
  1000,
  2,
  'Stokta',
  'A-1-01',
  'Beş Yıldız',
  'Test barkodu - Uğur siparişi için alınan stok',
  '2025-01-15T10:00:00Z',
  '2025-01-15T10:00:00Z'
),
(
  'WH789012DEF456',
  '2',
  'CPP',
  55,
  27,
  750,
  800,
  1,
  'Stokta',
  'A-1-02',
  'Ensar',
  'Test barkodu - Kısmi kullanım sonrası kalan stok',
  '2025-01-14T14:30:00Z',
  '2025-01-16T09:15:00Z'
),
(
  'WH345678GHI789',
  NULL,
  'OPP',
  100,
  30,
  500,
  500,
  1,
  'Rezerve',
  'B-2-05',
  'Tugay Plastik',
  'Test barkodu - Acil sipariş için rezerve edildi',
  '2025-01-16T16:00:00Z',
  '2025-01-16T16:00:00Z'
),
(
  'WH901234JKL012',
  NULL,
  'CPP',
  80,
  35,
  25,
  300,
  1,
  'Stokta',
  'C-1-03',
  'Beş Yıldız',
  'Test barkodu - Düşük stok - yenilenmesi gerekiyor',
  '2025-01-10T11:20:00Z',
  '2025-01-17T13:45:00Z'
)
ON CONFLICT (barcode) DO NOTHING;

-- Add corresponding stock movements for these test items
INSERT INTO stock_movements (
  warehouse_item_id,
  type,
  quantity,
  operator,
  notes,
  created_at
)
SELECT 
  w.id,
  'Gelen',
  w.current_weight,
  'Sistem',
  'Test verisi - İlk stok girişi',
  w.created_at
FROM warehouse_items w
WHERE w.barcode IN ('WH123456ABC123', 'WH789012DEF456', 'WH345678GHI789', 'WH901234JKL012')
ON CONFLICT DO NOTHING;
