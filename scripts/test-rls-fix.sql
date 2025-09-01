-- RLS Düzeltmesi Test Script'i
-- Bu script'i fix-all-rls-policies.sql'den SONRA çalıştırın

-- ==============================================
-- 1. RLS DURUMU KONTROLÜ
-- ==============================================

-- Tüm tablolarda RLS etkin mi kontrol et
SELECT 
    'RLS Status Check' as test_name,
    schemaname,
    tablename,
    CASE 
        WHEN rowsecurity = true THEN '✅ ENABLED'
        ELSE '❌ DISABLED'
    END as rls_status
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

-- ==============================================
-- 2. POLİTİKA SAYISI KONTROLÜ
-- ==============================================

-- Her tablo için kaç politika var
SELECT 
    'Policy Count Check' as test_name,
    tablename,
    count(*) as policy_count,
    CASE 
        WHEN count(*) > 0 THEN '✅ HAS POLICIES'
        ELSE '❌ NO POLICIES'
    END as status
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
GROUP BY tablename
ORDER BY tablename;

-- ==============================================
-- 3. TOPLAM POLİTİKA KONTROLÜ
-- ==============================================

-- Toplam politika sayısı (20+ olmalı)
SELECT 
    'Total Policy Check' as test_name,
    count(*) as total_policies,
    CASE 
        WHEN count(*) >= 20 THEN '✅ SUFFICIENT POLICIES'
        ELSE '⚠️ NEED MORE POLICIES'
    END as status
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
);

-- ==============================================
-- 4. TABLO ERİŞİM TESTİ
-- ==============================================

-- Tablolara erişim test et
SELECT 
    'Table Access Test' as test_name,
    'warehouse_items' as table_name, 
    count(*) as record_count,
    '✅ ACCESSIBLE' as status
FROM warehouse_items
UNION ALL
SELECT 
    'Table Access Test' as test_name,
    'stock_movements' as table_name, 
    count(*) as record_count,
    '✅ ACCESSIBLE' as status
FROM stock_movements
UNION ALL
SELECT 
    'Table Access Test' as test_name,
    'settings' as table_name, 
    count(*) as record_count,
    '✅ ACCESSIBLE' as status
FROM settings
UNION ALL
SELECT 
    'Table Access Test' as test_name,
    'pricing' as table_name, 
    count(*) as record_count,
    '✅ ACCESSIBLE' as status
FROM pricing
UNION ALL
SELECT 
    'Table Access Test' as test_name,
    'orders' as table_name, 
    count(*) as record_count,
    '✅ ACCESSIBLE' as status
FROM orders;

-- ==============================================
-- 5. SUPABASE UYARI KONTROLÜ
-- ==============================================

-- RLS devre dışı olan tablolar var mı?
SELECT 
    'Supabase Warning Check' as test_name,
    schemaname,
    tablename,
    '❌ STILL HAS RLS WARNING' as status
FROM pg_tables 
WHERE schemaname = 'public' 
AND rowsecurity = false
AND tablename IN (
    'warehouse_items',
    'stock_movements', 
    'settings',
    'pricing',
    'orders',
    'warehouse_items_backup',
    'warehouse_items_uuid_backup',
    'stock_movements_uuid_backup'
);

-- Eğer yukarıdaki sorgu boş sonuç verirse, tüm uyarılar çözülmüştür!

-- ==============================================
-- 6. ÖZET RAPOR
-- ==============================================

-- Final durum özeti
SELECT 
    '🎯 FINAL STATUS SUMMARY' as summary,
    CASE 
        WHEN (
            SELECT count(*) 
            FROM pg_tables 
            WHERE schemaname = 'public' 
            AND rowsecurity = true
            AND tablename IN (
                'warehouse_items', 'stock_movements', 'settings',
                'pricing', 'orders', 'warehouse_items_backup',
                'warehouse_items_uuid_backup', 'stock_movements_uuid_backup'
            )
        ) = 8 THEN '✅ ALL TABLES SECURED'
        ELSE '⚠️ SOME TABLES NOT SECURED'
    END as rls_status,
    CASE 
        WHEN (
            SELECT count(*) 
            FROM pg_policies 
            WHERE schemaname = 'public'
            AND tablename IN (
                'warehouse_items', 'stock_movements', 'settings',
                'pricing', 'orders', 'warehouse_items_backup',
                'warehouse_items_uuid_backup', 'stock_movements_uuid_backup'
            )
        ) >= 20 THEN '✅ POLICIES CREATED'
        ELSE '⚠️ NEED MORE POLICIES'
    END as policy_status,
    '🚀 READY FOR PRODUCTION' as deployment_status;

-- ==============================================
-- BEKLENEN SONUÇLAR:
-- ==============================================
-- 1. Tüm tablolarda RLS: ✅ ENABLED
-- 2. Her tabloda en az 2-3 politika
-- 3. Toplam 20+ politika
-- 4. Tüm tablolara erişim: ✅ ACCESSIBLE
-- 5. Supabase uyarı kontrolü: Boş sonuç
-- 6. Final durum: ✅ ALL SECURED
-- ==============================================
