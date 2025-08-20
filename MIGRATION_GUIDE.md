# Database Migration Rehberi

## 🎯 Durum
Database migration scripti hazır ancak Supabase JavaScript client üzerinden DDL komutları çalıştıramıyoruz. Migration'ı Supabase Dashboard'dan manuel olarak yapmamız gerekiyor.

## 📋 Adım Adım Migration Rehberi

### 1. Supabase Dashboard'a Giriş
1. [Supabase Dashboard](https://app.supabase.com) adresine gidin
2. Projenizi seçin
3. Sol menüden **SQL Editor**'ı açın

### 2. Migration Script'ini Çalıştırın
Aşağıdaki SQL kodunu SQL Editor'a kopyalayıp çalıştırın:

```sql
-- Add stock type and customer name fields to warehouse_items table
-- This will help organize warehouse into customer-specific and general stock

-- Add stock_type column
ALTER TABLE warehouse_items 
ADD COLUMN stock_type VARCHAR(20) DEFAULT 'general' 
CHECK (stock_type IN ('general', 'customer'));

-- Add customer_name column to store customer info from orders
ALTER TABLE warehouse_items 
ADD COLUMN customer_name VARCHAR(255);

-- Update existing records based on order_id
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

-- Update customer_name from orders table
UPDATE warehouse_items 
SET customer_name = (
  SELECT o.customer
  FROM orders o 
  WHERE o.id = warehouse_items.order_id
  AND o.customer IS NOT NULL 
  AND o.customer != ''
)
WHERE order_id IS NOT NULL;

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_warehouse_items_stock_type ON warehouse_items(stock_type);
CREATE INDEX IF NOT EXISTS idx_warehouse_items_customer_name ON warehouse_items(customer_name);

-- Verify the changes
SELECT 
  stock_type,
  COUNT(*) as count,
  SUM(current_weight) as total_weight
FROM warehouse_items 
GROUP BY stock_type;

-- Show customer stock breakdown
SELECT 
  customer_name,
  COUNT(*) as items,
  SUM(current_weight) as total_weight
FROM warehouse_items 
WHERE stock_type = 'customer'
GROUP BY customer_name
ORDER BY total_weight DESC;
```

### 3. Migration'ı Doğrulayın
Migration başarılı olduktan sonra aşağıdaki komutu çalıştırarak doğrulayın:

```bash
node check-migration.js
```

Bu komut şu çıktıyı vermelidir:
- ✅ Migration appears to be applied - columns exist
- 📊 Stock type distribution gösterilir
- ✅ Database migration status: APPLIED

## 🎉 Migration Tamamlandıktan Sonra

Migration başarılı olduktan sonra:

1. **Product Return Dialog'u güncelleyeceğiz** - Stok türü seçimi ekleyeceğiz
2. **Warehouse Repository'yi test edeceğiz** - Yeni alanların çalıştığını doğrulayacağız
3. **UI'da stok türü filtreleme** zaten mevcut ve çalışıyor olacak

## 🔧 Sorun Giderme

Eğer migration sırasında hata alırsanız:

1. **Tablo yapısını kontrol edin:**
```sql
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'warehouse_items';
```

2. **Mevcut verileri kontrol edin:**
```sql
SELECT COUNT(*) FROM warehouse_items;
SELECT COUNT(*) FROM orders;
```

3. **Hata durumunda geri alma:**
```sql
-- Sadece gerekirse kullanın
ALTER TABLE warehouse_items DROP COLUMN IF EXISTS stock_type;
ALTER TABLE warehouse_items DROP COLUMN IF EXISTS customer_name;
```

## 📞 Yardım

Migration sırasında sorun yaşarsanız, hata mesajını paylaşın ve birlikte çözelim.
