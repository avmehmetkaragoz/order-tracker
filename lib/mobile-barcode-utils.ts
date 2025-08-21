// Mobile-specific barcode scanning utilities and optimizations

export interface MobileDeviceInfo {
  isMobile: boolean
  isIOS: boolean
  isAndroid: boolean
  isEdge: boolean
  isChrome: boolean
  isSafari: boolean
  isHTTPS: boolean
  hasMediaDevices: boolean
  hasVibration: boolean
  screenSize: 'small' | 'medium' | 'large'
  orientation: 'portrait' | 'landscape'
}

export interface CameraConstraints {
  width: { min: number; ideal: number; max: number }
  height: { min: number; ideal: number; max: number }
  frameRate: { ideal: number; max: number }
  facingMode: string
  aspectRatio: { min: number; max: number }
}

export class MobileBarcodeUtils {
  static detectDevice(): MobileDeviceInfo {
    if (typeof window === 'undefined' || typeof navigator === 'undefined') {
      return {
        isMobile: false,
        isIOS: false,
        isAndroid: false,
        isEdge: false,
        isChrome: false,
        isSafari: false,
        isHTTPS: false,
        hasMediaDevices: false,
        hasVibration: false,
        screenSize: 'medium',
        orientation: 'portrait'
      }
    }

    const userAgent = navigator.userAgent.toLowerCase()
    const isMobile = /android|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent)
    const isIOS = /iphone|ipad|ipod/i.test(userAgent)
    const isAndroid = /android/i.test(userAgent)
    const isEdge = userAgent.includes('edge') || userAgent.includes('edg/')
    const isChrome = userAgent.includes('chrome') && !isEdge
    const isSafari = userAgent.includes('safari') && !isChrome && !isEdge
    
    return {
      isMobile,
      isIOS,
      isAndroid,
      isEdge,
      isChrome,
      isSafari,
      isHTTPS: window.location.protocol === 'https:' || window.location.hostname === 'localhost',
      hasMediaDevices: !!navigator.mediaDevices,
      hasVibration: 'vibrate' in navigator,
      screenSize: this.getScreenSize(),
      orientation: this.getOrientation()
    }
  }

  static getScreenSize(): 'small' | 'medium' | 'large' {
    if (typeof window === 'undefined') return 'medium'
    
    const width = window.innerWidth
    if (width < 480) return 'small'
    if (width < 768) return 'medium'
    return 'large'
  }

  static getOrientation(): 'portrait' | 'landscape' {
    if (typeof window === 'undefined') return 'portrait'
    return window.innerHeight > window.innerWidth ? 'portrait' : 'landscape'
  }

  static getOptimalCameraConstraints(deviceInfo: MobileDeviceInfo): CameraConstraints {
    const baseConstraints: CameraConstraints = {
      width: { min: 640, ideal: 1280, max: 1920 },
      height: { min: 480, ideal: 720, max: 1080 },
      frameRate: { ideal: 30, max: 60 },
      facingMode: 'environment',
      aspectRatio: { min: 1, max: 2 }
    }

    // Mobile optimizations
    if (deviceInfo.isMobile) {
      baseConstraints.frameRate = { ideal: 15, max: 30 } // Lower frame rate for battery
      
      if (deviceInfo.screenSize === 'small') {
        baseConstraints.width = { min: 320, ideal: 640, max: 1280 }
        baseConstraints.height = { min: 240, ideal: 480, max: 720 }
      } else {
        baseConstraints.width = { min: 480, ideal: 720, max: 1280 }
        baseConstraints.height = { min: 320, ideal: 480, max: 720 }
      }
    }

    // iOS specific optimizations
    if (deviceInfo.isIOS) {
      baseConstraints.frameRate = { ideal: 15, max: 25 } // iOS Safari limitations
    }

    // Android specific optimizations
    if (deviceInfo.isAndroid) {
      baseConstraints.frameRate = { ideal: 20, max: 30 }
    }

    return baseConstraints
  }

  static getQuaggaConfig(deviceInfo: MobileDeviceInfo, targetElement: HTMLElement, deviceId?: string) {
    const constraints = this.getOptimalCameraConstraints(deviceInfo)
    
    return {
      inputStream: {
        name: "Live",
        type: "LiveStream",
        target: targetElement,
        constraints: {
          ...constraints,
          deviceId: deviceId ? { exact: deviceId } : undefined
        }
      },
      locator: {
        patchSize: deviceInfo.isMobile ? "small" : "medium",
        halfSample: true,
        showCanvas: false,
        showPatches: false,
        showFoundPatches: false,
        showSkeleton: false,
        showLabels: false,
        showBoundingBox: false,
        showFrequency: false
      },
      numOfWorkers: this.getOptimalWorkerCount(deviceInfo),
      decoder: {
        readers: this.getOptimalReaders(deviceInfo),
        debug: {
          showCanvas: false,
          showPatches: false,
          showFoundPatches: false,
          showSkeleton: false,
          showLabels: false,
          showPatchLabels: false,
          showBoundingBox: false,
          boxFromPatches: {
            showTransformed: false,
            showTransformedBox: false,
            showBB: false
          }
        },
        multiple: false
      },
      locate: true,
      frequency: deviceInfo.isMobile ? 5 : 10, // Lower frequency for mobile
      debug: false
    }
  }

  static getOptimalWorkerCount(deviceInfo: MobileDeviceInfo): number {
    const hardwareConcurrency = navigator.hardwareConcurrency || 2
    
    if (deviceInfo.isMobile) {
      // Limit workers on mobile to preserve battery and performance
      return Math.min(hardwareConcurrency, 2)
    }
    
    return hardwareConcurrency
  }

  static getOptimalReaders(deviceInfo: MobileDeviceInfo): string[] {
    const baseReaders = [
      "code_128_reader", // Most common for warehouse
      "code_39_reader",  // Alternative warehouse format
      "ean_reader",      // EAN-13, EAN-8
      "ean_8_reader"     // EAN-8 specifically
    ]

    // Add more readers for desktop (better performance)
    if (!deviceInfo.isMobile) {
      baseReaders.push(
        "code_39_vin_reader", // Extended Code 39
        "codabar_reader",     // Codabar format
        "i2of5_reader"        // Interleaved 2 of 5
      )
    }

    return baseReaders
  }

  static enhanceErrorMessage(error: string, deviceInfo: MobileDeviceInfo): string {
    if (error.includes("Permission") || error.includes("NotAllowed")) {
      if (deviceInfo.isMobile) {
        if (deviceInfo.isIOS) {
          return "Kamera izni reddedildi. Safari ayarlarından kamera iznini etkinleştirin ve sayfayı yenileyin."
        } else if (deviceInfo.isAndroid) {
          return "Kamera izni reddedildi. Chrome ayarlarından kamera iznini etkinleştirin ve sayfayı yenileyin."
        }
        return "Kamera izni reddedildi. Mobil tarayıcı ayarlarından kamera iznini etkinleştirin."
      }
      return "Kamera izni reddedildi. Tarayıcı ayarlarından kamera iznini etkinleştirin."
    }
    
    if (error.includes("NotFound") || error.includes("kamera bulunamadı")) {
      return "Kamera bulunamadı. Cihazınızda kamera olduğundan ve başka uygulamalar tarafından kullanılmadığından emin olun."
    }
    
    if (error.includes("NotReadable") || error.includes("Could not start")) {
      if (deviceInfo.isMobile) {
        return "Kamera başka bir uygulama tarafından kullanılıyor. Diğer kamera uygulamalarını kapatıp cihazı yeniden başlatın."
      }
      return "Kamera başka bir uygulama tarafından kullanılıyor. Diğer kamera uygulamalarını kapatıp tekrar deneyin."
    }
    
    if (error.includes("OverConstrained")) {
      return "Seçilen kamera ayarları desteklenmiyor. Farklı bir kamera deneyin veya manuel girişi kullanın."
    }
    
    if (error.includes("SecurityError")) {
      return "Güvenlik hatası. HTTPS bağlantısı gerekli. Uygulamayı güvenli bağlantı üzerinden açın."
    }
    
    if (deviceInfo.isEdge && deviceInfo.isMobile) {
      return `${error} - Edge mobil tarayıcısında sorun yaşıyorsanız Chrome tarayıcısını deneyin.`
    }
    
    if (deviceInfo.isIOS && deviceInfo.isSafari) {
      return `${error} - iOS Safari'de sorun yaşıyorsanız sayfayı yenileyin veya manuel girişi kullanın.`
    }
    
    return error
  }

  static vibrate(pattern: number | number[], deviceInfo: MobileDeviceInfo): void {
    if (deviceInfo.hasVibration && deviceInfo.isMobile) {
      try {
        navigator.vibrate(pattern)
      } catch (error) {
        console.log("Vibration not supported:", error)
      }
    }
  }

  static getRecommendedBrowser(deviceInfo: MobileDeviceInfo): string {
    if (deviceInfo.isIOS) {
      return "Safari"
    } else if (deviceInfo.isAndroid) {
      return "Chrome"
    } else {
      return "Chrome veya Firefox"
    }
  }

  static shouldShowManualInputByDefault(deviceInfo: MobileDeviceInfo): boolean {
    // Show manual input by default for problematic browser/device combinations
    return (deviceInfo.isEdge && deviceInfo.isMobile) || 
           (!deviceInfo.isHTTPS && deviceInfo.isMobile)
  }

  static formatBarcodeForDisplay(barcode: string): string {
    if (!barcode) return ""
    
    // Add spaces for better readability on mobile
    if (barcode.length > 8) {
      return barcode.replace(/(.{4})/g, '$1 ').trim()
    }
    
    return barcode
  }

  static validateBarcode(barcode: string): { isValid: boolean; message?: string } {
    if (!barcode || typeof barcode !== 'string') {
      return { isValid: false, message: "Barkod boş olamaz" }
    }

    const cleanBarcode = barcode.trim().toUpperCase()
    
    if (cleanBarcode.length < 3) {
      return { isValid: false, message: "Barkod çok kısa" }
    }

    // Warehouse barcode pattern
    const warehousePattern = /^WH[A-Z0-9]+$/
    if (warehousePattern.test(cleanBarcode) && cleanBarcode.length >= 8) {
      return { isValid: true }
    }

    // Standard barcode patterns
    const standardPatterns = [
      /^\d{8}$/,     // EAN-8
      /^\d{12}$/,    // UPC-A
      /^\d{13}$/,    // EAN-13
      /^[A-Z0-9]+$/, // Code128 alphanumeric
    ]

    for (const pattern of standardPatterns) {
      if (pattern.test(cleanBarcode)) {
        return { isValid: true }
      }
    }

    return { isValid: false, message: "Geçersiz barkod formatı" }
  }

  static getOptimalScanningTips(deviceInfo: MobileDeviceInfo): string[] {
    const baseTips = [
      "Barkodu net ve düz tutun",
      "Yeterli ışık olduğundan emin olun",
      "Barkodun tamamı görünür olmalı"
    ]

    if (deviceInfo.isMobile) {
      baseTips.push(
        "Cihazı sabit tutun",
        "Barkodu çerçeve içinde hizalayın",
        "Sorun yaşarsanız manuel girişi kullanın"
      )
      
      if (deviceInfo.isIOS) {
        baseTips.push("Safari'de en iyi sonuç alırsınız")
      } else if (deviceInfo.isAndroid) {
        baseTips.push("Chrome'da en iyi sonuç alırsınız")
      }
    } else {
      baseTips.push(
        "10-20 cm mesafe optimal",
        "Yansıma ve gölgelerden kaçının"
      )
    }

    return baseTips
  }
}