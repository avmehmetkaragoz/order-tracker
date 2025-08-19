"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Camera, Search, Package, MapPin, Calendar, RotateCcw } from "lucide-react"
import { warehouseRepo } from "@/lib/warehouse-repo"
import { formatDate } from "@/lib/date-utils"
import { BarcodeScanner } from "@/lib/barcode-scanner"
import type { WarehouseItem } from "@/types/warehouse"

export default function BarcodeScanPage() {
  const [isScanning, setIsScanning] = useState(false)
  const [manualBarcode, setManualBarcode] = useState("")
  const [foundItem, setFoundItem] = useState<WarehouseItem | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchHistory, setSearchHistory] = useState<string[]>([])
  const [currentCamera, setCurrentCamera] = useState<"environment" | "user">("environment")
  const [availableCameras, setAvailableCameras] = useState<MediaDeviceInfo[]>([])
  const videoRef = useRef<HTMLVideoElement>(null)
  const scannerRef = useRef<BarcodeScanner | null>(null)

  const [browserInfo, setBrowserInfo] = useState({
    isEdge: false,
    isMobile: false,
    isHTTPS: false,
    isEdgeMobile: false,
    hasMediaDevices: false,
    hasGetUserMedia: false
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
        hasGetUserMedia: false
      }
    }

    const userAgent = navigator.userAgent.toLowerCase()
    const isEdge = userAgent.includes('edge') || userAgent.includes('edg/')
    const isMobile = /android|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent)
    const isHTTPS = window.location.protocol === 'https:'
    
    return {
      isEdge,
      isMobile,
      isHTTPS,
      isEdgeMobile: isEdge && isMobile,
      hasMediaDevices: !!navigator.mediaDevices,
      hasGetUserMedia: !!navigator.mediaDevices?.getUserMedia
    }
  }

  const startCamera = async () => {
    if (!videoRef.current || !scannerRef.current) return

    setError(null)
    setIsScanning(true)

    try {
      await scannerRef.current.startScanning(
        videoRef.current,
        (barcode) => {
          console.log("Barkod algılandı:", barcode)
          setIsScanning(false)
          searchBarcode(barcode)
        },
        (errorMessage) => {
          setError(errorMessage)
          setIsScanning(false)
        }
      )
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Tarama başlatılamadı"
      setError(errorMessage)
      setIsScanning(false)
    }
  }

  const stopCamera = () => {
    if (scannerRef.current) {
      scannerRef.current.stopScanning()
    }
    setIsScanning(false)
  }

  const searchBarcode = async (barcode: string) => {
    if (!barcode.trim()) return

    setIsLoading(true)
    setError(null)
    setFoundItem(null)

    try {
      const item = await warehouseRepo.getItemByBarcode(barcode.trim())

      if (item) {
        setFoundItem(item)
        setSearchHistory((prev) => [barcode.trim(), ...prev.filter((h) => h !== barcode.trim())].slice(0, 5))
      } else {
        setError("Bu barkod ile eşleşen ürün bulunamadı")
      }
    } catch (err) {
      console.error("Barcode search error:", err)
      setError("Arama sırasında bir hata oluştu")
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
    console.log("[v0] ===== BARCODE SCANNER COMPONENT MOUNTED =====")
    
    // Initialize BarcodeScanner
    scannerRef.current = new BarcodeScanner()
    
    // Set browser info on client side only
    setBrowserInfo(checkBrowserCompatibility())
    
    // Check if we're in browser environment before accessing navigator
    if (typeof window !== 'undefined' && typeof navigator !== 'undefined') {
      console.log("[v0] Navigator userAgent:", navigator.userAgent)
      console.log("[v0] MediaDevices available:", !!navigator.mediaDevices)
      console.log("[v0] getUserMedia available:", !!navigator.mediaDevices?.getUserMedia)
    }

    return () => {
      console.log("[v0] ===== BARCODE SCANNER COMPONENT UNMOUNTING =====")
      stopCamera()
    }
  }, [])

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

        {/* Camera Scanner */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Camera className="h-5 w-5" />
              Kamera Tarama
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {!isScanning ? (
              <div className="space-y-3">
                <Button
                  onClick={() => {
                    console.log("[v1] ===== CAMERA START BUTTON CLICKED =====")
                    startCamera()
                  }}
                  className="w-full"
                >
                  <Camera className="h-4 w-4 mr-2" />
                  Kamerayı Başlat
                </Button>
                
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
                  <video
                    ref={videoRef}
                    className="w-full h-48 bg-black rounded-lg object-cover"
                    playsInline
                    autoPlay
                    muted
                    controls={false}
                  />
                  <div className="absolute inset-0 border-2 border-dashed border-white/50 rounded-lg flex items-center justify-center">
                    <div className="text-white text-sm bg-black/50 px-2 py-1 rounded">
                      Barkodu kamera görüş alanına getirin
                    </div>
                  </div>
                  
                </div>
                <Button onClick={stopCamera} variant="outline" className="w-full bg-transparent">
                  Kamerayı Durdur
                </Button>
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
                placeholder="Barkod numarasını girin (örn: WH7894349E1O37)"
                value={manualBarcode}
                onChange={(e) => setManualBarcode(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleManualSearch()}
                className="font-mono"
              />
              <Button onClick={handleManualSearch} disabled={isLoading}>
                <Search className="h-4 w-4" />
              </Button>
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
              <h3 className="font-semibold text-destructive mb-1">Hata</h3>
              <p className="text-sm text-muted-foreground">{error}</p>
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
