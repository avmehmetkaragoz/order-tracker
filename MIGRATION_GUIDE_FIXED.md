# Database Migration Rehberi - Düzeltilmiş Versiyon

## 🚨 Hata Çözümü
"Unable to find snippet" hatası alıyorsanız, aşağıdaki adımları takip edin:

## 📋 Adım Adım Migration Rehberi

### 1. Supabase Dashboard'a Giriş
1. [Supabase Dashboard](https://app.supabase.com) adresine gidin
2. Projenizi seçin
3. Sol menüden **SQL Editor**'ı açın

### 2. Yeni Query Oluşturun
1. SQL Editor'da **"New query"** butonuna tıklayın
2. Query'ye bir isim verin: "Add Stock Type Migration"

### 3. Migration Script'ini Kopyalayın
Aşağıdaki SQL kodunu **tamamen** kopyalayıp SQL Editor'a yapıştırın:

```sql
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
```

### 4. Script'i Çalıştırın
1. **"Run"** butonuna tıklayın (veya Ctrl+Enter)
2. Script'in tamamının çalıştığını bekleyin
3. Hata mesajı yoksa migration başarılı

### 5. Sonuçları Kontrol Edin
Migration başarılı olduktan sonra aşağıdaki sonuçları görmelisiniz:
- İlk sorgu: Stok türlerine göre dağılım
- İkinci sorgu: Müşteri stoklarının detayı

### 6. Migration'ı Doğrulayın
Terminal'de aşağıdaki komutu çalıştırın:

```bash
node check-migration.js
```

Bu komut şu çıktıyı vermelidir:
- ✅ Migration appears to be applied - columns exist
- 📊 Stock type distribution gösterilir
- ✅ Database migration status: APPLIED

## 🔧 Alternatif Yöntem (Eğer Hala Hata Alırsanız)

### Adım Adım Çalıştırma
Eğer tüm script'i bir seferde çalıştırmakta sorun yaşıyorsanız, her adımı ayrı ayrı çalıştırın:

**1. Adım - stock_type kolonu ekle:**
```sql
ALTER TABLE warehouse_items 
ADD COLUMN stock_type VARCHAR(20) DEFAULT 'general' 
CHECK (stock_type IN ('general', 'customer'));
```

**2. Adım - customer_name kolonu ekle:**
```sql
ALTER TABLE warehouse_items 
ADD COLUMN customer_name VARCHAR(255);
```

**3. Adım - Mevcut kayıtları güncelle:**
```sql
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
```

**4. Adım - Müşteri adlarını güncelle:**
```sql
UPDATE warehouse_items 
SET customer_name = (
  SELECT o.customer
  FROM orders o 
  WHERE o.id = warehouse_items.order_id
  AND o.customer IS NOT NULL 
  AND o.customer != ''
)
WHERE order_id IS NOT NULL;
```

**5. Adım - Index'leri ekle:**
```sql
CREATE INDEX IF NOT EXISTS idx_warehouse_items_stock_type ON warehouse_items(stock_type);
CREATE INDEX IF NOT EXISTS idx_warehouse_items_customer_name ON warehouse_items(customer_name);
```

**6. Adım - Kontrol et:**
```sql
SELECT 
  stock_type,
  COUNT(*) as count,
  SUM(current_weight) as total_weight
FROM warehouse_items 
GROUP BY stock_type;
```

## 📞 Sorun Giderme

### Yaygın Hatalar:

1. **"column already exists"** hatası:
   - Bu normal, migration zaten uygulanmış demektir
   - `node check-migration.js` ile kontrol edin

2. **"table does not exist"** hatası:
   - `warehouse_items` tablosunun var olduğundan emin olun
   - Proje seçimini kontrol edin

3. **"permission denied"** hatası:
   - Supabase projesinde admin yetkileriniz olduğundan emin olun

### Başarı Kontrolü:
Migration başarılı olduktan sonra:
- Warehouse sayfasında stok türü filtreleri çalışmalı
- Product return dialog'da stok türü seçimi görünmeli
- Stok türü badge'leri warehouse item'larda görünmeli

## 🎉 Migration Tamamlandıktan Sonra

Migration başarılı olduktan sonra:
1. Uygulamayı yeniden başlatın: `npm run dev`
2. Warehouse sayfasını kontrol edin
3. Product return dialog'u test edin
4. Stok türü filtrelemesini deneyin

Herhangi bir sorun yaşarsanız, hata mesajını paylaşın!
