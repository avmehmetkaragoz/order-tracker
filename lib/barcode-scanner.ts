import { 
  BrowserMultiFormatReader, 
  Result, 
  NotFoundException,
  DecodeHintType,
  BarcodeFormat
} from '@zxing/library'

// Barcode scanning utility using ZXing library
export class BarcodeScanner {
  private reader: BrowserMultiFormatReader
  private video: HTMLVideoElement | null = null
  private stream: MediaStream | null = null
  private isScanning = false
  private onScanCallback: ((barcode: string) => void) | null = null
  private lastScanTime = 0
  private readonly SCAN_INTERVAL = 300 // Debounce interval for scan results

  constructor() {
    // Configure ZXing with optimized hints for mobile barcode detection
    const hints = new Map()
    
    // Focus on most common barcode formats first for better performance
    hints.set(DecodeHintType.POSSIBLE_FORMATS, [
      BarcodeFormat.CODE_128,    // Most common for warehouse barcodes
      BarcodeFormat.CODE_39,     // Alternative warehouse format
      BarcodeFormat.EAN_13,      // Standard product barcodes
      BarcodeFormat.EAN_8,       // Short product barcodes
      BarcodeFormat.UPC_A,       // US product barcodes
      BarcodeFormat.CODE_93,     // Extended alphanumeric
      BarcodeFormat.CODABAR,     // Library/medical barcodes
      BarcodeFormat.ITF,         // Interleaved 2 of 5
      BarcodeFormat.UPC_E,       // Compressed UPC
      BarcodeFormat.RSS_14,      // GS1 DataBar
      BarcodeFormat.RSS_EXPANDED // GS1 DataBar Expanded
    ])
    
    // Optimize for mobile scanning
    hints.set(DecodeHintType.TRY_HARDER, true)           // More thorough scanning
    hints.set(DecodeHintType.PURE_BARCODE, false)        // Allow barcodes with text
    hints.set(DecodeHintType.ASSUME_GS1, false)          // Don't assume GS1 format
    hints.set(DecodeHintType.RETURN_CODABAR_START_END, true) // Include start/end chars
    
    this.reader = new BrowserMultiFormatReader(hints)
    console.log("[BarcodeScanner] Initialized with optimized mobile configuration")
  }

  async startScanning(
    videoElement: HTMLVideoElement,
    onScan: (barcode: string) => void,
    onError?: (error: string) => void,
    preferredDeviceId?: string
  ): Promise<void> {
    console.log("[BarcodeScanner] startScanning called with ZXing")
    console.log("[BarcodeScanner] preferredDeviceId:", preferredDeviceId)
    
    // Ensure we're in browser environment
    if (typeof window === 'undefined' || typeof navigator === 'undefined') {
      onError?.("Tarayıcı ortamı gerekli")
      return
    }

    this.video = videoElement
    this.onScanCallback = onScan

    try {
      // Get available video input devices
      const videoInputDevices = await this.reader.listVideoInputDevices()
      
      if (videoInputDevices.length === 0) {
        throw new Error("Kamera bulunamadı")
      }

      console.log(`Found ${videoInputDevices.length} camera(s)`)
      videoInputDevices.forEach((device, index) => {
        console.log(`Camera ${index}: ${device.label} (${device.deviceId})`)
      })

      // Use preferred device ID if provided, otherwise find back camera
      let selectedDeviceId = preferredDeviceId
      
      if (!selectedDeviceId) {
        // Try to find back camera first, then use first available
        selectedDeviceId = videoInputDevices[0].deviceId
        
        for (const device of videoInputDevices) {
          if (device.label.toLowerCase().includes('back') || 
              device.label.toLowerCase().includes('rear') ||
              device.label.toLowerCase().includes('environment')) {
            selectedDeviceId = device.deviceId
            console.log("Auto-selected back camera:", device.label)
            break
          }
        }
      } else {
        console.log("Using preferred camera:", selectedDeviceId)
      }

      this.isScanning = true

      // Store the stream reference for getCurrentCameraId
      this.stream = videoElement.srcObject as MediaStream

      // Use ZXing's native decodeFromVideoDevice method for better stability
      await this.reader.decodeFromVideoDevice(
        selectedDeviceId,
        videoElement,
        (result: Result | null, error?: Error) => {
          if (result) {
            console.log("[ZXing] Barcode detected:", result.getText())
            this.handleScanResult(result.getText())
          }
          if (error && !(error instanceof NotFoundException)) {
            console.log("ZXing scan error:", error.message)
          }
        }
      )

      // Update stream reference after successful start
      this.stream = videoElement.srcObject as MediaStream
      console.log("ZXing scanner started successfully with device:", selectedDeviceId)

    } catch (error) {
      console.error("Camera access error:", error)
      let errorMessage = "Kamera erişimi reddedildi"

      if (error instanceof Error) {
        if (error.message.includes("not found") || error.message.includes("index")) {
          errorMessage = "Kamera bulunamadı. Lütfen cihazınızda kamera olduğundan emin olun."
        } else if (error.message.includes("permission") || error.message.includes("denied")) {
          errorMessage = "Kamera izni reddedildi. Lütfen tarayıcı ayarlarından kamera iznini etkinleştirin."
        } else if (error.message.includes("secure")) {
          errorMessage = "Kamera erişimi için HTTPS bağlantısı gerekli."
        } else if (error.message.includes("OverconstrainedError") || error.message.includes("exact")) {
          errorMessage = "Belirtilen kamera bulunamadı. Varsayılan kamera kullanılacak."
          // Retry with fallback
          if (preferredDeviceId) {
            console.log("Retrying without device constraint...")
            return this.startScanning(videoElement, onScan, onError)
          }
        } else {
          errorMessage = error.message
        }
      }

      this.isScanning = false
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

    // Log all detected barcodes for debugging
    console.log("Raw barcode detected:", barcode)

    // Always try the callback with any detected barcode
    if (this.onScanCallback && barcode && barcode.trim().length > 0) {
      const cleanBarcode = barcode.trim().toUpperCase()
      console.log("Calling callback with barcode:", cleanBarcode)
      this.onScanCallback(cleanBarcode)
      // Stop scanning after successful detection to prevent multiple scans
      this.stopScanning()
    }
  }

  stopScanning(): void {
    console.log("[BarcodeScanner] stopScanning called")
    
    this.isScanning = false

    // Reset the reader to stop all scanning
    try {
      this.reader.reset()
    } catch (error) {
      console.log("Error resetting reader:", error)
    }

    // Stop media stream
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop())
      this.stream = null
    }

    if (this.video) {
      this.video.srcObject = null
    }

    this.lastScanTime = 0
  }

  // Get available cameras for user selection
  async getAvailableCameras(): Promise<MediaDeviceInfo[]> {
    try {
      return await this.reader.listVideoInputDevices()
    } catch (error) {
      console.error("Error getting cameras:", error)
      return []
    }
  }

  // Switch to a specific camera
  async switchCamera(deviceId: string): Promise<void> {
    if (!this.video || !this.onScanCallback) {
      throw new Error("Scanner not initialized")
    }

    // Stop current scanning
    this.reader.reset()

    // Start with new camera
    await this.reader.decodeFromVideoDevice(
      deviceId,
      this.video,
      (result: Result | null, error?: Error) => {
        if (result) {
          this.handleScanResult(result.getText())
        }
        if (error && !(error instanceof NotFoundException)) {
          console.log("Scan error:", error.message)
        }
      }
    )
  }

  // Manual barcode input validation
  static validateBarcodeFormat(barcode: string): boolean {
    if (!barcode || typeof barcode !== 'string') {
      return false
    }

    // Remove whitespace and convert to uppercase
    const cleanBarcode = barcode.trim().toUpperCase()

    // Validate warehouse barcode format - flexible pattern to match existing barcodes
    // WH followed by alphanumeric characters (like WH7894349E1O37)
    const warehousePattern = /^WH[A-Z0-9]+$/
    
    // Also accept standard barcode formats (EAN, UPC, Code128, etc.)
    const standardPatterns = [
      /^\d{8}$/, // EAN-8
      /^\d{12}$/, // UPC-A
      /^\d{13}$/, // EAN-13
      /^[A-Z0-9]+$/, // Code128 alphanumeric
    ]

    // Check warehouse pattern first
    if (warehousePattern.test(cleanBarcode) && cleanBarcode.length >= 8) {
      return true
    }

    // Check standard patterns
    for (const pattern of standardPatterns) {
      if (pattern.test(cleanBarcode)) {
        return true
      }
    }

    return false
  }

  static formatBarcode(input: string): string {
    if (!input || typeof input !== 'string') {
      return ''
    }
    
    return input.toUpperCase().trim()
  }

  // Check if ZXing library is available
  static isSupported(): boolean {
    try {
      return typeof BrowserMultiFormatReader !== 'undefined'
    } catch {
      return false
    }
  }

  // Get scanner info for debugging - returns string to avoid alert issues
  getInfo(): string {
    const info = {
      isScanning: this.isScanning,
      hasVideo: !!this.video,
      hasCallback: !!this.onScanCallback,
      lastScanTime: this.lastScanTime,
      scanInterval: this.SCAN_INTERVAL,
      zxingSupported: BarcodeScanner.isSupported(),
      videoWidth: this.video?.videoWidth || 0,
      videoHeight: this.video?.videoHeight || 0,
      streamActive: this.stream?.active || false
    }
    return JSON.stringify(info, null, 2)
  }

  // Force scan a specific area of the video with enhanced debugging
  async forceScan(): Promise<string | null> {
    if (!this.video || !this.isScanning) {
      console.log("[ForceScan] Cannot scan - video:", !!this.video, "isScanning:", this.isScanning)
      return null
    }

    console.log("[ForceScan] Attempting manual scan...")
    console.log("[ForceScan] Video dimensions:", this.video.videoWidth, "x", this.video.videoHeight)
    console.log("[ForceScan] Video ready state:", this.video.readyState)

    try {
      // Try direct video scan first
      const result = await this.reader.decodeFromVideoElement(this.video)
      if (result) {
        console.log("[ForceScan] SUCCESS! Detected barcode:", result.getText())
        console.log("[ForceScan] Barcode format:", result.getBarcodeFormat())
        return result.getText()
      } else {
        console.log("[ForceScan] No barcode detected in current frame")
      }
    } catch (error) {
      if (error instanceof NotFoundException) {
        console.log("[ForceScan] No barcode found in current frame")
      } else {
        console.log("[ForceScan] Error during scan:", error)
      }
    }

    return null
  }

  // Enhanced debug method with detailed scanning information
  async getDetailedScanInfo(): Promise<string> {
    const basicInfo = JSON.parse(this.getInfo())
    
    const detailedInfo = {
      ...basicInfo,
      timestamp: new Date().toISOString(),
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'N/A',
      videoElement: {
        exists: !!this.video,
        readyState: this.video?.readyState || 'N/A',
        videoWidth: this.video?.videoWidth || 0,
        videoHeight: this.video?.videoHeight || 0,
        srcObject: !!this.video?.srcObject
      },
      stream: {
        exists: !!this.stream,
        active: this.stream?.active || false,
        tracks: this.stream?.getTracks().length || 0,
        videoTracks: this.stream?.getVideoTracks().length || 0
      },
      reader: {
        exists: !!this.reader,
        type: this.reader?.constructor.name || 'N/A'
      }
    }

    return JSON.stringify(detailedInfo, null, 2)
  }

  // Capture current video frame as data URL for debugging
  captureFrame(): string | null {
    if (!this.video || this.video.readyState < 2) {
      console.log("[CaptureFrame] Video not ready")
      return null
    }

    try {
      const canvas = document.createElement('canvas')
      const context = canvas.getContext('2d')
      
      if (!context) {
        console.log("[CaptureFrame] Cannot get canvas context")
        return null
      }

      canvas.width = this.video.videoWidth
      canvas.height = this.video.videoHeight
      
      context.drawImage(this.video, 0, 0, canvas.width, canvas.height)
      
      const dataUrl = canvas.toDataURL('image/png')
      console.log("[CaptureFrame] Frame captured, size:", canvas.width, "x", canvas.height)
      
      return dataUrl
    } catch (error) {
      console.log("[CaptureFrame] Error capturing frame:", error)
      return null
    }
  }

  // Get current camera device ID
  getCurrentCameraId(): string | null {
    if (!this.stream) return null
    
    const videoTrack = this.stream.getVideoTracks()[0]
    return videoTrack?.getSettings()?.deviceId || null
  }
}
