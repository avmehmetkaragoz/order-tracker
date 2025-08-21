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
  private scanningInterval: NodeJS.Timeout | null = null
  private lastScanTime = 0
  private readonly SCAN_INTERVAL = 300 // Reduced to 300ms for better responsiveness
  private canvas: HTMLCanvasElement | null = null
  private context: CanvasRenderingContext2D | null = null

  constructor() {
    // Configure ZXing with hints for better barcode detection
    const hints = new Map()
    hints.set(DecodeHintType.POSSIBLE_FORMATS, [
      BarcodeFormat.CODE_128,
      BarcodeFormat.CODE_39,
      BarcodeFormat.CODE_93,
      BarcodeFormat.EAN_13,
      BarcodeFormat.EAN_8,
      BarcodeFormat.UPC_A,
      BarcodeFormat.UPC_E,
      BarcodeFormat.CODABAR,
      BarcodeFormat.ITF,
      BarcodeFormat.RSS_14,
      BarcodeFormat.RSS_EXPANDED
    ])
    hints.set(DecodeHintType.TRY_HARDER, true)
    hints.set(DecodeHintType.PURE_BARCODE, false)
    
    this.reader = new BrowserMultiFormatReader(hints)
    
    // Initialize canvas for image processing
    if (typeof document !== 'undefined') {
      this.canvas = document.createElement('canvas')
      this.context = this.canvas.getContext('2d')
    }
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

      // Start decoding from video device with enhanced configuration
      this.isScanning = true
      
      // Use higher resolution for better barcode detection
      const constraints = {
        video: {
          deviceId: selectedDeviceId,
          width: { ideal: 1920, min: 640 },
          height: { ideal: 1080, min: 480 },
          facingMode: selectedDeviceId ? undefined : 'environment',
          focusMode: 'continuous',
          exposureMode: 'continuous',
          whiteBalanceMode: 'continuous'
        }
      }

      // Get media stream with enhanced constraints
      this.stream = await navigator.mediaDevices.getUserMedia(constraints)
      videoElement.srcObject = this.stream

      // Wait for video to be ready
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error('Video load timeout')), 10000)
        
        videoElement.addEventListener('loadedmetadata', () => {
          clearTimeout(timeout)
          resolve()
        }, { once: true })
        
        videoElement.play().catch(reject)
      })

      // Start continuous scanning with multiple approaches
      this.startContinuousScanning(videoElement)

      console.log("Enhanced ZXing scanner started successfully")

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

  private startContinuousScanning(videoElement: HTMLVideoElement): void {
    const scanFrame = async () => {
      if (!this.isScanning || !videoElement) return

      try {
        // Method 1: Direct ZXing scanning
        const result = await this.reader.decodeFromVideoElement(videoElement)
        if (result) {
          this.handleScanResult(result.getText())
          return
        }
      } catch (error) {
        // NotFoundException is normal, ignore it
        if (!(error instanceof NotFoundException)) {
          console.log("Direct scan error:", error)
        }
      }

      // Method 2: Canvas-based scanning with image enhancement
      if (this.canvas && this.context) {
        try {
          await this.scanFromCanvas(videoElement)
        } catch (error) {
          console.log("Canvas scan error:", error)
        }
      }

      // Continue scanning
      if (this.isScanning) {
        setTimeout(scanFrame, this.SCAN_INTERVAL)
      }
    }

    // Start the scanning loop
    scanFrame()
  }

  private async scanFromCanvas(videoElement: HTMLVideoElement): Promise<void> {
    if (!this.canvas || !this.context) return

    // Set canvas size to match video
    this.canvas.width = videoElement.videoWidth
    this.canvas.height = videoElement.videoHeight

    // Draw video frame to canvas
    this.context.drawImage(videoElement, 0, 0, this.canvas.width, this.canvas.height)

    // Enhance image for better barcode detection
    const imageData = this.context.getImageData(0, 0, this.canvas.width, this.canvas.height)
    this.enhanceImageForBarcode(imageData)
    this.context.putImageData(imageData, 0, 0)

    // Convert canvas to data URL and create image element for ZXing
    try {
      const dataUrl = this.canvas.toDataURL('image/png')
      const img = new Image()
      
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve()
        img.onerror = () => reject(new Error('Failed to load enhanced image'))
        img.src = dataUrl
      })

      // Try to decode from enhanced image
      const result = await this.reader.decodeFromImageElement(img)
      if (result) {
        this.handleScanResult(result.getText())
      }
    } catch (error) {
      // NotFoundException is normal
      if (!(error instanceof NotFoundException)) {
        console.log("Canvas decode error:", error)
      }
    }
  }

  private enhanceImageForBarcode(imageData: ImageData): void {
    const data = imageData.data
    
    // Convert to grayscale and increase contrast
    for (let i = 0; i < data.length; i += 4) {
      // Calculate grayscale value
      const gray = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2])
      
      // Increase contrast for better barcode detection
      const enhanced = gray < 128 ? Math.max(0, gray - 30) : Math.min(255, gray + 30)
      
      data[i] = enhanced     // Red
      data[i + 1] = enhanced // Green
      data[i + 2] = enhanced // Blue
      // Alpha channel remains unchanged
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

  // Force scan a specific area of the video
  async forceScan(): Promise<string | null> {
    if (!this.video || !this.isScanning) return null

    try {
      // Try direct video scan first
      const result = await this.reader.decodeFromVideoElement(this.video)
      if (result) {
        return result.getText()
      }
    } catch (error) {
      console.log("Force scan error:", error)
    }

    return null
  }

  // Get current camera device ID
  getCurrentCameraId(): string | null {
    if (!this.stream) return null
    
    const videoTrack = this.stream.getVideoTracks()[0]
    return videoTrack?.getSettings()?.deviceId || null
  }
}
