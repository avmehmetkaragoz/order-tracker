"use client";

// QZ Tray için sağlam bağlantı yöneticisi
declare global {
  interface Window {
    qz: any;
  }
}

let connecting: Promise<void> | null = null;
let securityInitialized = false;

// Güvenlik ayarlarını başlat (tek sefer)
function initQzSecurity() {
  if (securityInitialized) return;
  
  // DEV: Hızlı dönen promise'ler - asla beklemede kalmasın
  window.qz.security.setCertificatePromise(async () => ""); // Boş string döndür
  window.qz.security.setSignaturePromise(async () => null); // Null döndür
  
  securityInitialized = true;
  console.log('🔓 QZ Tray güvenlik ayarları (dev mode) başlatıldı');
}

// Timeout wrapper - promise'lerin sonsuza kadar beklemesini önler
function withTimeout<T>(promise: Promise<T>, ms = 8000, label = "operation"): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => 
      setTimeout(() => reject(new Error(`${label} timeout (${ms}ms)`)), ms)
    )
  ]);
}

// QZ Tray'i npm paketinden yükle
async function loadQzTray() {
  if (window.qz) return window.qz;

  try {
    const qzTray = await import('qz-tray');
    window.qz = qzTray.default || qzTray;
    
    // Promise type'ı ayarla
    window.qz.api.setPromiseType(function(resolver: any) {
      return new Promise(resolver);
    });
    
    console.log('✅ QZ Tray npm paketi yüklendi');
    return window.qz;
  } catch (error) {
    console.error('❌ QZ Tray npm paketi yüklenemedi:', error);
    throw new Error('QZ Tray kütüphanesi yüklenemedi');
  }
}

// QZ Tray'e güvenli bağlantı (singleton pattern)
export async function ensureQzConnected(): Promise<void> {
  // QZ Tray'i yükle
  await loadQzTray();
  
  // Güvenlik ayarlarını başlat
  initQzSecurity();
  
  // Zaten bağlıysa çık
  if (window.qz.websocket.isActive()) {
    console.log('✅ QZ Tray zaten bağlı');
    return;
  }

  // Eğer başka bir bağlantı denemesi varsa onu bekle
  if (connecting) {
    console.log('⏳ Mevcut bağlantı denemesi bekleniyor...');
    return connecting;
  }

  // Yeni bağlantı denemesi başlat
  connecting = (async () => {
    try {
      console.log('🔄 QZ Tray bağlantısı başlatılıyor...');
      
      // Protokol uyumluluğu
      const isSecure = window.location.protocol === 'https:';
      console.log(`📡 Protokol: ${isSecure ? 'WSS (Secure)' : 'WS (Insecure)'}`);
      
      // Timeout ile bağlan
      await withTimeout(
        window.qz.websocket.connect({
          hosts: ['127.0.0.1', 'localhost'],
          ports: [8181, 8282], // Birden fazla port dene
          usingSecure: isSecure, // Bazı sürümlerde bu parametre kullanılıyor
          secure: isSecure // Diğer sürümlerde bu
        }),
        8000, // 8 saniye timeout
        'QZ Tray bağlantısı'
      );
      
      console.log('✅ QZ Tray WebSocket bağlantısı başarılı');
      
      // Sürüm kontrolü ile bağlantıyı doğrula
      const version = await withTimeout(
        window.qz.api.getVersion(),
        4000,
        'QZ Tray sürüm kontrolü'
      );
      
      console.log(`✅ QZ Tray sürümü: ${version}`);
      
    } catch (error) {
      console.error('❌ QZ Tray bağlantı hatası:', error);
      
      // Hatalı bağlantıyı temizle
      try {
        if (window.qz.websocket.isActive()) {
          await window.qz.websocket.disconnect();
        }
      } catch (disconnectError) {
        console.warn('⚠️ Bağlantı kapatma uyarısı:', disconnectError);
      }
      
      throw error;
    }
  })()
  .finally(() => {
    // Bağlantı denemesi tamamlandı, singleton'ı temizle
    connecting = null;
  });

  return connecting;
}

// Güvenli bağlantı kapatma
export async function safeDisconnect(): Promise<void> {
  try {
    if (window.qz && window.qz.websocket.isActive()) {
      await window.qz.websocket.disconnect();
      console.log('🔌 QZ Tray bağlantısı kapatıldı');
    }
  } catch (error) {
    console.warn('⚠️ Bağlantı kapatma uyarısı:', error);
  }
}

// Yazıcı listesi al
export async function getQzPrinters(): Promise<string[]> {
  await ensureQzConnected();
  
  try {
    const printers = await withTimeout(
      window.qz.printers.find(),
      5000,
      'Yazıcı listesi'
    );
    
    const printerNames = Array.isArray(printers) ? printers : [printers].filter(Boolean);
    console.log(`📄 ${printerNames.length} yazıcı bulundu:`, printerNames);
    
    return printerNames;
  } catch (error) {
    console.error('❌ Yazıcı listesi alınamadı:', error);
    throw error;
  }
}

// QZ Tray ile yazdır - Düzeltilmiş yazıcı seçimi
export async function printWithQz(zplData: string, printerName?: string): Promise<void> {
  await ensureQzConnected();
  
  try {
    // Yazıcı bul ve seç
    let selectedPrinter;
    
    if (printerName && printerName.trim() !== '') {
      // Belirli bir yazıcı istenmiş
      console.log(`🔍 Belirli yazıcı aranıyor: "${printerName}"`);
      
      const foundPrinter = await withTimeout(
        window.qz.printers.find(printerName),
        3000,
        `Yazıcı arama: ${printerName}`
      );
      
      if (!foundPrinter) {
        throw new Error(`"${printerName}" adlı yazıcı bulunamadı`);
      }
      
      selectedPrinter = foundPrinter;
      console.log(`✅ Belirli yazıcı bulundu: ${selectedPrinter}`);
      
    } else {
      // Varsayılan yazıcı veya ilk yazıcı kullan
      console.log('🔍 Varsayılan yazıcı aranıyor...');
      
      try {
        // Önce varsayılan yazıcıyı dene
        selectedPrinter = await withTimeout(
          window.qz.printers.getDefault(),
          3000,
          'Varsayılan yazıcı arama'
        );
        
        if (selectedPrinter) {
          console.log(`✅ Varsayılan yazıcı bulundu: ${selectedPrinter}`);
        }
      } catch (defaultError) {
        console.warn('⚠️ Varsayılan yazıcı bulunamadı, tüm yazıcılar aranıyor...');
      }
      
      // Varsayılan yazıcı yoksa, tüm yazıcıları listele ve ilkini al
      if (!selectedPrinter) {
        try {
          console.log('🔍 Tüm yazıcılar aranıyor (timeout: 8s)...');
          const allPrinters = await withTimeout(
            window.qz.printers.find(),
            8000, // 3000ms'den 8000ms'ye çıkarıldı
            'Tüm yazıcılar arama'
          );
          
          if (!allPrinters || (Array.isArray(allPrinters) && allPrinters.length === 0)) {
            throw new Error('Hiçbir yazıcı bulunamadı. Sistemde yazıcı kurulu olduğundan emin olun.');
          }
          
          // İlk yazıcıyı seç
          selectedPrinter = Array.isArray(allPrinters) ? allPrinters[0] : allPrinters;
          console.log(`✅ İlk yazıcı seçildi: ${selectedPrinter}`);
          
        } catch (findError) {
          console.error('❌ Yazıcı arama hatası:', findError);
          
          // Son çare: QZ Tray'den direkt yazıcı listesi almayı dene
          try {
            console.log('🔄 Son çare: QZ Tray API ile yazıcı listesi alınıyor...');
            const apiPrinters = await withTimeout(
              window.qz.api.getPrinters ? window.qz.api.getPrinters() : window.qz.printers.find(),
              5000,
              'API yazıcı listesi'
            );
            
            if (apiPrinters && Array.isArray(apiPrinters) && apiPrinters.length > 0) {
              selectedPrinter = apiPrinters[0];
              console.log(`✅ API ile yazıcı bulundu: ${selectedPrinter}`);
            } else if (apiPrinters && !Array.isArray(apiPrinters)) {
              selectedPrinter = apiPrinters;
              console.log(`✅ API ile yazıcı bulundu: ${selectedPrinter}`);
            } else {
              throw new Error('API ile de yazıcı bulunamadı');
            }
            
          } catch (apiError) {
            console.error('❌ API yazıcı arama da başarısız:', apiError);
            const findErrorMessage = findError instanceof Error ? findError.message : String(findError);
            throw new Error(`Yazıcı bulunamadı. QZ Tray çalışıyor mu ve yazıcılar kurulu mu kontrol edin. Hata: ${findErrorMessage}`);
          }
        }
      }
    }
    
    // Yazıcı seçimi kontrolü
    if (!selectedPrinter || selectedPrinter === '') {
      throw new Error('Yazıcı seçilemedi. QZ Tray yazıcıları görebiliyor mu kontrol edin.');
    }
    
    console.log(`🖨️ Seçilen yazıcı: "${selectedPrinter}"`);
    
    // Yazdırma konfigürasyonu oluştur
    const config = window.qz.configs.create(selectedPrinter, {
      encoding: 'utf8',
      language: 'ZPL'
    });
    
    console.log('⚙️ Yazdırma konfigürasyonu oluşturuldu');
    
    // Yazdırma verisi hazırla
    const data = [{
      type: 'raw',
      format: 'plain',
      data: zplData
    }];
    
    console.log('📄 Yazdırma verisi hazırlandı');
    
    // Yazdır
    console.log('🖨️ Yazdırma komutu gönderiliyor...');
    await withTimeout(
      window.qz.print(config, data),
      10000,
      'Yazdırma işlemi'
    );
    
    console.log(`✅ Yazdırma başarılı: "${selectedPrinter}"`);
    
  } catch (error) {
    console.error('❌ Yazdırma hatası:', error);
    throw error;
  }
}
