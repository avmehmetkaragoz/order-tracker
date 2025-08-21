# QR Kod Sistemi - Kapsamlı Kullanım Kılavuzu

## 📋 Genel Bakış

DEKA Depo Yönetim Sistemi artık tam QR kod desteği ile geliştirilmiştir. Bu sistem, barcode sisteminden QR kod sistemine geçiş yaparak daha güvenilir, hızlı ve mobil-uyumlu bir çözüm sunar.

## 🆔 Yeni ID Format Sistemi

### DK Format Yapısı
```
DK + YYMMDD + Müşteri + Sıra
```

**Örnek:** `DK250121G01`
- `DK`: DEKA kısaltması
- `25`: Yıl (2025)
- `01`: Ay (Ocak)
- `21`: Gün (21)
- `G`: Müşteri kodu (G=Genel, A=Müşteri A, B=Müşteri B, vb.)
- `01`: Günlük sıra numarası (01-99)

### Avantajları
- **Kısa ve Anlamlı**: 11 karakter (UUID: 36 karakter)
- **Tarih Bilgisi**: ID'den tarih okunabilir
- **Müşteri Ayrımı**: Müşteri bazlı stok takibi
- **Manuel Giriş**: Mobilde kolayca yazılabilir

## 📱 QR Kod Tarama Sistemi

### Mobil Optimizasyon
- **Kamera İzni**: Otomatik kamera izni isteme
- **HTTPS Desteği**: Güvenli bağlantı gerekliliği
- **Hydration Fix**: Server-side rendering uyumluluğu
- **Hata Yönetimi**: Türkçe hata mesajları

### Kullanım
1. Ana sayfadan "QR Kod Tarama" butonuna tıklayın
2. "QR Kamerayı Başlat" ile kamerayı açın
3. QR kodu kameraya tutun
4. Otomatik algılama ve ürün bilgilerini görüntüleme

### Klavye Kısayolları
- `Q`: QR kod tarama sayfası
- `Ctrl+T`: Yazıcı test sayfası

## 🖨️ 10cm x 10cm Etiket Sistemi

### Etiket Özellikleri
- **Boyut**: 10cm x 10cm (fiziksel yazıcılar için optimize)
- **QR Kod**: 4.2cm x 4.2cm (optimal okuma boyutu)
- **Logo**: DEKA text-based logo (yazdırma güvenilirliği)
- **Kenar Boşluğu**: 0.3cm (kesim toleransı)

### Etiket İçeriği
#### Ana/Palet Etiketi
- Ürün ID (DK format)
- QR kod (4.2cm x 4.2cm)
- Malzeme bilgisi
- Boyutlar (cm x μ)
- Ağırlık
- Tedarikçi
- Müşteri (varsa)
- Lokasyon
- Tarih

#### Bobin Etiketi
- Bobin ID (Ana ID + C01, C02...)
- QR kod
- Bobin numarası (1/5, 2/5...)
- Tahmini ağırlık
- Ana ürün referansı

### CSS Print Optimizasyonu
```css
@media print {
  .label {
    width: 10cm !important;
    height: 10cm !important;
    margin: 0 !important;
    page-break-after: always;
  }
}
```

## 🔧 Yazıcı Test Sistemi

### Test Sayfası Özellikleri
- **Lokasyon**: `/printer-test`
- **Kısayol**: `Ctrl+T`
- **Özellikler**:
  - Test verisi oluşturma
  - Rastgele veri üretimi
  - Önizleme
  - HTML indirme
  - Doğrudan yazdırma

### Yazıcı Ayarları
- **Kağıt Boyutu**: Özel (10cm x 10cm)
- **Kenar Boşlukları**: 0mm
- **Ölçekleme**: %100
- **Renk**: Siyah-Beyaz
- **Kalite**: Yüksek (QR kod netliği için)

## 📊 QR Kod Veri Yapısı

### JSON Format
```json
{
  "id": "DK250121G01",
  "type": "warehouse_item",
  "material": "PE Film",
  "specs": "100cm x 50μ",
  "weight": 1250,
  "supplier": "Tedarikçi A",
  "date": "2025-01-21",
  "customer": "Müşteri X",
  "stockType": "customer",
  "location": "A1-B2-C3",
  "bobinCount": 5,
  "url": "https://domain.com/warehouse/DK250121G01",
  "timestamp": "2025-01-21T10:30:00.000Z"
}
```

### Hata Düzeltme
- **Error Correction Level**: M (Medium)
- **Reed-Solomon**: Otomatik hata düzeltme
- **Margin**: 1px (kompakt tasarım)

## 🔄 Migration Sistemi

### Tamamlanan Migrations
1. **12-migrate-to-qr-codes.sql**: QR kod desteği ekleme
2. **13-migrate-id-to-text-format.sql**: UUID'den DK formatına geçiş
3. **14-switch-to-new-tables.sql**: Yeni tablo yapısına geçiş

### Veri Uyumluluğu
- Eski UUID'ler korundu
- Yeni DK format ID'ler oluşturuldu
- Çift uyumluluk sağlandı

## 🛠️ Teknik Detaylar

### Kullanılan Kütüphaneler
- **qrcode**: QR kod üretimi
- **html5-qrcode**: Mobil QR kod tarama
- **Next.js 15.2.4**: React framework
- **TypeScript**: Tip güvenliği

### Dosya Yapısı
```
lib/
├── qr-generator.ts      # QR kod üretimi
├── qr-scanner.ts        # QR kod tarama
└── warehouse-repo.ts    # Depo veri yönetimi

components/
├── qr-display.tsx       # QR kod görüntüleme
├── qr-printer.tsx       # QR kod yazdırma
└── keyboard-shortcuts.tsx

app/
├── qr-scanner/         # QR tarama sayfası
├── printer-test/       # Yazıcı test sayfası
└── warehouse/          # Depo yönetimi
```

### API Endpoints
- `GET /warehouse/:id`: Ürün detayları
- `POST /warehouse`: Yeni ürün ekleme
- `PUT /warehouse/:id`: Ürün güncelleme

## 📱 Mobil Uyumluluk

### Desteklenen Tarayıcılar
- **Chrome Mobile**: ✅ Tam destek
- **Safari Mobile**: ✅ Tam destek
- **Firefox Mobile**: ✅ Tam destek
- **Edge Mobile**: ✅ Tam destek

### Gereksinimler
- **HTTPS**: Kamera erişimi için zorunlu
- **Kamera İzni**: Kullanıcı onayı gerekli
- **Modern Tarayıcı**: ES6+ desteği

## 🔍 Sorun Giderme

### Yaygın Sorunlar

#### 1. Kamera Açılmıyor
**Çözüm:**
- HTTPS bağlantısı kontrol edin
- Kamera izinlerini kontrol edin
- Başka uygulamaların kamerayı kullanmadığından emin olun

#### 2. QR Kod Okunmuyor
**Çözüm:**
- QR kodu daha yakına tutun
- Işık durumunu iyileştirin
- QR kod kalitesini kontrol edin

#### 3. Yazdırma Boyutu Yanlış
**Çözüm:**
- Yazıcı ayarlarını kontrol edin (10cm x 10cm)
- Ölçekleme %100 olmalı
- Kenar boşlukları 0mm

#### 4. Hydration Failed Hatası
**Çözüm:**
- Sayfa yenileyin
- Tarayıcı cache'ini temizleyin
- JavaScript etkin olduğundan emin olun

## 📈 Performans Optimizasyonu

### QR Kod Üretimi
- **Boyut**: 300px (4.2cm için optimal)
- **Margin**: 1px (kompakt)
- **Format**: PNG (yazdırma kalitesi)

### Mobil Tarama
- **FPS**: 10 (mobil için optimize)
- **Çözünürlük**: 720p (hız-kalite dengesi)
- **Debounce**: 1000ms (çoklu okuma önleme)

## 🔐 Güvenlik

### Veri Koruması
- QR kodlarda hassas bilgi yok
- HTTPS zorunluluğu
- Client-side validation

### Erişim Kontrolü
- Kamera izni yönetimi
- CORS politikaları
- XSS koruması

## 📋 Kullanım Senaryoları

### 1. Yeni Ürün Girişi
1. Warehouse sayfasından "Yeni Ürün" ekle
2. Ürün bilgilerini gir
3. QR etiket yazdır
4. Fiziksel ürüne yapıştır

### 2. Ürün Arama
1. QR Scanner sayfasını aç
2. Kamerayı başlat
3. QR kodu tara
4. Ürün detaylarını görüntüle

### 3. Bobin Takibi
1. Ana ürün için bobin QR kodları oluştur
2. Her bobine ayrı etiket yapıştır
3. Tekil bobin takibi yap

### 4. Yazıcı Testi
1. Printer Test sayfasını aç
2. Test verisi oluştur
3. Önizleme ile kontrol et
4. Test yazdırması yap

## 🎯 Gelecek Geliştirmeler

### Planlanan Özellikler
- [ ] Toplu QR kod üretimi
- [ ] QR kod geçmişi
- [ ] Offline QR kod tarama
- [ ] Barcode uyumluluğu
- [ ] API entegrasyonu

### Performans İyileştirmeleri
- [ ] QR kod cache sistemi
- [ ] Lazy loading
- [ ] Service Worker desteği
- [ ] PWA özellikleri

## 📞 Destek

### Teknik Destek
- **Dokümantasyon**: Bu dosya
- **Log Sistemi**: Browser console
- **Debug Modu**: Development environment

### İletişim
- **Geliştirici**: DEKA Yazılım Ekibi
- **Versiyon**: 2.0.0
- **Son Güncelleme**: 21 Ocak 2025

---

**Not**: Bu sistem sürekli geliştirilmektedir. Yeni özellikler ve iyileştirmeler düzenli olarak eklenmektedir.