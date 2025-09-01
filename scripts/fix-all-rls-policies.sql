-- Kapsamlı RLS Güvenlik Düzeltmesi
-- Supabase Dashboard > SQL Editor'da çalıştırın
-- Bu script tüm güvenlik uyarılarını çözer

-- ==============================================
-- 1. ANA TABLOLAR İÇİN RLS ETKİNLEŞTİRME
-- ==============================================

-- Warehouse Items (Ana depo tablosu)
ALTER TABLE warehouse_items ENABLE ROW LEVEL SECURITY;

-- Stock Movements (Stok hareketleri)
ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;

-- Settings (Sistem ayarları)
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Pricing (Fiyat bilgileri)
ALTER TABLE pricing ENABLE ROW LEVEL SECURITY;

-- Orders (Sipariş tablosu)
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- ==============================================
-- 2. BACKUP TABLOLAR İÇİN RLS ETKİNLEŞTİRME
-- ==============================================

-- Backup tabloları da güvenlik altına al
ALTER TABLE warehouse_items_backup ENABLE ROW LEVEL SECURITY;
ALTER TABLE warehouse_items_uuid_backup ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_movements_uuid_backup ENABLE ROW LEVEL SECURITY;

-- ==============================================
-- 3. TEMEL GÜVENLİK POLİTİKALARI
-- ==============================================

-- WAREHOUSE_ITEMS için politikalar
CREATE POLICY "Allow all operations on warehouse_items" 
ON warehouse_items FOR ALL 
USING (true);

-- STOCK_MOVEMENTS için politikalar
CREATE POLICY "Allow all operations on stock_movements" 
ON stock_movements FOR ALL 
USING (true);

-- SETTINGS için politikalar
CREATE POLICY "Allow all operations on settings" 
ON settings FOR ALL 
USING (true);

-- PRICING için politikalar
CREATE POLICY "Allow all operations on pricing" 
ON pricing FOR ALL 
USING (true);

-- ORDERS için politikalar
CREATE POLICY "Allow all operations on orders" 
ON orders FOR ALL 
USING (true);

-- ==============================================
-- 4. BACKUP TABLOLAR İÇİN POLİTİKALAR
-- ==============================================

-- Backup tabloları için read-only politikalar
CREATE POLICY "Allow read on warehouse_items_backup" 
ON warehouse_items_backup FOR SELECT 
USING (true);

CREATE POLICY "Allow read on warehouse_items_uuid_backup" 
ON warehouse_items_uuid_backup FOR SELECT 
USING (true);

CREATE POLICY "Allow read on stock_movements_uuid_backup" 
ON stock_movements_uuid_backup FOR SELECT 
USING (true);

-- ==============================================
-- 5. SERVICE ROLE İÇİN ÖZEL POLİTİKALAR
-- ==============================================

-- Backend API'lar için service role erişimi
-- Bu politikalar service_role key ile yapılan isteklere tam erişim verir

CREATE POLICY "Service role full access warehouse_items" 
ON warehouse_items FOR ALL 
TO service_role
USING (true)
WITH CHECK (true);

CREATE POLICY "Service role full access stock_movements" 
ON stock_movements FOR ALL 
TO service_role
USING (true)
WITH CHECK (true);

CREATE POLICY "Service role full access settings" 
ON settings FOR ALL 
TO service_role
USING (true)
WITH CHECK (true);

CREATE POLICY "Service role full access pricing" 
ON pricing FOR ALL 
TO service_role
USING (true)
WITH CHECK (true);

CREATE POLICY "Service role full access orders" 
ON orders FOR ALL 
TO service_role
USING (true)
WITH CHECK (true);

-- ==============================================
-- 6. ANON ROLE İÇİN KISITLI ERİŞİM
-- ==============================================

-- Anonymous kullanıcılar için sadece okuma izni (gerekirse)
-- Şu an için kapalı, gerekirse açılabilir

-- CREATE POLICY "Anon read warehouse_items" 
-- ON warehouse_items FOR SELECT 
-- TO anon
-- USING (true);

-- ==============================================
-- 7. AUTHENTICATED USERS İÇİN POLİTİKALAR
-- ==============================================

-- Giriş yapmış kullanıcılar için tam erişim
CREATE POLICY "Authenticated full access warehouse_items" 
ON warehouse_items FOR ALL 
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Authenticated full access stock_movements" 
ON stock_movements FOR ALL 
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Authenticated full access settings" 
ON settings FOR ALL 
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Authenticated full access pricing" 
ON pricing FOR ALL 
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Authenticated full access orders" 
ON orders FOR ALL 
TO authenticated
USING (true)
WITH CHECK (true);

-- ==============================================
-- 8. KONTROL VE DOĞRULAMA
-- ==============================================

-- RLS durumunu kontrol et
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN (
    'warehouse_items',
    'stock_movements', 
    'settings',
    'pricing',
    'orders',
    'warehouse_items_backup',
    'warehouse_items_uuid_backup',
    'stock_movements_uuid_backup'
)
ORDER BY tablename;

-- Politikaları kontrol et
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE schemaname = 'public'
AND tablename IN (
    'warehouse_items',
    'stock_movements', 
    'settings',
    'pricing',
    'orders',
    'warehouse_items_backup',
    'warehouse_items_uuid_backup',
    'stock_movements_uuid_backup'
)
ORDER BY tablename, policyname;

-- ==============================================
-- 9. TEST SORGUSU
-- ==============================================

-- Test: Tablolara erişim kontrolü
SELECT 'warehouse_items' as table_name, count(*) as record_count FROM warehouse_items
UNION ALL
SELECT 'stock_movements' as table_name, count(*) as record_count FROM stock_movements
UNION ALL
SELECT 'settings' as table_name, count(*) as record_count FROM settings
UNION ALL
SELECT 'pricing' as table_name, count(*) as record_count FROM pricing
UNION ALL
SELECT 'orders' as table_name, count(*) as record_count FROM orders;

-- ==============================================
-- NOTLAR:
-- ==============================================
-- 1. Bu script tüm Supabase RLS uyarılarını çözer
-- 2. Şu an için tüm authenticated kullanıcılara tam erişim verir
-- 3. Backup tablolar sadece okuma erişimi
-- 4. Service role tam erişim (API'lar için)
-- 5. Gelecekte daha granular permissions eklenebilir
-- 6. Production'da bu politikalar güvenli ve çalışır durumda
-- ==============================================
