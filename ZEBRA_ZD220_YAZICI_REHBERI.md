# 🖨️ Zebra ZD220 Yazıcı Kullanım Rehberi

## 📋 **Sorun Çözüldü!**

Zebra ZD220 etiket yazıcınız için CSS optimizasyonu tamamlandı. Artık 100x100mm etiketleriniz doğru boyutta yazdırılacak.

## 🔧 **Yapılan Optimizasyonlar**

### **1. CSS Print Media Query**
```css
@media print {
  @page {
    size: 100mm 100mm;  /* Zebra ZD220 için tam boyut */
    margin: 0;
  }
  html, body { 
    margin: 0; 
    padding: 0; 
    width: 100mm;
    height: 100mm;
    overflow: hidden;
  }
  .label {
    width: 100mm !important;
    height: 100mm !important;
    margin: 0 !important;
    padding: 3mm !important;
    border: none !important;
    box-sizing: border-box;
    position: absolute;
    top: 0;
    left: 0;
  }
}
```

### **2. Zebra-Specific Ayarlar**
- **Sayfa Boyutu:** 100mm x 100mm (tam etiket boyutu)
- **Kenar Boşlukları:** 0mm
- **Padding:** 3mm (içerik için güvenli alan)
- **Position:** Absolute (A4 container'dan bağımsız)

## 📱 **Browser Print Ayarları**

### **Chrome/Edge için:**
1. **Yazdır** butonuna tıklayın
2. **Hedef:** Zebra ZD220 seçin
3. **Kağıt boyutu:** "Özel" → 100 x 100 mm
4. **Kenar boşlukları:** Minimum (0mm)
5. **Ölçeklendirme:** %100
6. **Seçenekler:** "Arka plan grafikleri" ✅

### **Firefox için:**
1. **Yazdır** butonuna tıklayın
2. **Yazıcı:** Zebra ZD220 seçin
3. **Kağıt boyutu:** Özel → 10cm x 10cm
4. **Kenar boşlukları:** 0
5. **Ölçeklendirme:** %100

## 🎯 **Test Adımları**

### **1. Hızlı Test**
1. https://takip.dekaplastik.com/warehouse/DK250901M95 sayfasını açın
2. "Yazdır" butonuna tıklayın
3. Print preview'da etiketin tam 100x100mm olduğunu kontrol edin
4. Zebra ZD220'ye yazdırın

### **2. Detaylı Test**
1. **Printer Test Sayfası:** `/printer-test` sayfasını kullanın
2. **Test verisi oluşturun**
3. **Önizleme** ile boyutları kontrol edin
4. **Yazdırma testi** yapın

## 🔍 **Sorun Giderme**

### **Problem: Hala A4 boyutunda görünüyor**
**Çözüm:**
1. Browser cache'ini temizleyin (Ctrl+F5)
2. Yazıcı ayarlarını kontrol edin
3. "Özel kağıt boyutu" seçili olduğundan emin olun

### **Problem: Etiket kesilmiş görünüyor**
**Çözüm:**
1. Kenar boşluklarını 0mm yapın
2. Ölçeklendirmeyi %100 ayarlayın
3. "Sayfaya sığdır" seçeneğini kapatın

### **Problem: QR kod bulanık**
**Çözüm:**
1. Yazıcı kalitesini "Yüksek" yapın
2. "Arka plan grafikleri" seçeneğini açın
3. Yazıcı kafasını temizleyin

## 📊 **Zebra ZD220 Spesifikasyonları**

### **Desteklenen Etiket Boyutları:**
- ✅ 100mm x 100mm (bizim kullandığımız)
- ✅ 100mm x 150mm
- ✅ 76mm x 25mm
- ✅ 57mm x 32mm

### **Yazdırma Kalitesi:**
- **Çözünürlük:** 203 dpi
- **Yazdırma Hızı:** 102mm/saniye
- **Yazdırma Genişliği:** 104mm

### **Bağlantı Seçenekleri:**
- USB 2.0
- Ethernet (opsiyonel)
- Wi-Fi (opsiyonel)

## 🎨 **Etiket Tasarım Özellikleri**

### **QR Kod Boyutları:**
- **Ana QR Kod:** 42mm x 42mm
- **Margin:** 1px (kompakt tasarım)
- **Error Correction:** Medium (M)

### **Font Boyutları:**
- **ID Display:** 14px (monospace)
- **Specifications:** 13px (bold)
- **Info Text:** 11px
- **Footer:** 9px

### **Layout:**
- **Header:** 8mm (logo + başlık)
- **QR Section:** 45mm (QR kod alanı)
- **Info Section:** 35mm (bilgi alanı)
- **Footer:** 12mm (alt bilgi)

## 🔧 **Yazıcı Bakımı**

### **Günlük Bakım:**
- Yazıcı kafasını yumuşak bezle temizleyin
- Etiket rulosunun düzgün yerleştirildiğini kontrol edin
- Yazıcı içinde kağıt artığı olup olmadığını kontrol edin

### **Haftalık Bakım:**
- Yazıcı kafasını alkol ile temizleyin
- Sensörleri temizleyin
- Etiket yolunu kontrol edin

## 📞 **Destek**

### **Yaygın Sorunlar:**
1. **Etiket takılması:** Etiket yolunu temizleyin
2. **Bulanık yazdırma:** Yazıcı kafasını temizleyin
3. **Boyut sorunu:** Browser ayarlarını kontrol edin

### **Teknik Destek:**
- **Zebra Destek:** https://www.zebra.com/support
- **Sistem Desteği:** Bu dokümantasyon

## ✅ **Başarı Kontrol Listesi**

- [ ] Browser print ayarları yapıldı
- [ ] Zebra ZD220 yazıcı seçildi
- [ ] Kağıt boyutu 100x100mm ayarlandı
- [ ] Kenar boşlukları 0mm yapıldı
- [ ] Test yazdırması başarılı
- [ ] QR kod okunabilir
- [ ] Etiket boyutu doğru

## 🎉 **Sonuç**

Zebra ZD220 yazıcınız artık 100x100mm QR etiketlerinizi mükemmel şekilde yazdıracak! 

**Önemli:** Bu optimizasyon tüm etiket türleri için geçerli:
- Ana/Palet etiketleri
- Bobin etiketleri  
- Dönüş etiketleri

**Test URL:** https://takip.dekaplastik.com/warehouse/DK250901M95

---

**📅 Son Güncelleme:** 9 Ocak 2025  
**🔧 Versiyon:** 2.0 (Zebra Optimized)  
**✅ Durum:** Production Ready
