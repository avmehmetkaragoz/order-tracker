import { Html5QrcodeScanner, Html5Qrcode } from 'html5-qrcode'

// QR Code scanner optimized for mobile devices
export class QRScanner {
  private scanner: Html5QrcodeScanner | null = null
  private html5QrCode: Html5Qrcode | null = null
  private isScanning = false
  private onScanCallback: ((result: string) => void) | null = null
  private lastScanTime = 0
  private readonly SCAN_INTERVAL = 1000 // Debounce interval for scan results

  constructor() {
    console.log("[QRScanner] Initialized")
  }

  async startScanning(
    targetElement: HTMLElement,
    onScan: (result: string) => void,
    onError?: (error: string) => void,
    preferredCameraId?: string
  ): Promise<void> {
    console.log("[QRScanner] Starting QR scanner")
    console.log("[QRScanner] preferredCameraId:", preferredCameraId)

    if (this.isScanning) {
      console.log("[QRScanner] Already scanning, stopping first")
      await this.stopScanning()
    }

    this.onScanCallback = onScan

    try {
      // Check if we're in browser environment
      if (typeof window === 'undefined' || typeof navigator === 'undefined') {
        throw new Error("Tarayıcı ortamı gerekli")
      }

      // Check camera permissions
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Kamera API'si desteklenmiyor")
      }

      // First, request camera permission explicitly with back camera preference
      console.log("[QRScanner] Requesting camera permission...")
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: "environment" }
          }
        })
        // Stop the stream immediately, we just needed permission
        stream.getTracks().forEach(track => track.stop())
        console.log("[QRScanner] Camera permission granted")
      } catch (permError) {
        console.error("[QRScanner] Camera permission denied:", permError)
        throw new Error("Kamera izni reddedildi. Lütfen tarayıcı ayarlarından kamera iznini etkinleştirin.")
      }

      // Get available cameras after permission is granted
      const devices = await this.getAvailableCameras()
      console.log("[QRScanner] Available devices:", devices.length)

      // Select camera with back camera priority
      let selectedDeviceId = preferredCameraId
      if (!selectedDeviceId && devices.length > 0) {
        // Try to find back camera first
        const backCamera = devices.find(device =>
          device.label.toLowerCase().includes('back') ||
          device.label.toLowerCase().includes('rear') ||
          device.label.toLowerCase().includes('environment') ||
          device.label.toLowerCase().includes('arka') ||
          device.label.toLowerCase().includes('arkada')
        )
        
        if (backCamera) {
          selectedDeviceId = backCamera.deviceId
          console.log("[QRScanner] Auto-selected back camera:", backCamera.label)
        } else {
          // If no back camera found, use the last camera (usually back camera on mobile)
          selectedDeviceId = devices[devices.length - 1].deviceId
          console.log("[QRScanner] Auto-selected last camera (likely back):", devices[devices.length - 1].label)
        }
      }

      // Enhanced mobile-optimized configuration
      const isMobile = /android|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(navigator.userAgent.toLowerCase())
      
      const config = {
        fps: isMobile ? 10 : 20, // Lower FPS for mobile to save battery
        qrbox: isMobile ?
          { width: 250, height: 250 } :
          { width: 300, height: 300 },
        aspectRatio: 1.0,
        disableFlip: false,
        videoConstraints: {
          facingMode: selectedDeviceId ? undefined : "environment",
          deviceId: selectedDeviceId ? { exact: selectedDeviceId } : undefined,
          width: isMobile ? { ideal: 720, max: 1280 } : { ideal: 1280, max: 1920 },
          height: isMobile ? { ideal: 720, max: 1280 } : { ideal: 720, max: 1080 },
          frameRate: { ideal: isMobile ? 15 : 30, max: isMobile ? 30 : 60 }
        },
        supportedScanTypes: [
          // Html5QrcodeScanType.SCAN_TYPE_CAMERA // Only camera scanning
        ]
      }

      console.log("[QRScanner] QR scanner config:", config)

      // Clear target element
      targetElement.innerHTML = ''

      // Use Html5Qrcode instead of Html5QrcodeScanner for better control
      const elementId = targetElement.id || 'qr-reader'
      this.html5QrCode = new Html5Qrcode(elementId)

      // Set up scan success callback
      const onScanSuccess = (decodedText: string, decodedResult: any) => {
        console.log("[QRScanner] QR code detected:", decodedText)
        this.handleScanResult(decodedText)
      }

      // Set up scan error callback
      const onScanFailure = (error: string) => {
        // Don't log every scan failure as it's normal
        // console.log("[QRScanner] Scan failure:", error)
      }

      // Start camera with specific device ID or constraints
      const cameraConfig = selectedDeviceId ?
        selectedDeviceId :
        { facingMode: "environment" }

      await this.html5QrCode.start(
        cameraConfig,
        config,
        onScanSuccess,
        onScanFailure
      )

      this.isScanning = true
      console.log("[QRScanner] QR scanner started successfully")

    } catch (error) {
      console.error("[QRScanner] Start scanning error:", error)
      this.isScanning = false
      
      let errorMessage = "QR kod tarayıcısı başlatılamadı"
      if (error instanceof Error) {
        if (error.message.includes("Permission") || error.message.includes("NotAllowedError")) {
          errorMessage = "Kamera izni reddedildi. Lütfen tarayıcı ayarlarından kamera iznini etkinleştirin."
        } else if (error.message.includes("NotFound") || error.message.includes("NotFoundError")) {
          errorMessage = "Kamera bulunamadı. Lütfen cihazınızda kamera olduğundan emin olun."
        } else if (error.message.includes("NotReadable") || error.message.includes("NotReadableError")) {
          errorMessage = "Kamera başka bir uygulama tarafından kullanılıyor. Diğer uygulamaları kapatıp tekrar deneyin."
        } else if (error.message.includes("OverConstrained") || error.message.includes("OverconstrainedError")) {
          errorMessage = "Kamera ayarları desteklenmiyor. Farklı bir kamera deneyin."
        } else if (error.message.includes("SecurityError")) {
          errorMessage = "Güvenlik hatası. HTTPS bağlantısı gerekli olabilir."
        } else {
          errorMessage = error.message
        }
      }
      
      onError?.(errorMessage)
    }
  }

  private handleScanResult(result: string): void {
    const now = Date.now()
    
    // Prevent too frequent scanning of the same QR code
    if (now - this.lastScanTime < this.SCAN_INTERVAL) {
      return
    }

    this.lastScanTime = now

    console.log("[QRScanner] Raw QR code detected:", result)

    if (this.onScanCallback && result && result.trim().length > 0) {
      const cleanResult = result.trim()
      console.log("[QRScanner] Calling callback with QR result:", cleanResult)
      this.onScanCallback(cleanResult)
      
      // Stop scanning after successful detection
      this.stopScanning()
    }
  }

  async stopScanning(): Promise<void> {
    console.log("[QRScanner] Stopping QR scanner")
    
    if (this.html5QrCode) {
      try {
        await this.html5QrCode.stop()
        console.log("[QRScanner] Html5Qrcode stopped")
      } catch (error) {
        console.error("[QRScanner] Error stopping Html5Qrcode:", error)
      }
      this.html5QrCode = null
    }

    if (this.scanner) {
      try {
        await this.scanner.clear()
        console.log("[QRScanner] QR scanner cleared")
      } catch (error) {
        console.error("[QRScanner] Error clearing scanner:", error)
      }
      this.scanner = null
    }

    this.isScanning = false
    this.lastScanTime = 0
  }

  async getAvailableCameras(): Promise<MediaDeviceInfo[]> {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
        console.log("[QRScanner] MediaDevices API not available")
        return []
      }

      const devices = await navigator.mediaDevices.enumerateDevices()
      const videoDevices = devices.filter(device => device.kind === 'videoinput')
      
      console.log("[QRScanner] Found video devices:", videoDevices.length)
      videoDevices.forEach((device, index) => {
        console.log(`[QRScanner] Camera ${index}: ${device.label} (${device.deviceId})`)
      })

      return videoDevices
    } catch (error) {
      console.error("[QRScanner] Error getting cameras:", error)
      return []
    }
  }

  // Force scan current frame (simplified for QR codes)
  async forceScan(): Promise<string | null> {
    if (!this.isScanning) {
      console.log("[QRScanner] Not scanning, cannot force scan")
      return null
    }

    console.log("[QRScanner] Force scan triggered")
    
    try {
      // For QR codes, we'll wait for the next successful scan
      return new Promise<string | null>((resolve) => {
        let resolved = false
        
        const timeout = setTimeout(() => {
          if (!resolved) {
            resolved = true
            console.log("[QRScanner] Force scan timeout - no QR code detected")
            resolve(null)
          }
        }, 3000) // 3 second timeout

        // Store original callback
        const originalCallback = this.onScanCallback
        
        // Set up temporary callback for force scan
        this.onScanCallback = (result) => {
          if (!resolved) {
            resolved = true
            clearTimeout(timeout)
            this.onScanCallback = originalCallback
            console.log("[QRScanner] Force scan successful:", result)
            resolve(result)
          }
        }
      })

    } catch (error) {
      console.error("[QRScanner] Force scan error:", error)
      return null
    }
  }

  // Get scanner info for debugging
  getInfo(): string {
    const info = {
      isScanning: this.isScanning,
      hasCallback: !!this.onScanCallback,
      lastScanTime: this.lastScanTime,
      scanInterval: this.SCAN_INTERVAL,
      html5QrcodeSupported: typeof Html5QrcodeScanner !== 'undefined',
      scannerActive: !!this.scanner,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown'
    }
    return JSON.stringify(info, null, 2)
  }

  // Check if QR scanner is supported
  static isSupported(): boolean {
    try {
      return typeof Html5QrcodeScanner !== 'undefined' && 
             typeof navigator !== 'undefined' && 
             !!navigator.mediaDevices && 
             !!navigator.mediaDevices.getUserMedia
    } catch {
      return false
    }
  }

  // Parse QR code data if it's JSON
  static parseQRData(qrString: string): any {
    try {
      const data = JSON.parse(qrString)
      return data
    } catch (error) {
      // If it's not JSON, return as plain text
      return { text: qrString, type: 'plain' }
    }
  }
}