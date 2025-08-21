# 🧪 Production Test Guide: takip.dekaplastik.com

## ✅ **Deployment Status**
- **Domain**: takip.dekaplastik.com ✅
- **Cloudflare DNS**: CNAME configured ✅
- **Vercel Domain**: Valid Configuration ✅
- **Environment Variables**: Configured ✅

## 🔍 **Production Testing Checklist**

### **1. Basic Connectivity Tests**

#### **Domain Access:**
```bash
# Test domain resolution
curl -I https://takip.dekaplastik.com

# Expected: HTTP 200 OK
# SSL Certificate: Valid
```

#### **SSL Certificate:**
- ✅ HTTPS redirect working
- ✅ Valid SSL certificate
- ✅ No mixed content warnings

### **2. QR Code System Tests**

#### **A. QR Code Generation:**
1. **Ana Ürün QR Kodu**
   - Navigate to warehouse page
   - Create new product
   - Generate QR code
   - Verify QR contains correct JSON data

2. **Bobin QR Kodları**
   - Generate coil QR codes (e.g., DK250821B16-C01)
   - Verify format: `ParentID-C##`
   - Test multiple coils per product

3. **Dönüş QR Kodları**
   - Process product return
   - Generate return QR labels
   - Verify async/await functionality (no [object Promise])

#### **B. QR Code Scanning:**
1. **Mobile QR Scanner**
   - Access: `https://takip.dekaplastik.com/qr-scanner`
   - Test camera permissions (HTTPS required)
   - Scan main product QR codes
   - Verify redirection to product detail page

2. **Coil QR Code Redirection**
   - Scan coil QR code (e.g., DK250821B16-C01)
   - Should redirect to: `/warehouse/DK250821B16?coil=01`
   - Verify coil highlighting on main product page

3. **Return QR Codes**
   - Scan return QR codes
   - Verify return tracking functionality

#### **C. Print Functionality:**
1. **10cm x 10cm Labels**
   - Test print preview
   - Verify layout fits 10cm x 10cm
   - Check QR code size (4.2cm)
   - Test company logo display

2. **Print Quality**
   - QR codes should be scannable after printing
   - Text should be readable
   - Layout should not overflow

### **3. Database Operations**

#### **Supabase Connection:**
```javascript
// Test in browser console
console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
// Should show: https://dexvmttyvpzziqfumjju.supabase.co
```

#### **CRUD Operations:**
1. **Create Product**
   - Add new warehouse item
   - Verify database insertion
   - Check real-time updates

2. **Read Operations**
   - Load warehouse page
   - Verify product list display
   - Test search functionality

3. **Update Operations**
   - Edit product details
   - Verify changes persist
   - Test return processing

4. **Delete Operations**
   - Remove test products
   - Verify soft delete (if implemented)

### **4. Mobile Compatibility**

#### **Responsive Design:**
- ✅ Mobile navigation works
- ✅ QR scanner fits mobile screen
- ✅ Touch interactions responsive

#### **Camera Access:**
- ✅ HTTPS enables camera access
- ✅ Permission prompts work
- ✅ Camera stream displays correctly

#### **Performance:**
- ✅ Page load times < 3 seconds
- ✅ QR scanning responsive
- ✅ No JavaScript errors

### **5. Security Tests**

#### **Environment Variables:**
- ✅ No secrets exposed in client-side code
- ✅ API keys properly configured
- ✅ Database access restricted

#### **API Security:**
- ✅ CORS properly configured
- ✅ Rate limiting active (if implemented)
- ✅ Input validation working

### **6. Performance Tests**

#### **Core Web Vitals:**
- **LCP (Largest Contentful Paint)**: < 2.5s
- **FID (First Input Delay)**: < 100ms
- **CLS (Cumulative Layout Shift)**: < 0.1

#### **Lighthouse Score:**
- **Performance**: > 90
- **Accessibility**: > 90
- **Best Practices**: > 90
- **SEO**: > 90

## 🚨 **Common Issues & Solutions**

### **Issue 1: QR Scanner Not Working**
**Symptoms**: Camera doesn't start
**Solution**: 
- Verify HTTPS is working
- Check browser permissions
- Test in incognito mode

### **Issue 2: Database Connection Error**
**Symptoms**: "Failed to fetch" errors
**Solution**:
- Verify Supabase environment variables
- Check Supabase project status
- Verify API keys are correct

### **Issue 3: Print Layout Issues**
**Symptoms**: Content overflows 10cm x 10cm
**Solution**:
- Check CSS print media queries
- Verify QR code dimensions
- Test with different browsers

### **Issue 4: Domain Not Resolving**
**Symptoms**: Site not accessible
**Solution**:
- Check DNS propagation (up to 24 hours)
- Verify Cloudflare proxy settings
- Clear browser cache

## 📊 **Test Results Template**

```
✅ Domain Access: https://takip.dekaplastik.com
✅ SSL Certificate: Valid
✅ QR Code Generation: Working
✅ QR Code Scanning: Working
✅ Mobile Camera: Working
✅ Database Operations: Working
✅ Print Functionality: Working
✅ Coil QR Redirection: Working
✅ Return QR Labels: Working
✅ Performance: Acceptable
```

## 🎯 **Success Criteria**

**Deployment is successful when:**
- ✅ All QR code functionality works
- ✅ Mobile scanning operational
- ✅ Database CRUD operations functional
- ✅ Print layouts correct
- ✅ No JavaScript errors
- ✅ Performance metrics acceptable

---

**Test Date**: 2025-01-21
**Domain**: takip.dekaplastik.com
**Status**: Ready for Production Testing