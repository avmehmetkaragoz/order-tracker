# 🌐 Cloudflare DNS Setup Guide: takip.dekaplastik.com

## 📋 DNS Configuration Steps

### 1. **Cloudflare Dashboard Access**
1. Login to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Select your domain: `dekaplastik.com`
3. Navigate to **DNS** → **Records**

### 2. **Add CNAME Record for Subdomain**

#### **DNS Record Configuration:**
```
Type: CNAME
Name: takip
Target: cname.vercel-dns.com
Proxy Status: Proxied (🧡 Orange Cloud)
TTL: Auto
```

#### **Step-by-Step:**
1. Click **"+ Add record"**
2. Select **"CNAME"** from dropdown
3. **Name**: `takip`
4. **Target**: `cname.vercel-dns.com` (Vercel's CNAME endpoint)
5. **Proxy Status**: Enable (Orange cloud icon)
6. Click **"Save"**

### 3. **SSL/TLS Configuration**

#### **SSL/TLS Settings:**
1. Go to **SSL/TLS** → **Overview**
2. Set encryption mode to: **"Full (strict)"**
3. Enable **"Always Use HTTPS"**

#### **Edge Certificates:**
1. Go to **SSL/TLS** → **Edge Certificates**
2. Enable **"Always Use HTTPS"**: ✅
3. Enable **"HTTP Strict Transport Security (HSTS)"**: ✅
4. **Minimum TLS Version**: 1.2
5. **Opportunistic Encryption**: ✅
6. **TLS 1.3**: ✅

### 4. **Security Settings**

#### **Security Level:**
1. Go to **Security** → **Settings**
2. **Security Level**: Medium
3. **Challenge Passage**: 30 minutes

#### **WAF (Web Application Firewall):**
1. Go to **Security** → **WAF**
2. Enable **"Web Application Firewall"**: ✅
3. **Sensitivity**: Medium

### 5. **Performance Optimization**

#### **Speed Settings:**
1. Go to **Speed** → **Optimization**
2. **Auto Minify**: Enable CSS, HTML, JavaScript
3. **Brotli**: ✅
4. **Early Hints**: ✅

#### **Caching:**
1. Go to **Caching** → **Configuration**
2. **Caching Level**: Standard
3. **Browser Cache TTL**: 4 hours

### 6. **Page Rules (Optional)**

#### **HTTPS Redirect Rule:**
```
URL Pattern: http://takip.dekaplastik.com/*
Settings: Always Use HTTPS
```

#### **Cache Everything Rule:**
```
URL Pattern: takip.dekaplastik.com/images/*
Settings: Cache Level = Cache Everything
```

## 🔍 DNS Verification

### **Check DNS Propagation:**
1. Use [DNS Checker](https://dnschecker.org)
2. Enter: `takip.dekaplastik.com`
3. Verify CNAME points to Vercel

### **Command Line Verification:**
```bash
# Check CNAME record
nslookup takip.dekaplastik.com

# Check with dig (Linux/Mac)
dig takip.dekaplastik.com CNAME
```

## ⚠️ Important Notes

### **DNS Propagation Time:**
- **Cloudflare**: Usually instant (1-5 minutes)
- **Global Propagation**: Up to 24 hours
- **Most regions**: 1-2 hours

### **Before Adding DNS Record:**
1. **First deploy to Vercel** to get the deployment URL
2. **Then add the CNAME record** in Cloudflare
3. **Finally configure custom domain** in Vercel

### **Troubleshooting:**
- If subdomain doesn't work immediately, wait 5-10 minutes
- Clear browser cache and try incognito mode
- Check Cloudflare Analytics for traffic

## 🎯 Expected Result

After successful configuration:
- ✅ `https://takip.dekaplastik.com` → Redirects to your Vercel deployment
- ✅ SSL certificate automatically provisioned
- ✅ Cloudflare CDN acceleration active
- ✅ Security features enabled

## 📞 Next Steps

1. **Complete DNS setup** (this guide)
2. **Deploy to Vercel** with GitHub integration
3. **Add custom domain** in Vercel dashboard
4. **Test the complete flow**

---

**Domain**: takip.dekaplastik.com
**Status**: Ready for DNS configuration
**SSL**: Automatic (Cloudflare + Vercel)
**CDN**: Cloudflare Global Network