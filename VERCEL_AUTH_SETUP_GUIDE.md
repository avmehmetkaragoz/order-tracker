# 🔐 Vercel AUTH_SECRET Kurulum Rehberi

Bu rehber, Vercel'de AUTH_SECRET ve AUTH_PASSWORD environment variables'larını nasıl kuracağınızı adım adım açıklar.

## 📋 Üretilen Güvenli Değerler

**Script çıktısından alınan değerler:**
- **AUTH_SECRET:** `_7xV35wD1ujjvZ_tByISt3xVZFvzEiGh1DlHknCIkGg`
- **AUTH_PASSWORD:** `mCy9yvHwSk0a_4YUPzslfg`

> ⚠️ **ÖNEMLİ:** Bu değerler örnek amaçlıdır. Production'da mutlaka yeni değerler üretin!

## 🚀 Vercel Dashboard'da Kurulum

### Adım 1: Vercel Dashboard'a Giriş
1. [vercel.com](https://vercel.com) adresine gidin
2. Projenizi seçin
3. **Settings** sekmesine tıklayın
4. Sol menüden **Environment Variables** seçin

### Adım 2: AUTH_SECRET Ekleme
1. **Add New** butonuna tıklayın
2. **Name:** `AUTH_SECRET`
3. **Value:** `_7xV35wD1ujjvZ_tByISt3xVZFvzEiGh1DlHknCIkGg`
4. **Environments:** 
   - ✅ Production
   - ✅ Preview  
   - ✅ Development
5. **Save** butonuna tıklayın

### Adım 3: AUTH_PASSWORD Ekleme
1. **Add New** butonuna tıklayın
2. **Name:** `AUTH_PASSWORD`
3. **Value:** `mCy9yvHwSk0a_4YUPzslfg`
4. **Environments:**
   - ✅ Production
   - ✅ Preview
   - ✅ Development
5. **Save** butonuna tıklayın

## 💻 Yerel Geliştirme Kurulumu

### .env.local Dosyası Oluşturma
Proje kök dizininde `.env.local` dosyası oluşturun:

```bash
# Auth Configuration
AUTH_SECRET="_7xV35wD1ujjvZ_tByISt3xVZFvzEiGh1DlHknCIkGg"
AUTH_PASSWORD="mCy9yvHwSk0a_4YUPzslfg"
```

### .gitignore Kontrolü
`.env.local` dosyasının `.gitignore`'da olduğundan emin olun:

```gitignore
# Environment variables
.env.local
.env
```

## 🔄 Yeni Değerler Üretme

Yeni güvenli değerler üretmek için:

```bash
node scripts/generate-auth-secrets.js
```

## 🛡️ Güvenlik En İyi Uygulamaları

### ✅ Yapılması Gerekenler
- Her environment için farklı değerler kullanın
- Değerleri düzenli olarak yenileyin (3-6 ayda bir)
- Production değerlerini asla paylaşmayın
- Script'i güvenli bir ortamda çalıştırın

### ❌ Yapılmaması Gerekenler
- Environment variables'ları git'e commit etmeyin
- Değerleri plain text olarak saklamayın
- Aynı değerleri farklı projeler için kullanmayın
- Değerleri email veya chat'te paylaşmayın

## 🔧 Deployment Sonrası

### Vercel Deployment'ı Yeniden Başlatma
Environment variables ekledikten sonra:

1. Vercel Dashboard'da **Deployments** sekmesine gidin
2. Son deployment'ın yanındaki **⋯** menüsüne tıklayın
3. **Redeploy** seçin
4. **Use existing Build Cache** işaretini kaldırın
5. **Redeploy** butonuna tıklayın

### Test Etme
1. Production URL'nizi ziyaret edin
2. Login sayfasının açıldığını kontrol edin
3. AUTH_PASSWORD ile giriş yapabildiğinizi test edin

## 🆘 Sorun Giderme

### Environment Variables Görünmüyor
- Vercel Dashboard'da değişkenlerin doğru kaydedildiğini kontrol edin
- Tüm environment'lar (Production, Preview, Development) seçili mi?
- Deployment'ı yeniden başlattınız mı?

### Login Çalışmıyor
- AUTH_PASSWORD değerinin doğru olduğunu kontrol edin
- Browser cache'ini temizleyin
- Network sekmesinde API çağrılarını kontrol edin

### Development'ta Çalışmıyor
- `.env.local` dosyasının proje kök dizininde olduğunu kontrol edin
- Development server'ı yeniden başlatın (`npm run dev`)
- Dosya adının `.env.local` olduğundan emin olun (`.env.example` değil)

## 📞 Destek

Sorun yaşıyorsanız:
1. Bu rehberi tekrar gözden geçirin
2. Environment variables'ların doğru yazıldığını kontrol edin
3. Deployment loglarını inceleyin
4. Gerekirse yeni değerler üretin ve tekrar deneyin