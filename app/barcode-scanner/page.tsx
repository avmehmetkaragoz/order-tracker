"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Camera, Search, Package, MapPin, Calendar } from "lucide-react"
import { warehouseRepo } from "@/lib/warehouse-repo"
import { formatDate } from "@/lib/date-utils"
import type { WarehouseItem } from "@/types/warehouse"

export default function BarcodeScanPage() {
  const [isScanning, setIsScanning] = useState(false)
  const [manualBarcode, setManualBarcode] = useState("")
  const [foundItem, setFoundItem] = useState<WarehouseItem | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchHistory, setSearchHistory] = useState<string[]>([])
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

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
    try {
      console.log("[v1] ===== CAMERA START FUNCTION CALLED =====")
      setError(null)
      setIsScanning(true)
      
      const browserInfo = checkBrowserCompatibility()
      console.log("[v1] Browser compatibility:", browserInfo)

      // Check basic requirements
      if (!browserInfo.hasMediaDevices || !browserInfo.hasGetUserMedia) {
        throw new Error("Bu tarayıcı kamera erişimini desteklemiyor")
      }

      // HTTPS requirement for Edge mobile
      if (browserInfo.isEdgeMobile && !browserInfo.isHTTPS) {
        throw new Error("Edge mobil tarayıcısında kamera erişimi için HTTPS gereklidir")
      }

      // Edge mobile specific warning
      if (browserInfo.isEdgeMobile) {
        console.log("[v1] Edge mobile detected - using specialized approach")
      }

      // Wait for user gesture if needed (Edge mobile requirement)
      if (browserInfo.isEdgeMobile) {
        await new Promise(resolve => setTimeout(resolve, 100))
      }

      // Step 1: Request basic permission without constraints
      console.log("[v1] Step 1: Requesting basic camera permission...")
      let permissionStream: MediaStream | null = null
      
      try {
        // For Edge mobile, try the most basic request first
        const basicConstraints = browserInfo.isEdgeMobile 
          ? { video: { width: 640, height: 480 }, audio: false }
          : { video: true, audio: false }
          
        permissionStream = await navigator.mediaDevices.getUserMedia(basicConstraints)
        console.log("[v1] Basic permission granted")
        
        // Immediately stop to release the camera
        permissionStream.getTracks().forEach(track => {
          console.log("[v1] Stopping permission track:", track.kind, track.label)
          track.stop()
        })
        permissionStream = null
        
        // Wait a bit for the camera to be released
        await new Promise(resolve => setTimeout(resolve, 500))
        
      } catch (permissionError) {
        console.error("[v1] Basic permission failed:", permissionError)
        
        if (permissionError instanceof Error) {
          if (permissionError.name === 'NotAllowedError') {
            throw new Error("Kamera izni reddedildi. Tarayıcı ayarlarından kamera erişimine izin verin.")
          } else if (permissionError.name === 'NotFoundError') {
            throw new Error("Kamera bulunamadı. Cihazınızda kamera olduğundan emin olun.")
          } else if (permissionError.name === 'NotReadableError') {
            throw new Error("Kamera başka bir uygulama tarafından kullanılıyor.")
          }
        }
        
        throw new Error("Kamera izni alınamadı: " + (permissionError as Error).message)
      }

      // Step 2: Enumerate devices after permission
      console.log("[v1] Step 2: Enumerating devices...")
      let devices: MediaDeviceInfo[] = []
      
      try {
        devices = await navigator.mediaDevices.enumerateDevices()
        console.log("[v1] Available devices:", devices.map(d => ({ kind: d.kind, label: d.label, deviceId: d.deviceId })))
        
        const videoDevices = devices.filter(device => device.kind === 'videoinput')
        console.log("[v1] Video devices found:", videoDevices.length)
        
        if (videoDevices.length === 0) {
          throw new Error("Video kamerası bulunamadı")
        }
        
      } catch (deviceError) {
        console.warn("[v1] Device enumeration failed:", deviceError)
        // Continue without device enumeration
      }

      // Step 3: Build constraint options for Edge mobile
      const videoDevices = devices.filter(device => device.kind === 'videoinput')
      const constraintOptions: MediaStreamConstraints[] = []

      if (browserInfo.isEdgeMobile) {
        console.log("[v1] Building Edge mobile specific constraints...")
        
        // For Edge mobile, try very specific constraints
        if (videoDevices.length > 0) {
          // Try each device with minimal constraints
          videoDevices.forEach((device, index) => {
            if (device.deviceId) {
              constraintOptions.push({
                video: {
                  deviceId: { exact: device.deviceId },
                  width: { ideal: 640 },
                  height: { ideal: 480 }
                },
                audio: false
              })
            }
          })
        }
        
        // Edge mobile fallback constraints
        constraintOptions.push(
          {
            video: {
              facingMode: "environment",
              width: { ideal: 640 },
              height: { ideal: 480 }
            },
            audio: false
          },
          {
            video: {
              width: { ideal: 640 },
              height: { ideal: 480 }
            },
            audio: false
          },
          {
            video: {
              facingMode: "user",
              width: { ideal: 640 },
              height: { ideal: 480 }
            },
            audio: false
          }
        )
      } else {
        // Standard constraints for other browsers
        if (videoDevices.length > 0) {
          const backCamera = videoDevices.find(device => 
            device.label.toLowerCase().includes('back') || 
            device.label.toLowerCase().includes('rear') ||
            device.label.toLowerCase().includes('environment')
          )
          
          if (backCamera?.deviceId) {
            constraintOptions.push({
              video: { deviceId: { exact: backCamera.deviceId } },
              audio: false
            })
          }

          videoDevices.forEach(device => {
            if (device.deviceId) {
              constraintOptions.push({
                video: { deviceId: { exact: device.deviceId } },
                audio: false
              })
            }
          })
        }

        constraintOptions.push(
          { video: { facingMode: "environment" }, audio: false },
          { video: true, audio: false },
          { video: { facingMode: "user" }, audio: false }
        )
      }

      // Step 4: Try constraints with timeout
      console.log("[v1] Step 3: Trying camera constraints...")
      let stream: MediaStream | null = null
      let lastError: Error | null = null
      const timeoutMs = browserInfo.isEdgeMobile ? 15000 : 10000

      for (let i = 0; i < constraintOptions.length; i++) {
        const constraints = constraintOptions[i]
        console.log(`[v1] Trying constraint ${i + 1}/${constraintOptions.length}:`, constraints)

        try {
          const timeoutPromise = new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error("Kamera erişim zaman aşımı")), timeoutMs)
          )

          stream = await Promise.race([
            navigator.mediaDevices.getUserMedia(constraints),
            timeoutPromise
          ])

          console.log("[v1] Camera stream obtained:", stream)
          
          const videoTracks = stream.getVideoTracks()
          if (videoTracks.length === 0) {
            console.warn("[v1] No video tracks in stream")
            stream.getTracks().forEach(track => track.stop())
            throw new Error("Video track bulunamadı")
          }
          
          console.log("[v1] Video track settings:", videoTracks[0].getSettings())
          console.log("[v1] Video track capabilities:", videoTracks[0].getCapabilities?.())
          
          break // Success!
          
        } catch (err) {
          console.warn(`[v1] Constraint ${i + 1} failed:`, err)
          lastError = err instanceof Error ? err : new Error(String(err))
          
          if (stream) {
            stream.getTracks().forEach(track => track.stop())
            stream = null
          }
          
          // Wait between attempts for Edge mobile
          if (browserInfo.isEdgeMobile && i < constraintOptions.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 1000))
          }
        }
      }

      if (!stream) {
        throw lastError || new Error("Tüm kamera erişim denemeleri başarısız")
      }

      streamRef.current = stream

      // Step 5: Setup video element
      console.log("[v1] Step 4: Setting up video element...")
      
      if (!videoRef.current) {
        throw new Error("Video elementi bulunamadı")
      }

      // Wait for video element to be ready
      await new Promise(resolve => setTimeout(resolve, 300))

      return new Promise<void>((resolve, reject) => {
        if (!videoRef.current || !stream) {
          reject(new Error("Video elementi veya stream bulunamadı"))
          return
        }

        const video = videoRef.current
        let resolved = false

        const cleanup = () => {
          video.removeEventListener('loadedmetadata', onLoadedMetadata)
          video.removeEventListener('canplay', onCanPlay)
          video.removeEventListener('error', onError)
          video.removeEventListener('loadstart', onLoadStart)
        }

        const onLoadedMetadata = () => {
          console.log("[v1] Video metadata loaded")
          console.log("[v1] Video dimensions:", video.videoWidth, "x", video.videoHeight)
        }

        const onCanPlay = async () => {
          console.log("[v1] Video can play")
          if (!resolved) {
            try {
              await video.play()
              console.log("[v1] Video playing successfully")
              resolved = true
              cleanup()
              resolve()
            } catch (playError) {
              console.error("[v1] Video play failed:", playError)
              cleanup()
              reject(new Error("Video oynatma başarısız: " + (playError as Error).message))
            }
          }
        }

        const onError = (event: Event) => {
          console.error("[v1] Video error:", event)
          cleanup()
          if (!resolved) {
            resolved = true
            reject(new Error("Video yükleme hatası"))
          }
        }

        const onLoadStart = () => {
          console.log("[v1] Video load start")
        }

        // Set up event listeners
        video.addEventListener('loadedmetadata', onLoadedMetadata)
        video.addEventListener('canplay', onCanPlay)
        video.addEventListener('error', onError)
        video.addEventListener('loadstart', onLoadStart)

        // Set video source
        video.srcObject = stream

        // Timeout for video setup
        setTimeout(() => {
          if (!resolved) {
            console.error("[v1] Video setup timeout")
            cleanup()
            resolved = true
            reject(new Error("Video kurulum zaman aşımı"))
          }
        }, 10000)
      })

    } catch (err) {
      console.error("[v1] Camera access error:", err)
      
      // Clean up any streams
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
        streamRef.current = null
      }
      
      let errorMessage = "Kamera erişimi başarısız"
      
      if (err instanceof Error) {
        const browserInfo = checkBrowserCompatibility()
        
        if (err.name === 'NotFoundError' || err.message.includes('Requested device not found')) {
          if (browserInfo.isEdgeMobile) {
            errorMessage = "Edge mobil: Kamera bulunamadı. Cihazınızda kamera olduğundan ve başka uygulamalar tarafından kullanılmadığından emin olun. Sayfayı yenileyin."
          } else {
            errorMessage = "Kamera bulunamadı. Cihazınızda kamera olduğundan emin olun."
          }
        } else if (err.name === 'NotAllowedError' || err.message.includes('Permission denied')) {
          errorMessage = "Kamera izni reddedildi. Tarayıcı ayarlarından bu siteye kamera erişimi verin."
        } else if (err.name === 'NotReadableError') {
          errorMessage = "Kamera başka bir uygulama tarafından kullanılıyor. Diğer uygulamaları kapatın."
        } else if (err.message.includes('timeout') || err.message.includes('zaman aşımı')) {
          if (browserInfo.isEdgeMobile) {
            errorMessage = "Edge mobil: Kamera erişimi zaman aşımı. Tarayıcıyı kapatıp tekrar açın."
          } else {
            errorMessage = "Kamera erişimi zaman aşımına uğradı. Sayfayı yenileyin."
          }
        } else if (err.message.includes('HTTPS')) {
          errorMessage = err.message
        } else {
          if (browserInfo.isEdgeMobile) {
            errorMessage = `Edge mobil kamera hatası: ${err.message}. Chrome tarayıcısını deneyin.`
          } else {
            errorMessage = `Kamera hatası: ${err.message}`
          }
        }
      }
      
      setError(errorMessage)
      setIsScanning(false)
    }
  }

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
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
        {(() => {
          const browserInfo = checkBrowserCompatibility()
          return !browserInfo.isHTTPS && browserInfo.hasMediaDevices ? (
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
          ) : null
        })()}

        {/* Browser Info Card - Only show for Edge mobile */}
        {(() => {
          const browserInfo = checkBrowserCompatibility()
          return browserInfo.isEdgeMobile ? (
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
          ) : null
        })()}

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
                {(() => {
                  const browserInfo = checkBrowserCompatibility()
                  return browserInfo.isEdgeMobile ? (
                    <div className="text-xs text-muted-foreground bg-muted p-2 rounded">
                      <p><strong>Edge Mobil İpucu:</strong> Kamera butonu çalışmazsa aşağıdaki manuel arama bölümünü kullanın.</p>
                    </div>
                  ) : null
                })()}
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
              {(() => {
                const browserInfo = checkBrowserCompatibility()
                return browserInfo.isEdgeMobile ? (
                  <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-2 py-1 rounded">
                    Önerilen
                  </span>
                ) : null
              })()}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Barkod numarasını girin (örn: 1234567890123)"
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
            {(() => {
              const browserInfo = checkBrowserCompatibility()
              return browserInfo.isEdgeMobile ? (
                <div className="text-xs text-muted-foreground bg-blue-50 dark:bg-blue-950 p-3 rounded border border-blue-200 dark:border-blue-800">
                  <p className="font-medium text-blue-700 dark:text-blue-300 mb-2">Edge Mobil İpuçları:</p>
                  <ul className="space-y-1 text-blue-600 dark:text-blue-400">
                    <li>• Barkodu manuel olarak yazın (13 haneli sayı)</li>
                    <li>• Ürün etiketindeki numarayı kontrol edin</li>
                    <li>• Kamera sorunu için Chrome tarayıcısını deneyin</li>
                  </ul>
                </div>
              ) : null
            })()}
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
