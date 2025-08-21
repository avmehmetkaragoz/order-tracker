# Güvenlik Sistemi Kılavuzu

Bu dokümantasyon, Order Tracker uygulamasına eklenen güvenlik özelliklerini açıklar.

## 🔒 Güvenlik Özellikleri

### 1. Arama Motoru Koruması

#### robots.txt
- **Dosya**: `public/robots.txt`
- **Amaç**: Tüm arama motoru botlarını engeller
- **İçerik**: `User-agent: *` ve `Disallow: /`

#### Meta Tags
- **Dosya**: `app/layout.tsx`
- **Özellikler**:
  - `noindex`: Sayfaların indexlenmesini engeller
  - `nofollow`: Linklerin takip edilmesini engeller
  - `noarchive`: Sayfaların arşivlenmesini engeller
  - `nosnippet`: Snippet gösterimini engeller
  - `noimageindex`: Görsellerin indexlenmesini engeller

### 2. Şifre Koruması

#### Middleware
- **Dosya**: `middleware.ts`
- **Amaç**: Tüm sayfaları koruma altına alır
- **Çalışma Prensibi**:
  - Her request'i kontrol eder
  - Authentication cookie'sini doğrular
  - Yetkisiz erişimleri `/login` sayfasına yönlendirir

#### Login Sistemi
- **Login Sayfası**: `app/login/page.tsx`
- **API Endpoint**: `app/api/auth/login/route.ts`
- **Logout Endpoint**: `app/api/auth/logout/route.ts`

## 🚀 Kurulum ve Yapılandırma

### Environment Variables

`.env.local` dosyası oluşturun:

```env
# Authentication Configuration
ADMIN_PASSWORD=your-secure-password-here
AUTH_SECRET=your-secure-auth-token-here

# Supabase Configuration (mevcut)
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### Güvenlik Ayarları

1. **ADMIN_PASSWORD**: Giriş için kullanılacak şifre
2. **AUTH_SECRET**: Cookie imzalama için kullanılacak gizli anahtar

⚠️ **Önemli**: Production'da güçlü şifreler kullanın!

## 🔧 Nasıl Çalışır?

### Authentication Flow

1. **Korumasız Erişim**: Kullanıcı herhangi bir sayfaya erişmeye çalışır
2. **Middleware Kontrolü**: `middleware.ts` authentication cookie'sini kontrol eder
3. **Yönlendirme**: Cookie yoksa `/login` sayfasına yönlendirir
4. **Login**: Kullanıcı şifre girer
5. **Doğrulama**: API şifreyi kontrol eder ve cookie ayarlar
6. **Erişim**: Kullanıcı istediği sayfaya yönlendirilir

### Cookie Güvenliği

- **httpOnly**: JavaScript ile erişilemez
- **secure**: HTTPS'de çalışır (production)
- **sameSite**: CSRF saldırılarını önler
- **maxAge**: 30 gün geçerlilik süresi

## 🛡️ Güvenlik Önlemleri

### Arama Motoru Koruması
- ✅ robots.txt ile bot engelleme
- ✅ Meta tags ile indexleme engelleme
- ✅ Sitemap devre dışı

### Erişim Kontrolü
- ✅ Middleware tabanlı koruma
- ✅ Session/cookie authentication
- ✅ Otomatik logout özelliği
- ✅ Güvenli cookie ayarları

## 🔄 Logout İşlemi

Kullanıcılar header'daki "Çıkış" butonuna tıklayarak güvenli şekilde çıkış yapabilir:

1. `/api/auth/logout` endpoint'ine POST request
2. Authentication cookie'si silinir
3. Kullanıcı `/login` sayfasına yönlendirilir

## 📝 Notlar

- Login sayfasında header navigation gösterilmez
- Statik dosyalar (images, manifest, etc.) korunmaz
- API routes middleware'den muaf tutulur
- Development'ta `secure: false`, production'da `secure: true`

## 🚨 Güvenlik Uyarıları

1. **Şifre Güvenliği**: Güçlü şifreler kullanın
2. **Environment Variables**: `.env.local` dosyasını Git'e eklemeyin
3. **HTTPS**: Production'da mutlaka HTTPS kullanın
4. **Regular Updates**: Düzenli olarak şifreleri güncelleyin

## 🔍 Test Etme

1. Uygulamayı başlatın: `npm run dev`
2. Herhangi bir sayfaya erişmeye çalışın
3. `/login` sayfasına yönlendirildiğinizi kontrol edin
4. Doğru şifre ile giriş yapın
5. Tüm sayfalara erişebildiğinizi kontrol edin
6. "Çıkış" butonunu test edin

Bu güvenlik sistemi production-ready olup, basit ama etkili bir koruma sağlar.