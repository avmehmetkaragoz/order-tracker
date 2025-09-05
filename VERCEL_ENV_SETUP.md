# Vercel Environment Variables Setup

## 🚨 Production Authentication Sorunu Çözümü

### Problem
- Deploy başarılı ama şifre (`deka_2025`) geçersiz şifre hatası veriyor
- API response: 401 Unauthorized
- Environment variable sorunu tespit edildi

### Çözüm Adımları

#### 1. Vercel Dashboard'da Environment Variables Ayarla

1. **Vercel Dashboard'a git**: https://vercel.com/dashboard
2. **Projeyi seç**: order-tracker
3. **Settings** sekmesine git
4. **Environment Variables** bölümünü bul
5. **Aşağıdaki environment variable'ları ekle**:

```
Name: AUTH_PASSWORD
Value: deka_2025
Environment: Production, Preview, Development
```

```
Name: AUTH_SECRET
Value: secure-auth-token-2024-production
Environment: Production, Preview, Development
```

```
Name: PRINTNODE_API_KEY
Value: vGCOs9HPWgwxR-r5BrbS6GIdo5F9EEqZwBs8YNRD_VQ
Environment: Production, Preview, Development
```

```
Name: PRINTNODE_PRINTER_ID
Value: 74695298
Environment: Production, Preview, Development
```

#### 2. Kod Değişiklikleri (✅ Tamamlandı)

- `AUTH_PASSWORD` ve `ADMIN_PASSWORD` backward compatibility eklendi
- Production debug logları eklendi
- Fallback değer `deka_2025` olarak güncellendi

#### 3. Deployment Sonrası Test

1. **Yeni deployment tetikle**:
   ```bash
   git add .
   git commit -m "fix: Environment variable uyumsuzluğu düzeltildi"
   git push
   ```

2. **Production'da test et**:
   - Login sayfasına git
   - Şifre: `deka_2025`
   - Console loglarını kontrol et (F12 > Network > API calls)

#### 4. Debug Logları Kontrol

Production'da console logları şunları gösterecek:
```
🔍 DEBUG - Environment Variables:
AUTH_PASSWORD exists: true/false
AUTH_PASSWORD value: deka_2025
ADMIN_PASSWORD exists: true/false
ADMIN_PASSWORD value: undefined
Final ADMIN_PASSWORD used: deka_2025
```

### Environment Variable Öncelik Sırası

Kod şu sırayla environment variable'ları kontrol eder:
1. `process.env.AUTH_PASSWORD` (öncelikli)
2. `process.env.ADMIN_PASSWORD` (fallback)
3. `'deka_2025'` (default değer)

### Güvenlik Notları

- Production'da debug logları kaldırılmalı
- Environment variables'lar Vercel'de güvenli şekilde saklanır
- AUTH_SECRET farklı bir değer kullanmalı

### Troubleshooting

#### Hala 401 hatası alıyorsanız:

1. **Vercel environment variables'ları kontrol edin**
2. **Yeni deployment yapın** (environment variable değişiklikleri yeni deployment gerektirir)
3. **Browser cache'i temizleyin**
4. **Console loglarını kontrol edin**

#### Debug Script Çalıştırma:

```bash
# Local environment kontrol
node scripts/check-env-vars.js

# Production'da API loglarını kontrol et
# Vercel Dashboard > Functions > View Function Logs
```

### Vercel CLI ile Environment Variables

```bash
# Vercel CLI ile environment variable ekle
vercel env add AUTH_PASSWORD
# Value: deka_2025
# Environment: Production, Preview, Development

vercel env add AUTH_SECRET  
# Value: secure-auth-token-2024-production
# Environment: Production, Preview, Development

# Environment variables listele
vercel env ls

# Yeni deployment
vercel --prod
