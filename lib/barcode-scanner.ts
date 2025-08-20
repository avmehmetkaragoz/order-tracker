import { BrowserMultiFormatReader, Result, NotFoundException } from '@zxing/library'

// Barcode scanning utility using ZXing library
export class BarcodeScanner {
  private reader: BrowserMultiFormatReader
  private video: HTMLVideoElement | null = null
  private stream: MediaStream | null = null
  private isScanning = false
  private onScanCallback: ((barcode: string) => void) | null = null
  private scanningInterval: NodeJS.Timeout | null = null
  private lastScanTime = 0
  private readonly SCAN_INTERVAL = 500 // Scan every 500ms to prevent too frequent scanning

  constructor() {
    this.reader = new BrowserMultiFormatReader()
  }

  async startScanning(
    videoElement: HTMLVideoElement,
    onScan: (barcode: string) => void,
    onError?: (error: string) => void,
  ): Promise<void> {
    console.log("[BarcodeScanner] startScanning called with ZXing")
    
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

      // Try to find back camera first, then use first available
      let selectedDeviceId = videoInputDevices[0].deviceId
      
      for (const device of videoInputDevices) {
        if (device.label.toLowerCase().includes('back') || 
            device.label.toLowerCase().includes('rear') ||
            device.label.toLowerCase().includes('environment')) {
          selectedDeviceId = device.deviceId
          console.log("Using back camera:", device.label)
          break
        }
      }

      // Start decoding from video device
      this.isScanning = true
      
      await this.reader.decodeFromVideoDevice(
        selectedDeviceId,
        videoElement,
        (result: Result | null, error?: Error) => {
          if (result) {
            this.handleScanResult(result.getText())
          }
          // Don't log NotFoundException as it's normal when no barcode is found
          if (error && !(error instanceof NotFoundException)) {
            console.log("Scan error:", error.message)
          }
        }
      )

      console.log("ZXing scanner started successfully")

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

    // Validate and format the barcode
    const formattedBarcode = BarcodeScanner.formatBarcode(barcode)
    
    if (BarcodeScanner.validateBarcodeFormat(formattedBarcode)) {
      console.log("Valid barcode detected:", formattedBarcode)
      
      if (this.onScanCallback) {
        this.onScanCallback(formattedBarcode)
        // Stop scanning after successful detection to prevent multiple scans
        this.stopScanning()
      }
    } else {
      console.log("Invalid barcode format:", formattedBarcode)
    }
  }

  stopScanning(): void {
    console.log("[BarcodeScanner] stopScanning called")
    
    this.isScanning = false

    if (this.scanningInterval) {
      clearInterval(this.scanningInterval)
      this.scanningInterval = null
    }

    // Reset the reader to stop all scanning
    try {
      this.reader.reset()
    } catch (error) {
      console.log("Error resetting reader:", error)
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

  // Get scanner info for debugging
  getInfo(): object {
    return {
      isScanning: this.isScanning,
      hasVideo: !!this.video,
      hasCallback: !!this.onScanCallback,
      lastScanTime: this.lastScanTime,
      scanInterval: this.SCAN_INTERVAL,
      zxingSupported: BarcodeScanner.isSupported()
    }
  }
}
