import Quagga from 'quagga'

// QuaggaJS-based barcode scanner optimized for mobile devices
export class QuaggaBarcodeScanner {
  private isScanning = false
  private onScanCallback: ((barcode: string) => void) | null = null
  private lastScanTime = 0
  private readonly SCAN_INTERVAL = 500 // Debounce interval for scan results
  public currentStream: MediaStream | null = null // Made public for torch access

  constructor() {
    console.log("[QuaggaScanner] Initialized")
  }

  async startScanning(
    targetElement: HTMLElement,
    onScan: (barcode: string) => void,
    onError?: (error: string) => void,
    preferredDeviceId?: string
  ): Promise<void> {
    console.log("[QuaggaScanner] Starting scanner")
    console.log("[QuaggaScanner] preferredDeviceId:", preferredDeviceId)

    if (this.isScanning) {
      console.log("[QuaggaScanner] Already scanning, stopping first")
      await this.stopScanning()
    }

    this.onScanCallback = onScan

    try {
      // Get available cameras
      const devices = await this.getAvailableCameras()
      console.log("[QuaggaScanner] Available devices:", devices.length)

      // Select camera
      let selectedDeviceId = preferredDeviceId
      if (!selectedDeviceId && devices.length > 0) {
        // Try to find back camera
        const backCamera = devices.find(device => 
          device.label.toLowerCase().includes('back') || 
          device.label.toLowerCase().includes('rear') ||
          device.label.toLowerCase().includes('environment')
        )
        selectedDeviceId = backCamera ? backCamera.deviceId : devices[0].deviceId
        console.log("[QuaggaScanner] Auto-selected camera:", selectedDeviceId)
      }

      // Enhanced mobile-optimized configuration
      const isMobile = /android|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(navigator.userAgent.toLowerCase())
      
      const config = {
        inputStream: {
          name: "Live",
          type: "LiveStream",
          target: targetElement,
          constraints: {
            width: isMobile ? { min: 480, ideal: 720, max: 1280 } : { min: 640, ideal: 1280, max: 1920 },
            height: isMobile ? { min: 320, ideal: 480, max: 720 } : { min: 480, ideal: 720, max: 1080 },
            facingMode: preferredDeviceId ? undefined : "environment", // Use back camera by default
            deviceId: selectedDeviceId ? { exact: selectedDeviceId } : undefined,
            aspectRatio: { min: 1, max: 2 },
            frameRate: isMobile ? { ideal: 15, max: 30 } : { ideal: 30, max: 60 } // Lower frame rate for mobile
          }
        },
        locator: {
          patchSize: isMobile ? "small" : "medium", // Smaller patch size for mobile
          halfSample: true, // Improve performance on mobile
          showCanvas: false,
          showPatches: false,
          showFoundPatches: false,
          showSkeleton: false,
          showLabels: false,
          showBoundingBox: false,
          showFrequency: false
        },
        numOfWorkers: isMobile ? Math.min(navigator.hardwareConcurrency || 1, 2) : (navigator.hardwareConcurrency || 2),
        decoder: {
          readers: [
            "code_128_reader", // Most common for warehouse
            "code_39_reader",  // Alternative warehouse format
            "ean_reader",      // EAN-13, EAN-8
            "ean_8_reader",    // EAN-8 specifically
            "code_39_vin_reader", // Extended Code 39
            "codabar_reader",  // Codabar format
            "i2of5_reader"     // Interleaved 2 of 5
          ],
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
          multiple: false // Only detect one barcode at a time
        },
        locate: true, // Enable barcode localization
        frequency: isMobile ? 5 : 10, // Lower frequency for mobile to save battery
        debug: false // Disable debug mode for production
      }

      console.log("[QuaggaScanner] Quagga config:", config)

      // Initialize Quagga
      await new Promise<void>((resolve, reject) => {
        Quagga.init(config, (err) => {
          if (err) {
            console.error("[QuaggaScanner] Quagga init error:", err)
            reject(new Error(`Kamera başlatılamadı: ${err.message || err}`))
            return
          }
          console.log("[QuaggaScanner] Quagga initialized successfully")
          resolve()
        })
      })

      // Set up barcode detection
      Quagga.onDetected((result) => {
        console.log("[QuaggaScanner] Barcode detected:", result)
        if (result && result.codeResult && result.codeResult.code) {
          this.handleScanResult(result.codeResult.code)
        }
      })

      // Set up error handling
      Quagga.onProcessed((result) => {
        // Optional: Handle processing results for debugging
        if (result && result.boxes) {
          console.log("[QuaggaScanner] Processed frame with", result.boxes.length, "potential areas")
        }
      })

      // Start scanning
      Quagga.start()
      this.isScanning = true

      // Store current stream for camera switching
      const video = targetElement.querySelector('video')
      if (video && video.srcObject) {
        this.currentStream = video.srcObject as MediaStream
      }

      console.log("[QuaggaScanner] Scanner started successfully")

    } catch (error) {
      console.error("[QuaggaScanner] Start scanning error:", error)
      this.isScanning = false
      
      let errorMessage = "Kamera erişimi reddedildi"
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

  private handleScanResult(barcode: string): void {
    const now = Date.now()
    
    // Prevent too frequent scanning of the same barcode
    if (now - this.lastScanTime < this.SCAN_INTERVAL) {
      return
    }

    this.lastScanTime = now

    console.log("[QuaggaScanner] Raw barcode detected:", barcode)

    if (this.onScanCallback && barcode && barcode.trim().length > 0) {
      // Enhanced barcode cleaning and validation
      let cleanBarcode = this.cleanAndValidateBarcode(barcode)
      console.log("[QuaggaScanner] Cleaned barcode:", cleanBarcode)
      
      if (cleanBarcode) {
        console.log("[QuaggaScanner] Calling callback with barcode:", cleanBarcode)
        this.onScanCallback(cleanBarcode)
        
        // Stop scanning after successful detection
        this.stopScanning()
      } else {
        console.log("[QuaggaScanner] Barcode validation failed, continuing scan")
      }
    }
  }

  // Enhanced barcode cleaning and validation
  private cleanAndValidateBarcode(rawBarcode: string): string | null {
    if (!rawBarcode || typeof rawBarcode !== 'string') {
      return null
    }

    // Remove whitespace and convert to uppercase
    let cleaned = rawBarcode.trim().toUpperCase()
    
    // Remove common OCR errors and normalize characters
    cleaned = cleaned
      .replace(/[O]/g, '0')     // O -> 0
      .replace(/[I]/g, '1')     // I -> 1
      .replace(/[S]/g, '5')     // S -> 5
      .replace(/[Z]/g, '2')     // Z -> 2
      .replace(/[B]/g, '8')     // B -> 8
      .replace(/[G]/g, '6')     // G -> 6
      .replace(/[Q]/g, '0')     // Q -> 0
      .replace(/[D]/g, '0')     // D -> 0 (sometimes confused)
    
    // Remove any non-alphanumeric characters
    cleaned = cleaned.replace(/[^A-Z0-9]/g, '')
    
    // Validate minimum length (warehouse barcodes are typically 10+ characters)
    if (cleaned.length < 8) {
      console.log("[QuaggaScanner] Barcode too short:", cleaned)
      return null
    }
    
    // Validate maximum length (prevent extremely long false positives)
    if (cleaned.length > 20) {
      console.log("[QuaggaScanner] Barcode too long:", cleaned)
      return null
    }
    
    // Check if it looks like a warehouse barcode pattern
    const warehousePattern = /^[A-Z]{2}[A-Z0-9]{8,}$/
    const numericPattern = /^[0-9]{8,}$/
    const alphanumericPattern = /^[A-Z0-9]{8,}$/
    
    if (warehousePattern.test(cleaned) || numericPattern.test(cleaned) || alphanumericPattern.test(cleaned)) {
      return cleaned
    }
    
    console.log("[QuaggaScanner] Barcode pattern validation failed:", cleaned)
    return null
  }

  async stopScanning(): Promise<void> {
    console.log("[QuaggaScanner] Stopping scanner")
    
    if (this.isScanning) {
      try {
        Quagga.stop()
        console.log("[QuaggaScanner] Quagga stopped")
      } catch (error) {
        console.error("[QuaggaScanner] Error stopping Quagga:", error)
      }
    }

    // Clean up stream
    if (this.currentStream) {
      this.currentStream.getTracks().forEach(track => track.stop())
      this.currentStream = null
    }

    this.isScanning = false
    this.lastScanTime = 0
  }

  async getAvailableCameras(): Promise<MediaDeviceInfo[]> {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
        console.log("[QuaggaScanner] MediaDevices API not available")
        return []
      }

      const devices = await navigator.mediaDevices.enumerateDevices()
      const videoDevices = devices.filter(device => device.kind === 'videoinput')
      
      console.log("[QuaggaScanner] Found video devices:", videoDevices.length)
      videoDevices.forEach((device, index) => {
        console.log(`[QuaggaScanner] Camera ${index}: ${device.label} (${device.deviceId})`)
      })

      return videoDevices
    } catch (error) {
      console.error("[QuaggaScanner] Error getting cameras:", error)
      return []
    }
  }

  getCurrentCameraId(): string | null {
    if (!this.currentStream) return null
    
    const videoTrack = this.currentStream.getVideoTracks()[0]
    return videoTrack?.getSettings()?.deviceId || null
  }

  // Force scan current frame - simplified implementation
  async forceScan(): Promise<string | null> {
    if (!this.isScanning) {
      console.log("[QuaggaScanner] Not scanning, cannot force scan")
      return null
    }

    console.log("[QuaggaScanner] Force scan triggered")
    
    try {
      // Wait for a few processing cycles to increase chance of detection
      return new Promise<string | null>((resolve) => {
        let resolved = false
        let attempts = 0
        const maxAttempts = 10
        
        const timeout = setTimeout(() => {
          if (!resolved) {
            resolved = true
            console.log("[QuaggaScanner] Force scan timeout - no barcode detected")
            resolve(null)
          }
        }, 3000) // 3 second timeout

        // Store original callback
        const originalCallback = this.onScanCallback
        
        // Set up temporary callback for force scan
        this.onScanCallback = (barcode) => {
          if (!resolved) {
            resolved = true
            clearTimeout(timeout)
            this.onScanCallback = originalCallback
            console.log("[QuaggaScanner] Force scan successful:", barcode)
            resolve(barcode)
          }
        }

        // Trigger multiple processing attempts
        const attemptScan = () => {
          if (resolved || attempts >= maxAttempts) {
            if (!resolved) {
              resolved = true
              clearTimeout(timeout)
              this.onScanCallback = originalCallback
              console.log("[QuaggaScanner] Force scan failed after", attempts, "attempts")
              resolve(null)
            }
            return
          }

          attempts++
          console.log("[QuaggaScanner] Force scan attempt", attempts)
          
          // Try to trigger Quagga processing
          try {
            // Force a processing cycle by temporarily changing frequency
            const currentFrequency = (Quagga as any).CameraAccess?.getActiveStreamLabel?.() || 'unknown'
            console.log("[QuaggaScanner] Current stream:", currentFrequency)
            
            // Wait a bit and try again
            setTimeout(attemptScan, 200)
          } catch (error) {
            console.log("[QuaggaScanner] Force scan attempt error:", error)
            setTimeout(attemptScan, 200)
          }
        }

        // Start attempting
        attemptScan()
      })

    } catch (error) {
      console.error("[QuaggaScanner] Force scan error:", error)
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
      quaggaSupported: typeof Quagga !== 'undefined',
      streamActive: this.currentStream?.active || false,
      currentCameraId: this.getCurrentCameraId()
    }
    return JSON.stringify(info, null, 2)
  }

  // Check if QuaggaJS is supported
  static isSupported(): boolean {
    try {
      return typeof Quagga !== 'undefined' && 
             typeof navigator !== 'undefined' && 
             !!navigator.mediaDevices && 
             !!navigator.mediaDevices.getUserMedia
    } catch {
      return false
    }
  }

  // Capture current frame for debugging
  captureFrame(): string | null {
    try {
      const canvas = document.querySelector('#interactive canvas') as HTMLCanvasElement
      if (canvas) {
        return canvas.toDataURL('image/png')
      }
      
      // Fallback: try to get video element
      const video = document.querySelector('#interactive video') as HTMLVideoElement
      if (video && video.videoWidth > 0) {
        const canvas = document.createElement('canvas')
        const context = canvas.getContext('2d')
        
        if (context) {
          canvas.width = video.videoWidth
          canvas.height = video.videoHeight
          context.drawImage(video, 0, 0)
          return canvas.toDataURL('image/png')
        }
      }
      
      return null
    } catch (error) {
      console.error("[QuaggaScanner] Capture frame error:", error)
      return null
    }
  }
}
