# 📱 QR Kod Sistemi Kullanım Kılavuzu

## 🎯 Genel Bakış

Sipariş Takip uygulaması artık **QR kod sistemi** kullanmaktadır. Bu sistem, geleneksel barkod sisteminden daha gelişmiş özellikler sunar ve mobil cihazlarda daha iyi performans gösterir.

## 🆚 QR Kod vs Barkod Karşılaştırması

| Özellik | Barkod (Eski) | QR Kod (Yeni) |
|---------|---------------|---------------|
| **Veri Kapasitesi** | Sadece ID | JSON formatında tüm ürün bilgileri |
| **Mobil Uyumluluk** | Zor okuma | Kolay ve hızlı okuma |
| **Hata Toleransı** | Düşük | Yüksek (Reed-Solomon) |
| **Okuma Açısı** | Tek yön | 360° her açıdan |
| **Offline Çalışma** | Sadece ID | Tüm ürün bilgileri |
| **Gelişmiş Özellikler** | Yok | Web link, timestamp, metadata |

## 🚀 Yeni Özellikler

### 📊 QR Kod İçeriği
```json
{
  "id": "WH967843EU2ZMM",
  "type": "warehouse_item",
  "material": "Kraft Kağıt",
  "specs": "70cm x 80μ",
  "weight": 1250.5,
  "supplier": "Kağıt A.Ş.",
  "date": "2024-01-15",
  "customer": "Müşteri Adı",
  "stockType": "customer",
  "location": "Depo",
  "url": "https://app.com/warehouse/WH967843EU2ZMM",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### 🔧 Teknik Özellikler
- **Kütüphane**: html5-qrcode (mobil-optimized)
- **Hata Düzeltme**: Medium level (M)
- **Format**: JSON veri yapısı
- **Boyut**: 200x200px (varsayılan)
- **Renk**: Siyah/beyaz (yüksek kontrast)

## 📱 Kullanım

### 1. QR Kod Tarama
- **Erişim**: Ana sayfa → "QR Kod Tarama" veya `Q` tuşu
- **URL**: `/qr-scanner`
- **Özellikler**:
  - Otomatik kamera seçimi (arka kamera öncelikli)
  - Manuel tarama butonu
  - Gerçek zamanlı QR kod algılama
  - Vibrasyon geri bildirimi (mobil)

### 2. QR Kod Üretimi
```typescript
import { QRGenerator } from '@/lib/qr-generator'

// QR kod verisi oluştur
const qrData = QRGenerator.generateQRData({
  id: "WH123456",
  material: "Kraft Kağıt",
  cm: 70,
  mikron: 80,
  weight: 1250,
  supplier: "Tedarikçi A.Ş.",
  date: "2024-01-15"
})

// QR kod görüntüsü oluştur
const qrImage = await QRGenerator.generateDataURL(qrData)
```

### 3. QR Kod Yazdırma
```typescript
import { QRPrinter } from '@/components/qr-printer'

<QRPrinter
  id="WH123456"
  title="Ürün Adı"
  material="Kraft Kağıt"
  specifications="70cm x 80μ"
  weight={1250}
  supplier="Tedarikçi A.Ş."
  date="2024-01-15"
  showCoilQRCodes={true}
  coilCount={3}
/>
```

## 🔄 Migration (Geçiş)

### Veritabanı Değişiklikleri
```sql
-- QR kod kolonları ekle
ALTER TABLE warehouse_items ADD COLUMN qr_code TEXT;
ALTER TABLE warehouse_items ADD COLUMN code_type VARCHAR(10) DEFAULT 'qr';
CREATE INDEX idx_warehouse_qr_code ON warehouse_items(qr_code);
```

### Migration Script Çalıştırma
```bash
# Migration scriptini çalıştır
node scripts/run-qr-migration.js

# Veya SQL scriptini manuel çalıştır
# scripts/12-migrate-to-qr-codes.sql
```

## 📋 Dosya Yapısı

### QR Kod Sistemi Dosyaları
```
lib/
├── qr-generator.ts          # QR kod üretimi
├── qr-scanner.ts           # QR kod tarama
└── warehouse-repo.ts       # QR kod destekli repository

components/
├── qr-display.tsx          # QR kod görüntüleme
├── qr-printer.tsx          # QR kod yazdırma
└── barcode-display.tsx     # Hibrit görüntüleme (QR + Barkod)

app/
└── qr-scanner/
    └── page.tsx            # QR kod tarama sayfası

scripts/
├── 12-migrate-to-qr-codes.sql    # SQL migration
└── run-qr-migration.js           # Node.js migration
```

## 🎮 Klavye Kısayolları

| Kısayol | Açıklama |
|---------|----------|
| `Q` | QR kod tarama sayfasını aç |
| `B` | Eski barkod tarama sayfasını aç (geçiş dönemi) |
| `W` | Depo yönetimi |
| `N` | Yeni sipariş |

## 🔧 Geliştirici Notları

### QR Kod Bileşenleri Kullanımı

#### 1. QR Display Component
```tsx
import { QRDisplay } from '@/components/qr-display'

<QRDisplay 
  data={qrData} 
  width={200} 
  showData={true}
  className="border rounded"
/>
```

#### 2. Hibrit Display (QR + Barkod)
```tsx
import { BarcodeDisplay } from '@/components/barcode-display'

<BarcodeDisplay 
  text="WH123456"
  type="both"  // 'qr', 'barcode', 'both'
  qrData={qrDataObject}
  width={200}
/>
```

#### 3. QR Scanner Integration
```tsx
import { QRScanner } from '@/lib/qr-scanner'

const scanner = new QRScanner()
await scanner.startScanning(
  containerElement,
  (result) => console.log('QR kod:', result),
  (error) => console.error('Hata:', error)
)
```

### Repository Kullanımı
```typescript
import { warehouseRepo } from '@/lib/warehouse-repo'

// QR kod ile arama
const item = await warehouseRepo.getItemByQRCode(qrData)

// Hibrit arama (QR + Barkod)
const item = await warehouseRepo.searchByCode(code)

// QR kod üretimi
const qrData = await warehouseRepo.generateQRCode(item)
```

## 🐛 Sorun Giderme

### Yaygın Sorunlar

#### 1. Kamera Erişimi Reddedildi
**Çözüm**: 
- HTTPS bağlantısı kullanın
- Tarayıcı ayarlarından kamera iznini etkinleştirin
- Diğer kamera uygulamalarını kapatın

#### 2. QR Kod Okunamıyor
**Çözüm**:
- QR kodu daha net hizalayın
- Işık durumunu iyileştirin
- Manuel arama kullanın
- Farklı kamera deneyin

#### 3. Mobil Tarayıcı Uyumluluğu
**Desteklenen Tarayıcılar**:
- ✅ Chrome (Android/iOS)
- ✅ Safari (iOS)
- ✅ Firefox (Android)
- ⚠️ Edge (sınırlı destek)

#### 4. QR Kod Üretimi Hatası
**Kontrol Listesi**:
- Veri formatının doğru olduğundan emin olun
- JSON syntax hatası olmadığını kontrol edin
- Veri boyutunun QR kod limitlerini aşmadığını kontrol edin

## 📈 Performans İpuçları

### Mobil Optimizasyon
- QR kod boyutunu 200x200px ile sınırlayın
- Düşük frame rate kullanın (15-30 FPS)
- Gereksiz debug loglarını kapatın
- Kamera çözünürlüğünü optimize edin

### Yazdırma Optimizasyonu
- Yüksek kontrast kullanın (siyah/beyaz)
- Minimum 2cm x 2cm boyut
- Kenar boşluğu bırakın (margin)
- Kaliteli yazıcı kullanın

## 🔮 Gelecek Planları

### Planlanan Özellikler
- [ ] Toplu QR kod üretimi
- [ ] QR kod analitikleri
- [ ] Özel QR kod tasarımları
- [ ] NFC entegrasyonu
- [ ] Augmented Reality (AR) desteği

### Veritabanı Geliştirmeleri
- [ ] QR kod geçmişi tablosu
- [ ] QR kod performans metrikleri
- [ ] Otomatik QR kod yenileme

## 📞 Destek

Sorunlarınız için:
1. Bu dokümantasyonu kontrol edin
2. Debug scriptlerini çalıştırın
3. Console loglarını inceleyin
4. Geliştirici ekibiyle iletişime geçin

---

**Son Güncelleme**: 21 Ağustos 2025  
**Versiyon**: 2.0.0 (QR Kod Sistemi)