// Barcode scanning utility using device camera
export class BarcodeScanner {
  private video: HTMLVideoElement | null = null
  private canvas: HTMLCanvasElement | null = null
  private context: CanvasRenderingContext2D | null = null
  private stream: MediaStream | null = null
  private isScanning = false
  private onScanCallback: ((barcode: string) => void) | null = null

  constructor() {
    this.canvas = document.createElement("canvas")
    this.context = this.canvas.getContext("2d")
  }

  async startScanning(
    videoElement: HTMLVideoElement,
    onScan: (barcode: string) => void,
    onError?: (error: string) => void,
  ): Promise<void> {
    this.video = videoElement
    this.onScanCallback = onScan

    try {
      let stream: MediaStream | null = null

      // Try different camera configurations in order of preference
      const cameraConfigs = [
        // First try back camera with ideal resolution
        {
          video: {
            facingMode: "environment",
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
        },
        // Fallback to back camera with lower resolution
        {
          video: {
            facingMode: "environment",
            width: { ideal: 640 },
            height: { ideal: 480 },
          },
        },
        // Fallback to any camera with ideal resolution
        {
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
        },
        // Final fallback to basic video
        {
          video: true,
        },
      ]

      for (const config of cameraConfigs) {
        try {
          stream = await navigator.mediaDevices.getUserMedia(config)
          break
        } catch (configError) {
          console.log(`Camera config failed, trying next:`, configError)
          continue
        }
      }

      if (!stream) {
        throw new Error("Kamera erişimi sağlanamadı")
      }

      this.stream = stream
      this.video.srcObject = this.stream

      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error("Kamera yükleme zaman aşımı"))
        }, 10000)

        this.video!.addEventListener(
          "loadedmetadata",
          () => {
            clearTimeout(timeout)
            resolve()
          },
          { once: true },
        )

        this.video!.play().catch(reject)
      })

      this.isScanning = true
      this.scanLoop()
    } catch (error) {
      console.error("Camera access error:", error)
      let errorMessage = "Kamera erişimi reddedildi"

      if (error instanceof Error) {
        if (error.message.includes("not found") || error.message.includes("index")) {
          errorMessage = "Kamera bulunamadı. Lütfen cihazınızda kamera olduğundan emin olun."
        } else if (error.message.includes("permission")) {
          errorMessage = "Kamera izni reddedildi. Lütfen tarayıcı ayarlarından kamera iznini etkinleştirin."
        } else {
          errorMessage = error.message
        }
      }

      onError?.(errorMessage)
    }
  }

  stopScanning(): void {
    this.isScanning = false

    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop())
      this.stream = null
    }

    if (this.video) {
      this.video.srcObject = null
    }
  }

  private scanLoop(): void {
    if (!this.isScanning || !this.video || !this.canvas || !this.context) {
      return
    }

    // Set canvas size to match video
    this.canvas.width = this.video.videoWidth
    this.canvas.height = this.video.videoHeight

    // Draw current video frame to canvas
    this.context.drawImage(this.video, 0, 0, this.canvas.width, this.canvas.height)

    // Get image data for barcode detection
    const imageData = this.context.getImageData(0, 0, this.canvas.width, this.canvas.height)

    // Simple barcode detection (in real implementation, use a proper barcode library)
    const detectedBarcode = this.detectBarcode(imageData)

    if (detectedBarcode && this.onScanCallback) {
      this.onScanCallback(detectedBarcode)
      return // Stop scanning after successful detection
    }

    // Continue scanning
    requestAnimationFrame(() => this.scanLoop())
  }

  private detectBarcode(imageData: ImageData): string | null {
    // For now, return null to prevent false positives
    // In a real implementation, integrate a proper barcode library like @zxing/library

    // Check if image has very specific barcode-like patterns
    const data = imageData.data
    const width = imageData.width
    const height = imageData.height

    // Look for horizontal line patterns typical of barcodes
    let strongHorizontalPatterns = 0
    const sampleRows = 10 // Sample fewer rows to be more selective

    for (let row = 0; row < sampleRows; row++) {
      const y = Math.floor((height * row) / sampleRows)
      let transitions = 0
      let lastPixelDark = false

      for (let x = 0; x < width; x += 4) {
        // Sample every 4th pixel
        const pixelIndex = (y * width + x) * 4
        const r = data[pixelIndex]
        const g = data[pixelIndex + 1]
        const b = data[pixelIndex + 2]
        const gray = 0.299 * r + 0.587 * g + 0.114 * b

        const isDark = gray < 100 // Stricter threshold

        if (isDark !== lastPixelDark) {
          transitions++
          lastPixelDark = isDark
        }
      }

      // Barcodes typically have many transitions (black/white bars)
      if (transitions > 20) {
        // Much higher threshold
        strongHorizontalPatterns++
      }
    }

    // Only consider it a potential barcode if multiple rows show strong patterns
    if (strongHorizontalPatterns >= 5) {
      // Even then, don't automatically return a barcode
      // This would be where a real barcode library would decode the actual value
      console.log("[v0] Potential barcode pattern detected, but no real decoding implemented")
    }

    // Return null to prevent false positives until real barcode library is integrated
    return null
  }

  private simulateBarcodeDetection(): string | null {
    // This method is no longer used
    return null
  }

  // Manual barcode input fallback
  static validateBarcodeFormat(barcode: string): boolean {
    // Validate warehouse barcode format (WH + 6 digits + 6 alphanumeric)
    const warehousePattern = /^WH\d{6}[A-Z0-9]{6}$/
    return warehousePattern.test(barcode)
  }

  static formatBarcode(input: string): string {
    return input.toUpperCase().trim()
  }
}
