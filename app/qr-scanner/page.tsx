"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, QrCode, Search, Package, MapPin, Calendar, SwitchCamera } from "lucide-react"
import { warehouseRepo } from "@/lib/warehouse-repo"
import { formatDate } from "@/lib/date-utils"
import { QRScanner } from "@/lib/qr-scanner"
import type { WarehouseItem } from "@/types/warehouse"

export default function QRScanPage() {
  const [isScanning, setIsScanning] = useState(false)
  const [manualInput, setManualInput] = useState("")
  const [foundItem, setFoundItem] = useState<WarehouseItem | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchHistory, setSearchHistory] = useState<string[]>([])
  const [availableCameras, setAvailableCameras] = useState<MediaDeviceInfo[]>([])
  const [selectedCameraId, setSelectedCameraId] = useState<string>("")
  const [preferredCameraId, setPreferredCameraId] = useState<string>("")
  const [scanCount, setScanCount] = useState(0)
  const [qrData, setQrData] = useState<any>(null)
  const [isClient, setIsClient] = useState(false) // Fix hydration
  const scannerContainerRef = useRef<HTMLDivElement>(null)
  const scannerRef = useRef<QRScanner | null>(null)

  // Initialize with safe defaults to prevent hydration mismatch
  const [browserInfo, setBrowserInfo] = useState({
    isMobile: false,
    isHTTPS: false,
    hasMediaDevices: false,
    hasGetUserMedia: false,
    qrScannerSupported: false,
    userAgent: '',
    platform: ''
  })

  const checkBrowserCompatibility = () => {
    // Check if we're in browser environment
    if (typeof window === 'undefined' || typeof navigator === 'undefined') {
      return {
        isMobile: false,
        isHTTPS: false,
        hasMediaDevices: false,
        hasGetUserMedia: false,
        qrScannerSupported: false,
        userAgent: '',
        platform: ''
      }
    }

    const userAgent = navigator.userAgent.toLowerCase()
    const isMobile = /android|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent)
    const isHTTPS = window.location.protocol === 'https:' || window.location.hostname === 'localhost'
    
    return {
      isMobile,
      isHTTPS,
      hasMediaDevices: !!navigator.mediaDevices,
      hasGetUserMedia: !!navigator.mediaDevices?.getUserMedia,
      qrScannerSupported: QRScanner.isSupported(),
      userAgent: navigator.userAgent,
      platform: navigator.platform || 'Unknown'
    }
  }

  const startCamera = async (forceDeviceId?: string) => {
    if (!isClient) {
      console.log("[QRScanner] Not client-side yet, waiting...")
      return
    }

    console.log("[QRScanner] startCamera called")
    console.log("[QRScanner] scannerContainerRef.current:", !!scannerContainerRef.current)
    console.log("[QRScanner] scannerRef.current:", !!scannerRef.current)
    console.log("[QRScanner] QR Scanner supported:", QRScanner.isSupported())
    console.log("[QRScanner] forceDeviceId:", forceDeviceId)
    console.log("[QRScanner] preferredCameraId:", preferredCameraId)
    
    setError(null)
    setIsScanning(true)
    setScanCount(0)

    // Check QR Scanner support
    if (!QRScanner.isSupported()) {
      setError("QR kod tarama kütüphanesi desteklenmiyor. Lütfen tarayıcınızı güncelleyin.")
      setIsScanning(false)
      return
    }

    // Check HTTPS requirement for mobile
    if (browserInfo.isMobile && !browserInfo.isHTTPS) {
      setError("Mobil cihazlarda kamera erişimi için HTTPS bağlantısı gereklidir.")
      setIsScanning(false)
      return
    }

    // Wait longer for mobile devices
    const waitTime = browserInfo.isMobile ? 1000 : 200
    await new Promise(resolve => setTimeout(resolve, waitTime))
    
    if (!scannerContainerRef.current) {
      console.log("[QRScanner] Container element still not found after delay")
      setError("Tarama alanı henüz hazır değil. Lütfen tekrar deneyin.")
      setIsScanning(false)
      return
    }

    if (!scannerRef.current) {
      // Try to initialize scanner if not already done
      try {
        scannerRef.current = new QRScanner()
        console.log("[QRScanner] QRScanner initialized")
      } catch (initError) {
        console.error("[QRScanner] Failed to initialize scanner:", initError)
        setError("QR kod tarayıcı başlatılamadı. Lütfen sayfayı yenileyin.")
        setIsScanning(false)
        return
      }
    }

    try {
      console.log("[QRScanner] Starting camera with container element:", scannerContainerRef.current)
      
      // Use forced device ID or preferred camera ID
      const targetDeviceId = forceDeviceId || preferredCameraId
      console.log("[QRScanner] Target device ID:", targetDeviceId)
      
      await scannerRef.current.startScanning(
        scannerContainerRef.current,
        (result) => {
          console.log("QR kod algılandı:", result)
          setScanCount(prev => prev + 1)
          
          // Show detected QR code to user immediately
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
          notification.textContent = `QR kod okundu!`
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
          searchQRCode(result)
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
        console.log("[QRScanner] Scanner started successfully")
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
    
    return error
  }

  const stopCamera = () => {
    if (!isClient) {
      return
    }

    console.log("[QRScanner] stopCamera called")
    if (scannerRef.current) {
      try {
        scannerRef.current.stopScanning()
        console.log("[QRScanner] Scanner stopped successfully")
      } catch (err) {
        console.error("stopCamera error:", err)
      }
    }
    setIsScanning(false)
  }

  const searchQRCode = async (qrResult: string) => {
    if (!qrResult.trim()) return

    console.log("[QRScanner] Starting search for QR result:", qrResult)
    setIsLoading(true)
    setError(null)
    setFoundItem(null)
    setQrData(null)

    try {
      // Try to parse QR data
      const parsedQRData = QRScanner.parseQRData(qrResult)
      console.log("[QRScanner] Parsed QR data:", parsedQRData)
      setQrData(parsedQRData)

      let searchId = qrResult.trim()
      let isCoilQR = false
      let coilNumber = null
      
      // Check if this is a coil QR code (format: DK250821B16-C01)
      if (searchId.includes('-C') && /^[A-Z0-9]+-C\d+$/i.test(searchId)) {
        const parts = searchId.split('-C')
        if (parts.length === 2) {
          searchId = parts[0] // Parent ID (DK250821B16)
          coilNumber = parts[1] // Coil number (01, 02, etc.)
          isCoilQR = true
          console.log("[QRScanner] Detected coil QR code - Parent ID:", searchId, "Coil:", coilNumber)
        }
      }
      
      // If it's our warehouse QR format, extract the ID
      if (parsedQRData && parsedQRData.type === 'warehouse_item' && parsedQRData.id) {
        const dataId = parsedQRData.id
        // Check if parsed data ID is also a coil QR
        if (dataId.includes('-C') && /^[A-Z0-9]+-C\d+$/i.test(dataId)) {
          const parts = dataId.split('-C')
          if (parts.length === 2) {
            searchId = parts[0]
            coilNumber = parts[1]
            isCoilQR = true
            console.log("[QRScanner] Detected coil QR from parsed data - Parent ID:", searchId, "Coil:", coilNumber)
          }
        } else {
          searchId = dataId
        }
        console.log("[QRScanner] Using ID from QR data:", searchId)
      }

      console.log("[QRScanner] Searching for item with ID:", searchId)
      const item = await warehouseRepo.getItemByBarcode(searchId) // Using existing barcode search for now
      console.log("[QRScanner] Search result:", item)

      if (item) {
        console.log("[QRScanner] Item found, setting foundItem")
        setFoundItem(item)
        setSearchHistory((prev) => [qrResult.trim(), ...prev.filter((h) => h !== qrResult.trim())].slice(0, 5))
        
        // Show success feedback with coil info
        if (browserInfo.isMobile && 'vibrate' in navigator) {
          navigator.vibrate([100, 50, 100]) // Success vibration pattern
        }

        // If this was a coil QR code, redirect to warehouse page with coil parameter
        if (isCoilQR && coilNumber) {
          console.log("[QRScanner] Redirecting to warehouse page with coil parameter:", coilNumber)
          // Add a small delay to show the found item briefly before redirecting
          setTimeout(() => {
            window.location.href = `/warehouse/${item.id}?coil=${coilNumber}`
          }, 1500)
        }
      } else {
        console.log("[QRScanner] No item found for ID:", searchId)
        if (isCoilQR) {
          setError(`Bu bobin QR kodu ile eşleşen ana ürün bulunamadı: "${searchId}" (Bobin: C${coilNumber})`)
        } else {
          setError(`Bu QR kod ile eşleşen ürün bulunamadı: "${searchId}"`)
        }
        
        // Show error feedback
        if (browserInfo.isMobile && 'vibrate' in navigator) {
          navigator.vibrate(300) // Error vibration
        }
      }
    } catch (err) {
      console.error("[QRScanner] QR search error:", err)
      setError("Arama sırasında bir hata oluştu: " + (err instanceof Error ? err.message : String(err)))
    } finally {
      setIsLoading(false)
    }
  }

  const handleManualSearch = () => {
    if (manualInput.trim()) {
      searchQRCode(manualInput)
    }
  }

  const handleCameraSwitch = async () => {
    if (!isClient || !availableCameras.length) {
      return
    }

    // Find current camera index
    const currentIndex = availableCameras.findIndex(camera => camera.deviceId === preferredCameraId)
    // Switch to next camera (cycle through available cameras)
    const nextIndex = (currentIndex + 1) % availableCameras.length
    const nextCamera = availableCameras[nextIndex]
    
    console.log("[QRScanner] Switching camera from", preferredCameraId, "to", nextCamera.deviceId)
    
    if (isScanning) {
      stopCamera()
      // Wait a bit before starting with new camera
      setTimeout(() => {
        setPreferredCameraId(nextCamera.deviceId)
        startCamera(nextCamera.deviceId)
      }, 1000)
    } else {
      setPreferredCameraId(nextCamera.deviceId)
    }
  }

  // Fix hydration mismatch by setting client flag
  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    if (!isClient) return // Wait for client-side hydration
    
    console.log("[QRScanner] ===== QR SCANNER COMPONENT MOUNTED =====")
    
    // Set browser info on client side only
    setBrowserInfo(checkBrowserCompatibility())
    
    // Initialize QRScanner only in browser environment
    if (typeof window !== 'undefined' && typeof document !== 'undefined') {
      try {
        scannerRef.current = new QRScanner()
        console.log("[QRScanner] QRScanner initialized")
        
        // Load available cameras with delay for mobile
        const delay = browserInfo.isMobile ? 1000 : 500
        setTimeout(() => {
          loadAvailableCameras()
        }, delay)
      } catch (error) {
        console.error("[QRScanner] Failed to initialize QRScanner:", error)
        setError("QR kod tarayıcı başlatılamadı. Lütfen sayfayı yenileyin.")
      }
    }
    
    // Check if we're in browser environment before accessing navigator
    if (typeof window !== 'undefined' && typeof navigator !== 'undefined') {
      console.log("[QRScanner] Navigator userAgent:", navigator.userAgent)
      console.log("[QRScanner] MediaDevices available:", !!navigator.mediaDevices)
      console.log("[QRScanner] getUserMedia available:", !!navigator.mediaDevices?.getUserMedia)
      console.log("[QRScanner] QR Scanner supported:", QRScanner.isSupported())
    }

    return () => {
      console.log("[QRScanner] ===== QR SCANNER COMPONENT UNMOUNTING =====")
      if (isClient && scannerRef.current) {
        try {
          scannerRef.current.stopScanning()
        } catch (err) {
          console.error("Cleanup error:", err)
        }
      }
    }
  }, [isClient])

  const loadAvailableCameras = async () => {
    if (!isClient || !scannerRef.current) {
      return
    }

    try {
      const cameras = await scannerRef.current.getAvailableCameras()
      setAvailableCameras(cameras)
      console.log("[QRScanner] Available cameras:", cameras.length)
      
      // Set preferred back camera
      const backCamera = cameras.find(camera =>
        camera.label.toLowerCase().includes('back') ||
        camera.label.toLowerCase().includes('rear') ||
        camera.label.toLowerCase().includes('environment')
      )
      if (backCamera && !preferredCameraId) {
        setPreferredCameraId(backCamera.deviceId)
        console.log("[QRScanner] Set preferred back camera:", backCamera.label)
      }
    } catch (error) {
      console.log("Error loading cameras:", error)
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

  // Don't render anything until client-side hydration is complete
  if (!isClient) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-6 max-w-md">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">QR Kod Tarayıcı yükleniyor...</p>
            </div>
          </div>
        </div>
      </div>
    )
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
            <h1 className="text-2xl font-bold">QR Kod Tarama</h1>
            <p className="text-sm text-muted-foreground">Depo ürünlerini QR kod ile arayın</p>
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

        {/* QR Scanner Support Warning */}
        {!browserInfo.qrScannerSupported && (
          <Card className="mb-6 border-yellow-500 bg-yellow-50 dark:bg-yellow-950">
            <CardHeader>
              <CardTitle className="text-yellow-700 dark:text-yellow-300 text-sm flex items-center gap-2">
                <QrCode className="h-4 w-4" />
                QR Kod Tarama Desteği
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-yellow-600 dark:text-yellow-400">
              <p className="mb-2">QR kod tarama kütüphanesi yüklenemedi. Manuel arama kullanın.</p>
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
              <QrCode className="h-5 w-5" />
              QR Kod Tarama
              {browserInfo.qrScannerSupported && (
                <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-2 py-1 rounded">
                  Html5-QrCode Aktif
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {!isScanning ? (
              <div className="space-y-3">
                <Button
                  onClick={() => {
                    console.log("[QRScanner] ===== CAMERA START BUTTON CLICKED =====")
                    startCamera()
                  }}
                  className="w-full"
                  disabled={!browserInfo.qrScannerSupported}
                >
                  <QrCode className="h-4 w-4 mr-2" />
                  {browserInfo.qrScannerSupported ? "QR Kamerayı Başlat" : "QR Kamera Desteği Yok"}
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="relative">
                  <div
                    ref={scannerContainerRef}
                    id="qr-reader"
                    className="w-full min-h-48 bg-black rounded-lg relative overflow-hidden"
                  >
                    {/* Html5-QrCode will inject scanner here */}
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button onClick={stopCamera} variant="outline" className="flex-1">
                    QR Kamerayı Durdur
                  </Button>
                  {availableCameras.length > 1 && (
                    <Button 
                      variant="secondary" 
                      size="sm"
                      onClick={handleCameraSwitch}
                      className="text-xs px-2"
                      title="Kamerayı Değiştir"
                    >
                      <SwitchCamera className="h-4 w-4" />
                    </Button>
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
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="QR kod verisi veya ürün ID'si girin"
                value={manualInput}
                onChange={(e) => setManualInput(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleManualSearch()}
                className="font-mono"
              />
              <Button onClick={handleManualSearch} disabled={isLoading}>
                <Search className="h-4 w-4" />
              </Button>
            </div>
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
                  <li>• QR kodu tekrar kontrol edin</li>
                  <li>• Kamerayı QR koda daha yakın tutun</li>
                  <li>• Işık durumunu iyileştirin</li>
                  <li>• Manuel arama ile deneyin</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        )}

        {/* QR Data Display */}
        {qrData && qrData.type === 'warehouse_item' && (
          <Card className="mb-6 border-slate-300 dark:border-slate-600">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-slate-800 dark:text-slate-200">
                <QrCode className="h-5 w-5" />
                QR Kod Verisi
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="text-sm bg-slate-100 dark:bg-slate-800 p-3 rounded border border-slate-300 dark:border-slate-600">
                <div className="grid grid-cols-2 gap-2 text-xs text-slate-900 dark:text-slate-100">
                  <div><strong className="text-slate-700 dark:text-slate-300">ID:</strong> {qrData.id}</div>
                  <div><strong className="text-slate-700 dark:text-slate-300">Malzeme:</strong> {qrData.material}</div>
                  <div><strong className="text-slate-700 dark:text-slate-300">Boyut:</strong> {qrData.specs}</div>
                  <div><strong className="text-slate-700 dark:text-slate-300">Ağırlık:</strong> {qrData.weight}kg</div>
                  <div><strong className="text-slate-700 dark:text-slate-300">Tedarikçi:</strong> {qrData.supplier}</div>
                  <div><strong className="text-slate-700 dark:text-slate-300">Tarih:</strong> {qrData.date}</div>
                </div>
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
                {searchHistory.map((search, index) => (
                  <Button
                    key={index}
                    variant="ghost"
                    size="sm"
                    onClick={() => searchQRCode(search)}
                    className="w-full justify-start text-left font-mono text-xs"
                  >
                    {search}
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