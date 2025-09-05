# QZ Tray Entegrasyonu - Kurulum ve Kullanım Kılavuzu

Bu kılavuz, Order Tracker projesine QZ Tray entegrasyonunu nasıl kurup kullanacağınızı açıklar.

## 🚀 Kurulum Adımları

### 1. QZ Tray Uygulamasını Kurun
- [QZ Tray resmi sitesinden](https://qz.io/download) en son sürümü indirin
- Windows için `.exe` dosyasını çalıştırın
- Kurulum sırasında varsayılan ayarları kabul edin

### 2. Environment Değişkenlerini Ayarlayın
`.env.local` dosyasına aşağıdaki değişkenleri ekleyin:

```bash
# QZ Tray için RSA Private Key (PEM format)
QZ_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----
MIIEpAIBAAKCAQEA... (tam PEM anahtarınız)
-----END RSA PRIVATE KEY-----"

# Opsiyonel: İmzalama adı
QZ_SIGNER_NAME="OrderTracker"
```

### 3. Private Key Oluşturun
Eğer private key'iniz yoksa, aşağıdaki komutla oluşturabilirsiniz:

```bash
# OpenSSL ile RSA key çifti oluşturun
openssl genrsa -out qz-private-key.pem 2048
openssl rsa -in qz-private-key.pem -pubout -out qz-public-key.pem

# Private key'i .env dosyasına kopyalayın
cat qz-private-key.pem
```

## 🔧 Teknik Detaylar

### Eklenen Dosyalar
- `app/api/qz-sign/route.ts` - Server-side imza endpoint'i
- `components/qz-print-button.tsx` - QZ Tray ile yazdırma komponenti
- Güncellenmiş: `components/qr-printer.tsx` - QR yazdırma için QZ butonu eklendi
- Güncellenmiş: `components/dynamic-printer-test.tsx` - Test sayfası için QZ butonu eklendi

### Güvenlik Akışı
1. QZ Tray, tarayıcıya bir challenge gönderir
2. Tarayıcı, `/api/qz-sign` endpoint'ine challenge'ı gönderir
3. Server, private key ile challenge'ı imzalar
4. İmza tarayıcıya geri döner
5. QZ Tray imzayı doğrular ve yazdırmaya izin verir

## 🖨️ Kullanım

### Ana Sayfa
1. Ana sayfaya gidin (`/`)
2. "Yazıcı Test Sayfası" butonuna tıklayın

### Yazıcı Test Sayfası (`/printer-test`)
- **Normal Yazdır**: Tarayıcı print dialog'u ile yazdırır
- **QZ Yazdır**: QZ Tray ile doğrudan USB yazıcısına gönderir

### QR Yazdırma
- Herhangi bir sipariş sayfasında QR yazdırma bölümüne gidin
- "QZ Yazdır" butonuna tıklayın
- QZ Tray otomatik olarak etiketi yazdırır

## 🔍 Sorun Giderme

### QZ Tray Bağlantı Hatası
```
Hata: "Failed to connect to QZ Tray"
Çözüm:
1. QZ Tray uygulamasının çalıştığından emin olun
2. Firewall'un 6591 portunu engellemediğini kontrol edin
3. HTTPS kullanıyorsanız sertifika güvenilir mi kontrol edin
```

### İmzalama Hatası
```
Hata: "QZ_PRIVATE_KEY not configured"
Çözüm:
1. .env.local dosyasında QZ_PRIVATE_KEY değişkenini ayarlayın
2. Private key'in PEM formatında olduğundan emin olun
```

### Yazıcı Bulunamadı
```
Hata: "No printer found"
Çözüm:
1. Yazıcının USB bağlantısını kontrol edin
2. Yazıcının sürücüsünün yüklü olduğundan emin olun
3. QZ Tray'de yazıcıyı manuel olarak seçmeyi deneyin
```

### Güvenlik Onayı
İlk kullanımda QZ Tray güvenlik dialog'u gösterecektir:
- "Always trust" seçeneğini işaretleyin
- "Allow" butonuna tıklayın

## 📋 Test Adımları

### 1. Temel Test
```bash
# Uygulamayı başlatın
npm run dev

# Yazıcı test sayfasına gidin
# http://localhost:3000/printer-test

# "QZ Test Yazdır" butonuna tıklayın
```

### 2. QR Test
```bash
# Bir sipariş oluşturun veya mevcut bir siparişi açın
# QR yazdırma bölümünde "QZ Yazdır" butonuna tıklayın
```

### 3. Manuel Test (Browser Console)
```javascript
// Browser console'da test edin
const qz = await import('https://unpkg.com/qz-tray/dist/qz-tray.js');
qz.api.setPromiseType(Promise);
await qz.websocket.connect();
const printers = await qz.printers.find();
console.log('Available printers:', printers);
await qz.websocket.disconnect();
```

## 🎯 Desteklenen Yazıcılar

### Zebra ZD220 Serisi
- **Dil**: ZPL (Zebra Programming Language)
- **Örnek ZPL**: `^XA^FO50,50^A0N,30,30^FDTest^FS^XZ`
- **Etiket Boyutu**: 10cm x 10cm optimize edilmiş

### Diğer Yazıcılar
- **Dil**: ESC/POS, EPL, CPCL
- **Konfigürasyon**: `qz.configs.create()` içinde `language` parametresi ayarlanabilir

## 🔐 Güvenlik Notları

- Private key'i asla repo'ya commit etmeyin
- Production'da environment değişkenlerini güvenli şekilde yönetin
- QZ Tray sadece HTTPS sitelerde çalışır (production için gerekli)
- İlk bağlantıda kullanıcı onayı gerekir

## 📞 Destek

Herhangi bir sorun yaşarsanız:
1. Browser console'da hata mesajlarını kontrol edin
2. QZ Tray loglarını inceleyin (`%APPDATA%\QZ Tray\logs\`)
3. Firewall ve antivirus ayarlarını kontrol edin

---

**Not**: Bu entegrasyon geliştirme aşamasındadır. Production kullanımından önce kapsamlı test yapınız.
