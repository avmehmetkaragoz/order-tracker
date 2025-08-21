"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Camera, Search, Package, MapPin, Calendar, RotateCcw, Flashlight, FlashlightOff, Vibrate } from "lucide-react"
import { warehouseRepo } from "@/lib/warehouse-repo"
import { formatDate } from "@/lib/date-utils"
import { QuaggaBarcodeScanner } from "@/lib/quagga-scanner"
import type { WarehouseItem } from "@/types/warehouse"

export default function BarcodeScanPage() {
  const [isScanning, setIsScanning] = useState(false)
  const [manualBarcode, setManualBarcode] = useState("")
  const [foundItem, setFoundItem] = useState<WarehouseItem | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchHistory, setSearchHistory] = useState<string[]>([])
  const [availableCameras, setAvailableCameras] = useState<MediaDeviceInfo[]>([])
  const [selectedCameraId, setSelectedCameraId] = useState<string>("")
  const [preferredCameraId, setPreferredCameraId] = useState<string>("")
  const [torchEnabled, setTorchEnabled] = useState(false)
  const [scanCount, setScanCount] = useState(0)
  const videoRef = useRef<HTMLVideoElement>(null)
  const scannerRef = useRef<QuaggaBarcodeScanner | null>(null)
  const scannerContainerRef = useRef<HTMLDivElement>(null)

  const [browserInfo, setBrowserInfo] = useState({
    isEdge: false,
    isMobile: false,
    isHTTPS: false,
    isEdgeMobile: false,
    hasMediaDevices: false,
    hasGetUserMedia: false,
    quaggaSupported: false,
    userAgent: '',
    platform: ''
  })

  const checkBrowserCompatibility = () => {
    // Check if we're in browser environment
    if (typeof window === 'undefined' || typeof navigator === 'undefined') {
      return {
        isEdge: false,
        isMobile: false,
        isHTTPS: false,
        isEdgeMobile: false,
        hasMediaDevices: false,
        hasGetUserMedia: false,
        quaggaSupported: false,
        userAgent: '',
        platform: ''
      }
    }

    const userAgent = navigator.userAgent.toLowerCase()
    const isEdge = userAgent.includes('edge') || userAgent.includes('edg/')
    const isMobile = /android|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent)
    const isHTTPS = window.location.protocol === 'https:' || window.location.hostname === 'localhost'
    
    return {
      isEdge,
      isMobile,
      isHTTPS,
      isEdgeMobile: isEdge && isMobile,
      hasMediaDevices: !!navigator.mediaDevices,
      hasGetUserMedia: !!navigator.mediaDevices?.getUserMedia,
      quaggaSupported: QuaggaBarcodeScanner.isSupported(),
      userAgent: navigator.userAgent,
      platform: navigator.platform || 'Unknown'
    }
  }

  const startCamera = async (forceDeviceId?: string) => {
    console.log("[Scanner] startCamera called")
    console.log("[Scanner] scannerContainerRef.current:", !!scannerContainerRef.current)
    console.log("[Scanner] scannerRef.current:", !!scannerRef.current)
    console.log("[Scanner] Quagga supported:", QuaggaBarcodeScanner.isSupported())
    console.log("[Scanner] forceDeviceId:", forceDeviceId)
    console.log("[Scanner] preferredCameraId:", preferredCameraId)
    
    setError(null)
    setIsScanning(true)
    setScanCount(0)

    // Check Quagga support
    if (!QuaggaBarcodeScanner.isSupported()) {
      setError("Barkod tarama kütüphanesi desteklenmiyor. Lütfen tarayıcınızı güncelleyin.")
      setIsScanning(false)
      return
    }

    // Check HTTPS requirement for mobile
    if (browserInfo.isMobile && !browserInfo.isHTTPS) {
      setError("Mobil cihazlarda kamera erişimi için HTTPS bağlantısı gereklidir.")
      setIsScanning(false)
      return
    }

    // Wait a bit for container element to be ready (especially on mobile)
    await new Promise(resolve => setTimeout(resolve, 200))
    
    if (!scannerContainerRef.current) {
      console.log("[Scanner] Container element still not found after delay")
      setError("Tarama alanı henüz hazır değil. Lütfen tekrar deneyin.")
      setIsScanning(false)
      return
    }

    if (!scannerRef.current) {
      // Try to initialize scanner if not already done
      if (typeof window !== 'undefined' && typeof document !== 'undefined') {
        scannerRef.current = new QuaggaBarcodeScanner()
        console.log("[Scanner] QuaggaBarcodeScanner initialized")
      } else {
        setError("Tarayıcı ortamı gerekli")
        setIsScanning(false)
        return
      }
    }

    try {
      console.log("[Scanner] Starting camera with container element:", scannerContainerRef.current)
      
      // Use forced device ID or preferred camera ID
      const targetDeviceId = forceDeviceId || preferredCameraId
      console.log("[Scanner] Target device ID:", targetDeviceId)
      
      await scannerRef.current.startScanning(
        scannerContainerRef.current,
        (barcode) => {
          console.log("Barkod algılandı:", barcode)
          setScanCount(prev => prev + 1)
          
          // Show detected barcode to user immediately
          const cleanBarcode = barcode.trim().toUpperCase()
          
          // Create temporary notification
          const notification = document.createElement('div')
          notification.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(34, 197, 94, 0.9);
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            z-index: 10000;
            font-size: 14px;
            font-weight: 500;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
          `
          notification.textContent = `Barkod okundu: ${cleanBarcode}`
          document.body.appendChild(notification)
          
          setTimeout(() => {
            if (document.body.contains(notification)) {
              document.body.removeChild(notification)
            }
          }, 3000)
          
          // Vibrate on successful scan (mobile)
          if (browserInfo.isMobile && 'vibrate' in navigator) {
            navigator.vibrate(200)
          }
          
          setIsScanning(false)
          searchBarcode(barcode)
        },
        (errorMessage) => {
          console.log("Kamera hatası:", errorMessage)
          setError(getMobileErrorMessage(errorMessage))
          setIsScanning(false)
        },
        targetDeviceId
      )
      
      // Update selected camera ID after successful start
      if (scannerRef.current) {
        const currentId = scannerRef.current.getCurrentCameraId()
        if (currentId) {
          setSelectedCameraId(currentId)
          // Only update preferred camera if we didn't force a specific one
          if (!forceDeviceId) {
            setPreferredCameraId(currentId)
          }
        }
      }
    } catch (err) {
      console.error("startCamera error:", err)
      const errorMessage = err instanceof Error ? err.message : "Tarama başlatılamadı"
      setError(getMobileErrorMessage(errorMessage))
      setIsScanning(false)
    }
  }

  // Enhanced error message handling for mobile devices
  const getMobileErrorMessage = (error: string): string => {
    if (error.includes("Permission") || error.includes("NotAllowed")) {
      if (browserInfo.isMobile) {
        return "Kamera izni reddedildi. Mobil tarayıcı ayarlarından kamera iznini etkinleştirin ve sayfayı yenileyin."
      }
      return "Kamera izni reddedildi. Tarayıcı ayarlarından kamera iznini etkinleştirin."
    }
    
    if (error.includes("NotFound") || error.includes("kamera bulunamadı")) {
      return "Kamera bulunamadı. Cihazınızda kamera olduğundan ve başka uygulamalar tarafından kullanılmadığından emin olun."
    }
    
    if (error.includes("NotReadable") || error.includes("Could not start")) {
      return "Kamera başka bir uygulama tarafından kullanılıyor. Diğer kamera uygulamalarını kapatıp tekrar deneyin."
    }
    
    if (error.includes("OverConstrained")) {
      return "Seçilen kamera ayarları desteklenmiyor. Farklı bir kamera deneyin."
    }
    
    if (browserInfo.isEdgeMobile) {
      return `${error} - Edge mobil tarayıcısında sorun yaşıyorsanız Chrome tarayıcısını deneyin.`
    }
    
    return error
  }

  const stopCamera = () => {
    if (scannerRef.current) {
      scannerRef.current.stopScanning()
    }
    setIsScanning(false)
    setScanCount(0)
    setTorchEnabled(false)
  }

  // Toggle torch/flashlight (if supported) - simplified for compatibility
  const toggleTorch = async () => {
    if (!scannerRef.current || !isScanning) return
    
    try {
      // For now, just show a message that torch is not supported
      // Real torch implementation would require access to MediaStreamTrack
      console.log("Torch toggle requested - not implemented yet")
      setTorchEnabled(!torchEnabled)
    } catch (error) {
      console.log("Torch toggle error:", error)
    }
  }

  const searchBarcode = async (barcode: string) => {
    if (!barcode.trim()) return

    const cleanBarcode = barcode.trim().toUpperCase()
    console.log("[BarcodeScanner] Starting search for barcode:", cleanBarcode)
    setIsLoading(true)
    setError(null)
    setFoundItem(null)

    try {
      console.log("[BarcodeScanner] Calling warehouseRepo.getItemByBarcode with:", cleanBarcode)
      const item = await warehouseRepo.getItemByBarcode(cleanBarcode)
      console.log("[BarcodeScanner] warehouseRepo.getItemByBarcode returned:", item)

      if (item) {
        console.log("[BarcodeScanner] Item found, setting foundItem")
        setFoundItem(item)
        setSearchHistory((prev) => [cleanBarcode, ...prev.filter((h) => h !== cleanBarcode)].slice(0, 5))
        
        // Show success feedback
        if (browserInfo.isMobile && 'vibrate' in navigator) {
          navigator.vibrate([100, 50, 100]) // Success vibration pattern
        }
      } else {
        console.log("[BarcodeScanner] No item found for barcode:", cleanBarcode)
        setError(`Bu barkod ile eşleşen ürün bulunamadı: "${cleanBarcode}"`)
        
        // Show error feedback
        if (browserInfo.isMobile && 'vibrate' in navigator) {
          navigator.vibrate(300) // Error vibration
        }
      }
    } catch (err) {
      console.error("[BarcodeScanner] Barcode search error:", err)
      setError("Arama sırasında bir hata oluştu: " + (err instanceof Error ? err.message : String(err)))
    } finally {
      setIsLoading(false)
    }
  }

  const handleManualSearch = () => {
    if (manualBarcode.trim()) {
      searchBarcode(manualBarcode)
    }
  }

  useEffect(() => {
    console.log("[ZXing] ===== BARCODE SCANNER COMPONENT MOUNTED =====")
    
    // Set browser info on client side only
    setBrowserInfo(checkBrowserCompatibility())
    
    // Initialize QuaggaBarcodeScanner only in browser environment
    if (typeof window !== 'undefined' && typeof document !== 'undefined') {
      scannerRef.current = new QuaggaBarcodeScanner()
      console.log("[Quagga] QuaggaBarcodeScanner initialized")
      
      // Load available cameras
      loadAvailableCameras()
    }
    
    // Check if we're in browser environment before accessing navigator
    if (typeof window !== 'undefined' && typeof navigator !== 'undefined') {
      console.log("[Quagga] Navigator userAgent:", navigator.userAgent)
      console.log("[Quagga] MediaDevices available:", !!navigator.mediaDevices)
      console.log("[Quagga] getUserMedia available:", !!navigator.mediaDevices?.getUserMedia)
      console.log("[Quagga] Quagga supported:", QuaggaBarcodeScanner.isSupported())
    }

    return () => {
      console.log("[ZXing] ===== BARCODE SCANNER COMPONENT UNMOUNTING =====")
      stopCamera()
    }
  }, [])

  const loadAvailableCameras = async () => {
    if (scannerRef.current) {
      try {
        const cameras = await scannerRef.current.getAvailableCameras()
        setAvailableCameras(cameras)
        console.log("[ZXing] Available cameras:", cameras.length)
        
        // Set preferred back camera
        const backCamera = cameras.find(camera => 
          camera.label.toLowerCase().includes('back') || 
          camera.label.toLowerCase().includes('rear') ||
          camera.label.toLowerCase().includes('environment')
        )
        if (backCamera && !preferredCameraId) {
          setPreferredCameraId(backCamera.deviceId)
          console.log("[ZXing] Set preferred back camera:", backCamera.label)
        }
      } catch (error) {
        console.log("Error loading cameras:", error)
      }
    }
  }

  const switchCamera = async (deviceId: string) => {
    console.log("[ZXing] Switching to camera:", deviceId)
    setPreferredCameraId(deviceId)
    
    if (isScanning) {
      // Stop current scanning and restart with new camera
      stopCamera()
      setTimeout(() => {
        startCamera(deviceId)
      }, 500)
    }
  }

  const handleForceScan = async () => {
    if (!scannerRef.current || !isScanning) {
      console.log("[ForceScan] Scanner not ready")
      return
    }

    console.log("[ForceScan] Manual scan triggered")
    
    try {
      const result = await scannerRef.current.forceScan()
      if (result) {
        console.log("[ForceScan] Manual scan successful:", result)
        setIsScanning(false)
        searchBarcode(result)
      } else {
        console.log("[ForceScan] No barcode detected in current frame")
        // Show temporary feedback
        const feedbackDiv = document.createElement('div')
        feedbackDiv.style.cssText = `
          position: fixed;
          top: 20px;
          left: 50%;
          transform: translateX(-50%);
          background: rgba(255, 165, 0, 0.9);
          color: white;
          padding: 10px 20px;
          border-radius: 4px;
          z-index: 10000;
          font-size: 14px;
        `
        feedbackDiv.textContent = 'Bu karede barkod bulunamadı. Barkodu daha net hizalayın.'
        document.body.appendChild(feedbackDiv)
        
        setTimeout(() => {
          if (document.body.contains(feedbackDiv)) {
            document.body.removeChild(feedbackDiv)
          }
        }, 3000)
      }
    } catch (error) {
      console.error("[ForceScan] Error during manual scan:", error)
    }
  }

  const handleDebugClick = async () => {
    if (scannerRef.current) {
      const info = await scannerRef.current.getInfo()
      console.log("Detailed Scanner Debug Info:", info)
      
      // Use a custom modal instead of alert to avoid camera freeze
      const debugInfo = `Detaylı Scanner Bilgisi:\n${info}`
      
      // Create a temporary div to show debug info
      const debugDiv = document.createElement('div')
      debugDiv.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(0,0,0,0.9);
        color: white;
        padding: 20px;
        border-radius: 8px;
        z-index: 10000;
        max-width: 90%;
        max-height: 80%;
        overflow: auto;
        font-family: monospace;
        font-size: 11px;
        white-space: pre-wrap;
      `
      debugDiv.textContent = debugInfo
      
      const buttonContainer = document.createElement('div')
      buttonContainer.style.cssText = `
        display: flex;
        gap: 10px;
        margin: 15px auto 0;
        justify-content: center;
      `
      
      const closeButton = document.createElement('button')
      closeButton.textContent = 'Kapat'
      closeButton.style.cssText = `
        padding: 8px 16px;
        background: #007bff;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
      `
      closeButton.onclick = () => document.body.removeChild(debugDiv)
      
      const captureButton = document.createElement('button')
      captureButton.textContent = 'Ekran Görüntüsü'
      captureButton.style.cssText = `
        padding: 8px 16px;
        background: #28a745;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
      `
      captureButton.onclick = () => {
        const frameData = scannerRef.current?.captureFrame()
        if (frameData) {
          const link = document.createElement('a')
          link.download = `barcode-frame-${Date.now()}.png`
          link.href = frameData
          link.click()
        }
      }
      
      buttonContainer.appendChild(captureButton)
      buttonContainer.appendChild(closeButton)
      debugDiv.appendChild(buttonContainer)
      document.body.appendChild(debugDiv)
    }
  }

  const getStatusInTurkish = (status: string) => {
    const statusMap: { [key: string]: string } = {
      in_stock: "Stokta",
      reserved: "Rezerve",
      shipped: "Sevk Edildi",
      delivered: "Teslim Edildi",
    }
    return statusMap[status] || status
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 max-w-md">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="sm" onClick={() => window.history.back()} className="p-2">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Barkod Tarama</h1>
            <p className="text-sm text-muted-foreground">Depo ürünlerini arayın</p>
          </div>
        </div>

        {/* HTTPS Warning Card */}
        {!browserInfo.isHTTPS && browserInfo.hasMediaDevices && (
          <Card className="mb-6 border-red-500 bg-red-50 dark:bg-red-950">
            <CardHeader>
              <CardTitle className="text-red-700 dark:text-red-300 text-sm flex items-center gap-2">
                <Package className="h-4 w-4" />
                HTTPS Gerekli
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-red-600 dark:text-red-400">
              <p className="mb-2">Kamera erişimi için HTTPS bağlantısı gereklidir.</p>
              <p className="mb-2"><strong>Çözüm:</strong></p>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li>Uygulamayı HTTPS üzerinden çalıştırın</li>
                <li>Production ortamında SSL sertifikası kullanın</li>
                <li>Geliştirme için: <code className="bg-red-100 dark:bg-red-900 px-1 rounded">npm run dev -- --experimental-https</code></li>
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Browser Info Card - Only show for Edge mobile */}
        {browserInfo.isEdgeMobile && (
          <Card className="mb-6 border-orange-500 bg-orange-50 dark:bg-orange-950">
            <CardHeader>
              <CardTitle className="text-orange-700 dark:text-orange-300 text-sm">
                Edge Mobil Tarayıcı Tespit Edildi
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-orange-600 dark:text-orange-400">
              <p className="mb-2">Edge mobil tarayıcısında kamera erişimi sorunları yaşanabilir.</p>
              <p className="mb-2"><strong>Öneriler:</strong></p>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li>Sayfayı HTTPS üzerinden açtığınızdan emin olun</li>
                <li>Tarayıcı ayarlarından kamera izni verin</li>
                <li>Diğer kamera uygulamalarını kapatın</li>
                <li>Sorun devam ederse Chrome tarayıcısını deneyin</li>
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Quagga Support Warning */}
        {!browserInfo.quaggaSupported && (
          <Card className="mb-6 border-yellow-500 bg-yellow-50 dark:bg-yellow-950">
            <CardHeader>
              <CardTitle className="text-yellow-700 dark:text-yellow-300 text-sm flex items-center gap-2">
                <Package className="h-4 w-4" />
                Barkod Tarama Desteği
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-yellow-600 dark:text-yellow-400">
              <p className="mb-2">Quagga kütüphanesi yüklenemedi. Manuel arama kullanın.</p>
              <p className="mb-2"><strong>Olası nedenler:</strong></p>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li>Tarayıcı eski sürüm</li>
                <li>JavaScript devre dışı</li>
                <li>Ağ bağlantısı sorunu</li>
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Camera Scanner */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Camera className="h-5 w-5" />
              Kamera Tarama
              {browserInfo.quaggaSupported && (
                <span className="text-xs bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 px-2 py-1 rounded">
                  Quagga Aktif
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {!isScanning ? (
              <div className="space-y-3">
                <Button
                  onClick={() => {
                    console.log("[ZXing] ===== CAMERA START BUTTON CLICKED =====")
                    startCamera()
                  }}
                  className="w-full"
                  disabled={!browserInfo.quaggaSupported}
                >
                  <Camera className="h-4 w-4 mr-2" />
                  {browserInfo.quaggaSupported ? "Kamerayı Başlat" : "Kamera Desteği Yok"}
                </Button>
                
                {/* Camera selection */}
                {availableCameras.length > 1 && (
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">Kamera Seçimi:</p>
                    <div className="grid grid-cols-1 gap-2">
                      {availableCameras.map((camera, index) => (
                        <Button
                          key={camera.deviceId}
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedCameraId(camera.deviceId)}
                          className={`text-xs ${selectedCameraId === camera.deviceId ? 'bg-primary text-primary-foreground' : ''}`}
                        >
                          {camera.label || `Kamera ${index + 1}`}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Show additional info for Edge mobile */}
                {browserInfo.isEdgeMobile && (
                  <div className="text-xs text-muted-foreground bg-muted p-2 rounded">
                    <p><strong>Edge Mobil İpucu:</strong> Kamera butonu çalışmazsa aşağıdaki manuel arama bölümünü kullanın.</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="relative">
                  <div
                    ref={scannerContainerRef}
                    id="interactive"
                    className="w-full h-48 bg-black rounded-lg relative overflow-hidden"
                  >
                    {/* Quagga will inject video element here */}
                  </div>
                  <div className="absolute inset-0 border-2 border-dashed border-white/50 rounded-lg flex items-center justify-center pointer-events-none">
                    <div className="text-white text-sm bg-black/50 px-2 py-1 rounded">
                      Barkodu kamera görüş alanına getirin
                    </div>
                  </div>
                  
                  {/* Camera switch buttons */}
                  {availableCameras.length > 1 && (
                    <div className="absolute top-2 right-2 space-y-1">
                      {availableCameras.map((camera, index) => (
                        <Button
                          key={camera.deviceId}
                          variant="secondary"
                          size="sm"
                          onClick={() => switchCamera(camera.deviceId)}
                          className="text-xs p-1 h-6"
                        >
                          <RotateCcw className="h-3 w-3" />
                        </Button>
                      ))}
                    </div>
                  )}
                </div>
                
                <div className="flex gap-2">
                  <Button onClick={stopCamera} variant="outline" className="flex-1">
                    Kamerayı Durdur
                  </Button>
                  {scannerRef.current && (
                    <>
                      <Button 
                        variant="secondary" 
                        size="sm"
                        onClick={handleForceScan}
                        className="text-xs"
                      >
                        Manuel Tara
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={handleDebugClick}
                        className="text-xs"
                      >
                        Debug
                      </Button>
                    </>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Manual Search */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Manuel Arama
              {browserInfo.isEdgeMobile && (
                <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-2 py-1 rounded">
                  Önerilen
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Barkod numarasını girin (örn: WH967843EU2ZMM)"
                value={manualBarcode}
                onChange={(e) => setManualBarcode(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleManualSearch()}
                className="font-mono"
              />
              <Button onClick={handleManualSearch} disabled={isLoading}>
                <Search className="h-4 w-4" />
              </Button>
            </div>
            
            {/* Quick test buttons */}
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">Hızlı Test:</p>
              <div className="flex gap-2 flex-wrap">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setManualBarcode("WH967843EU2ZMM")
                    searchBarcode("WH967843EU2ZMM")
                  }}
                  className="text-xs"
                >
                  Test Barkod 1
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setManualBarcode("WH472121M6ZPXK")
                    searchBarcode("WH472121M6ZPXK")
                  }}
                  className="text-xs"
                >
                  Test Barkod 2
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    // Test with a slightly corrupted barcode to test fuzzy matching
                    setManualBarcode("WH967843EU2ZM")
                    searchBarcode("WH967843EU2ZM")
                  }}
                  className="text-xs"
                >
                  Test Fuzzy
                </Button>
              </div>
            </div>
            
            {/* Edge mobile specific help */}
            {browserInfo.isEdgeMobile && (
              <div className="text-xs text-muted-foreground bg-blue-50 dark:bg-blue-950 p-3 rounded border border-blue-200 dark:border-blue-800">
                <p className="font-medium text-blue-700 dark:text-blue-300 mb-2">Edge Mobil İpuçları:</p>
                <ul className="space-y-1 text-blue-600 dark:text-blue-400">
                  <li>• Barkodu manuel olarak yazın (13 haneli sayı)</li>
                  <li>• Ürün etiketindeki numarayı kontrol edin</li>
                  <li>• Kamera sorunu için Chrome tarayıcısını deneyin</li>
                </ul>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Loading State */}
        {isLoading && (
          <Card className="mb-6">
            <CardContent className="py-6 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
              <p className="text-sm text-muted-foreground">Aranıyor...</p>
            </CardContent>
          </Card>
        )}

        {/* Error State */}
        {error && (
          <Card className="mb-6 border-destructive">
            <CardContent className="py-6 text-center">
              <Package className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
              <h3 className="font-semibold text-destructive mb-1">Ürün Bulunamadı</h3>
              <p className="text-sm text-muted-foreground mb-3">{error}</p>
              
              {/* Suggestions for error */}
              <div className="text-xs text-muted-foreground bg-muted p-3 rounded">
                <p className="font-medium mb-2">Öneriler:</p>
                <ul className="space-y-1 text-left">
                  <li>• Barkodu tekrar kontrol edin</li>
                  <li>• Kamerayı barkoda daha yakın tutun</li>
                  <li>• Işık durumunu iyileştirin</li>
                  <li>• Manuel arama ile deneyin</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Found Item */}
        {foundItem && (
          <Card className="mb-6 border-green-500">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-700">
                <Package className="h-5 w-5" />
                Ürün Bulundu
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Malzeme:</span>
                  <div className="font-medium">{foundItem.material}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Boyut:</span>
                  <div className="font-medium">
                    {foundItem.cm}cm • {foundItem.mikron}μ
                  </div>
                </div>
                <div>
                  <span className="text-muted-foreground">Ağırlık:</span>
                  <div className="font-medium">{foundItem.currentWeight || 0}kg</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Bobin:</span>
                  <div className="font-medium">{foundItem.bobinCount || 0} adet</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Tedarikçi:</span>
                  <div className="font-medium">{foundItem.supplier}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Durum:</span>
                  <div className="font-medium">{getStatusInTurkish(foundItem.status)}</div>
                </div>
              </div>

              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span>{foundItem.location}</span>
              </div>

              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>{formatDate(foundItem.receivedDate)}</span>
              </div>

              <Button onClick={() => (window.location.href = `/warehouse/${foundItem.id}`)} className="w-full">
                Detayları Görüntüle
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Search History */}
        {searchHistory.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Son Aramalar</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {searchHistory.map((barcode, index) => (
                  <Button
                    key={index}
                    variant="ghost"
                    size="sm"
                    onClick={() => searchBarcode(barcode)}
                    className="w-full justify-start text-left"
                  >
                    {barcode}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
