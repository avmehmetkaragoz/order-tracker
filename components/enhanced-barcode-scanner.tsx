"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  Camera, 
  CameraOff, 
  Search, 
  Flashlight, 
  FlashlightOff, 
  RotateCcw, 
  Vibrate,
  AlertCircle,
  CheckCircle,
  Smartphone,
  Monitor
} from "lucide-react"
import { QuaggaBarcodeScanner } from "@/lib/quagga-scanner"

interface EnhancedBarcodeScannerProps {
  onScan: (barcode: string) => void
  onError?: (error: string) => void
  className?: string
}

export function EnhancedBarcodeScanner({ onScan, onError, className }: EnhancedBarcodeScannerProps) {
  const [isScanning, setIsScanning] = useState(false)
  const [manualInput, setManualInput] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [lastScanned, setLastScanned] = useState<string | null>(null)
  const [availableCameras, setAvailableCameras] = useState<MediaDeviceInfo[]>([])
  const [selectedCameraId, setSelectedCameraId] = useState<string>("")
  const [torchEnabled, setTorchEnabled] = useState(false)
  const [scanCount, setScanCount] = useState(0)
  const [showManualInput, setShowManualInput] = useState(false)
  
  const scannerContainerRef = useRef<HTMLDivElement>(null)
  const scannerRef = useRef<QuaggaBarcodeScanner | null>(null)

  const [deviceInfo, setDeviceInfo] = useState({
    isMobile: false,
    isIOS: false,
    isAndroid: false,
    isEdge: false,
    isHTTPS: false,
    hasMediaDevices: false,
    quaggaSupported: false
  })

  useEffect(() => {
    // Detect device and browser info
    const userAgent = navigator.userAgent.toLowerCase()
    const deviceInfo = {
      isMobile: /android|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent),
      isIOS: /iphone|ipad|ipod/i.test(userAgent),
      isAndroid: /android/i.test(userAgent),
      isEdge: userAgent.includes('edge') || userAgent.includes('edg/'),
      isHTTPS: window.location.protocol === 'https:' || window.location.hostname === 'localhost',
      hasMediaDevices: !!navigator.mediaDevices,
      quaggaSupported: QuaggaBarcodeScanner.isSupported()
    }
    setDeviceInfo(deviceInfo)

    // Initialize scanner
    if (typeof window !== 'undefined' && deviceInfo.quaggaSupported) {
      scannerRef.current = new QuaggaBarcodeScanner()
      loadAvailableCameras()
    }

    // Show manual input by default on problematic browsers
    if (deviceInfo.isEdge && deviceInfo.isMobile) {
      setShowManualInput(true)
    }

    return () => {
      if (scannerRef.current) {
        scannerRef.current.stopScanning()
      }
    }
  }, [])

  const loadAvailableCameras = async () => {
    if (!scannerRef.current) return
    
    try {
      const cameras = await scannerRef.current.getAvailableCameras()
      setAvailableCameras(cameras)
      
      // Auto-select back camera for mobile
      if (deviceInfo.isMobile) {
        const backCamera = cameras.find(camera => 
          camera.label.toLowerCase().includes('back') || 
          camera.label.toLowerCase().includes('rear') ||
          camera.label.toLowerCase().includes('environment')
        )
        if (backCamera) {
          setSelectedCameraId(backCamera.deviceId)
        }
      }
    } catch (error) {
      console.log("Error loading cameras:", error)
    }
  }

  const startScanning = async () => {
    if (!scannerContainerRef.current || !scannerRef.current) return

    setError(null)
    setIsScanning(true)
    setScanCount(0)

    try {
      await scannerRef.current.startScanning(
        scannerContainerRef.current,
        (barcode) => {
          console.log("Barcode detected:", barcode)
          setScanCount(prev => prev + 1)
          setLastScanned(barcode)
          
          // Vibrate on successful scan (mobile)
          if (deviceInfo.isMobile && 'vibrate' in navigator) {
            navigator.vibrate([200, 100, 200])
          }
          
          setIsScanning(false)
          onScan(barcode)
        },
        (errorMessage) => {
          console.log("Camera error:", errorMessage)
          setError(getEnhancedErrorMessage(errorMessage))
          setIsScanning(false)
          onError?.(errorMessage)
        },
        selectedCameraId
      )
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Tarama başlatılamadı"
      setError(getEnhancedErrorMessage(errorMessage))
      setIsScanning(false)
      onError?.(errorMessage)
    }
  }

  const stopScanning = () => {
    if (scannerRef.current) {
      scannerRef.current.stopScanning()
    }
    setIsScanning(false)
    setScanCount(0)
    setTorchEnabled(false)
  }

  const switchCamera = async (deviceId: string) => {
    setSelectedCameraId(deviceId)
    
    if (isScanning) {
      stopScanning()
      setTimeout(() => {
        startScanning()
      }, 500)
    }
  }

  const toggleTorch = async () => {
    // Simplified torch toggle - actual implementation would need MediaStreamTrack access
    setTorchEnabled(!torchEnabled)
    console.log("Torch toggle:", !torchEnabled)
  }

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const cleanBarcode = manualInput.trim().toUpperCase()
    
    if (!cleanBarcode) {
      setError("Lütfen geçerli bir barkod girin")
      return
    }

    setLastScanned(cleanBarcode)
    onScan(cleanBarcode)
    setManualInput("")
    setError(null)
  }

  const getEnhancedErrorMessage = (error: string): string => {
    if (error.includes("Permission") || error.includes("NotAllowed")) {
      if (deviceInfo.isMobile) {
        return `Kamera izni reddedildi. ${deviceInfo.isIOS ? 'Safari ayarlarından' : 'Tarayıcı ayarlarından'} kamera iznini etkinleştirin.`
      }
      return "Kamera izni reddedildi. Tarayıcı ayarlarından kamera iznini etkinleştirin."
    }
    
    if (error.includes("NotFound")) {
      return "Kamera bulunamadı. Cihazınızda kamera olduğundan ve başka uygulamalar tarafından kullanılmadığından emin olun."
    }
    
    if (error.includes("NotReadable")) {
      return "Kamera başka bir uygulama tarafından kullanılıyor. Diğer kamera uygulamalarını kapatıp tekrar deneyin."
    }
    
    if (error.includes("OverConstrained")) {
      return "Seçilen kamera ayarları desteklenmiyor. Farklı bir kamera deneyin."
    }
    
    if (error.includes("SecurityError")) {
      return "Güvenlik hatası. HTTPS bağlantısı gerekli."
    }
    
    if (deviceInfo.isEdge && deviceInfo.isMobile) {
      return `${error} - Edge mobil tarayıcısında sorun yaşıyorsanız Chrome tarayıcısını deneyin.`
    }
    
    return error
  }

  return (
    <div className={className}>
      {/* Device Info Banner */}
      {deviceInfo.isMobile && (
        <Alert className="mb-4">
          <Smartphone className="h-4 w-4" />
          <AlertDescription>
            Mobil cihaz tespit edildi. En iyi deneyim için {deviceInfo.isIOS ? 'Safari' : 'Chrome'} tarayıcısını kullanın.
          </AlertDescription>
        </Alert>
      )}

      {/* HTTPS Warning */}
      {!deviceInfo.isHTTPS && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Kamera erişimi için HTTPS bağlantısı gereklidir. Uygulamayı HTTPS üzerinden açın.
          </AlertDescription>
        </Alert>
      )}

      {/* Camera Scanner */}
      <Card className="mb-4">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Camera className="h-5 w-5" />
              Kamera Tarama
              {deviceInfo.quaggaSupported && (
                <Badge variant="secondary" className="text-xs">
                  {deviceInfo.isMobile ? 'Mobil' : 'Desktop'}
                </Badge>
              )}
            </div>
            {scanCount > 0 && (
              <Badge variant="outline" className="text-xs">
                {scanCount} tarama
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!isScanning ? (
            <div className="space-y-3">
              <Button
                onClick={startScanning}
                className="w-full"
                disabled={!deviceInfo.quaggaSupported || !deviceInfo.isHTTPS}
                size="lg"
              >
                <Camera className="h-4 w-4 mr-2" />
                {deviceInfo.quaggaSupported ? "Kamerayı Başlat" : "Kamera Desteği Yok"}
              </Button>
              
              {/* Camera Selection */}
              {availableCameras.length > 1 && (
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">Kamera Seçimi:</p>
                  <div className="grid grid-cols-1 gap-2">
                    {availableCameras.map((camera, index) => (
                      <Button
                        key={camera.deviceId}
                        variant={selectedCameraId === camera.deviceId ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSelectedCameraId(camera.deviceId)}
                        className="text-xs justify-start"
                      >
                        {camera.label || `Kamera ${index + 1}`}
                        {camera.label.toLowerCase().includes('back') && (
                          <Badge variant="secondary" className="ml-2 text-xs">Arka</Badge>
                        )}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="relative">
                <div
                  ref={scannerContainerRef}
                  id="interactive"
                  className="w-full h-64 bg-black rounded-lg relative overflow-hidden"
                >
                  {/* Scanning overlay */}
                  <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute inset-4 border-2 border-dashed border-white/50 rounded-lg flex items-center justify-center">
                      <div className="text-white text-sm bg-black/50 px-3 py-1 rounded">
                        Barkodu çerçeve içine getirin
                      </div>
                    </div>
                    
                    {/* Corner indicators */}
                    <div className="absolute top-4 left-4 w-6 h-6 border-l-2 border-t-2 border-primary"></div>
                    <div className="absolute top-4 right-4 w-6 h-6 border-r-2 border-t-2 border-primary"></div>
                    <div className="absolute bottom-4 left-4 w-6 h-6 border-l-2 border-b-2 border-primary"></div>
                    <div className="absolute bottom-4 right-4 w-6 h-6 border-r-2 border-b-2 border-primary"></div>
                  </div>
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button onClick={stopScanning} variant="outline" className="flex-1">
                  <CameraOff className="h-4 w-4 mr-2" />
                  Durdur
                </Button>
                
                {availableCameras.length > 1 && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      const currentIndex = availableCameras.findIndex(c => c.deviceId === selectedCameraId)
                      const nextIndex = (currentIndex + 1) % availableCameras.length
                      switchCamera(availableCameras[nextIndex].deviceId)
                    }}
                  >
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                )}
                
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={toggleTorch}
                  className={torchEnabled ? "bg-yellow-100" : ""}
                >
                  {torchEnabled ? <FlashlightOff className="h-4 w-4" /> : <Flashlight className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Manual Input */}
      <Card className="mb-4">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Manuel Giriş
              {(deviceInfo.isEdge && deviceInfo.isMobile) && (
                <Badge variant="default" className="text-xs">Önerilen</Badge>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowManualInput(!showManualInput)}
            >
              {showManualInput ? "Gizle" : "Göster"}
            </Button>
          </CardTitle>
        </CardHeader>
        {showManualInput && (
          <CardContent>
            <form onSubmit={handleManualSubmit} className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Barkod numarasını girin"
                  value={manualInput}
                  onChange={(e) => setManualInput(e.target.value)}
                  className="font-mono"
                  autoComplete="off"
                />
                <Button type="submit" disabled={!manualInput.trim()}>
                  <Search className="h-4 w-4" />
                </Button>
              </div>
              
              {/* Quick test buttons */}
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">Hızlı Test:</p>
                <div className="flex gap-2 flex-wrap">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setManualInput("WH967843EU2ZMM")
                      onScan("WH967843EU2ZMM")
                    }}
                    className="text-xs"
                  >
                    Test Barkod 1
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setManualInput("WH472121M6ZPXK")
                      onScan("WH472121M6ZPXK")
                    }}
                    className="text-xs"
                  >
                    Test Barkod 2
                  </Button>
                </div>
              </div>
            </form>
          </CardContent>
        )}
      </Card>

      {/* Error Display */}
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Success Display */}
      {lastScanned && !error && (
        <Alert className="mb-4">
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            Barkod başarıyla tarandı: <span className="font-mono font-semibold">{lastScanned}</span>
          </AlertDescription>
        </Alert>
      )}

      {/* Tips */}
      <Card className="bg-muted/30">
        <CardContent className="p-4">
          <div className="text-sm space-y-2">
            <div className="font-medium flex items-center gap-2">
              {deviceInfo.isMobile ? <Smartphone className="h-4 w-4" /> : <Monitor className="h-4 w-4" />}
              {deviceInfo.isMobile ? 'Mobil' : 'Desktop'} Tarama İpuçları:
            </div>
            <ul className="text-muted-foreground space-y-1 text-xs">
              {deviceInfo.isMobile ? (
                <>
                  <li>• Cihazı sabit tutun ve barkodu net hizalayın</li>
                  <li>• Yeterli ışık olduğundan emin olun</li>
                  <li>• Barkod çerçeve içinde tamamen görünür olmalı</li>
                  <li>• Sorun yaşarsanız manuel girişi kullanın</li>
                </>
              ) : (
                <>
                  <li>• Barkodu kamera görüş alanına getirin</li>
                  <li>• 10-20 cm mesafe optimal</li>
                  <li>• Barkodun tamamı görünür olmalı</li>
                  <li>• Yansıma ve gölgelerden kaçının</li>
                </>
              )}
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}