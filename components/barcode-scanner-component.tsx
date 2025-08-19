"use client"

import type React from "react"

import { useEffect, useRef, useState } from "react"
import { BarcodeScanner } from "@/lib/barcode-scanner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Camera, CameraOff, Keyboard, AlertCircle, CheckCircle } from "lucide-react"

interface BarcodeScannerComponentProps {
  onScan: (barcode: string) => void
  onError?: (error: string) => void
}

export function BarcodeScannerComponent({ onScan, onError }: BarcodeScannerComponentProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const scannerRef = useRef<BarcodeScanner | null>(null)
  const [isScanning, setIsScanning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [manualInput, setManualInput] = useState("")
  const [showManualInput, setShowManualInput] = useState(false)
  const [lastScanned, setLastScanned] = useState<string | null>(null)

  useEffect(() => {
    scannerRef.current = new BarcodeScanner()

    return () => {
      if (scannerRef.current) {
        scannerRef.current.stopScanning()
      }
    }
  }, [])

  const startScanning = async () => {
    if (!videoRef.current || !scannerRef.current) return

    setError(null)
    setIsScanning(true)

    try {
      await scannerRef.current.startScanning(
        videoRef.current,
        (barcode) => {
          setLastScanned(barcode)
          setIsScanning(false)
          onScan(barcode)
        },
        (errorMessage) => {
          setError(errorMessage)
          setIsScanning(false)
          onError?.(errorMessage)
        },
      )
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Tarama başlatılamadı"
      setError(errorMessage)
      setIsScanning(false)
      onError?.(errorMessage)
    }
  }

  const stopScanning = () => {
    if (scannerRef.current) {
      scannerRef.current.stopScanning()
    }
    setIsScanning(false)
  }

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const formattedBarcode = BarcodeScanner.formatBarcode(manualInput)

    if (!BarcodeScanner.validateBarcodeFormat(formattedBarcode)) {
      setError("Geçersiz barkod formatı. Format: WH123456ABC123")
      return
    }

    setLastScanned(formattedBarcode)
    onScan(formattedBarcode)
    setManualInput("")
  }

  return (
    <div className="space-y-6">
      {/* Camera Scanner */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            Kamera ile Tarama
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Video Element */}
          <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              playsInline
              muted
              style={{ display: isScanning ? "block" : "none" }}
            />

            {!isScanning && (
              <div className="absolute inset-0 flex items-center justify-center bg-muted/50">
                <div className="text-center">
                  <Camera className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Kamera hazır</p>
                </div>
              </div>
            )}

            {/* Scanning Overlay */}
            {isScanning && (
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute inset-0 bg-black/20" />
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                  <div className="w-64 h-32 border-2 border-primary border-dashed rounded-lg bg-primary/10">
                    <div className="w-full h-full flex items-center justify-center">
                      <p className="text-primary text-sm font-medium">Barkodu çerçeve içine getirin</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Camera Controls */}
          <div className="flex gap-2">
            {!isScanning ? (
              <Button onClick={startScanning} className="flex-1">
                <Camera className="h-4 w-4 mr-2" />
                Taramayı Başlat
              </Button>
            ) : (
              <Button onClick={stopScanning} variant="destructive" className="flex-1">
                <CameraOff className="h-4 w-4 mr-2" />
                Taramayı Durdur
              </Button>
            )}

            <Button variant="outline" onClick={() => setShowManualInput(!showManualInput)} className="bg-transparent">
              <Keyboard className="h-4 w-4 mr-2" />
              Manuel Giriş
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Manual Input */}
      {showManualInput && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Keyboard className="h-5 w-5" />
              Manuel Barkod Girişi
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleManualSubmit} className="space-y-4">
              <div>
                <Label htmlFor="barcode">Barkod</Label>
                <Input
                  id="barcode"
                  placeholder="WH123456ABC123"
                  value={manualInput}
                  onChange={(e) => setManualInput(e.target.value)}
                  className="font-mono"
                />
                <p className="text-xs text-muted-foreground mt-1">Format: WH + 6 rakam + 6 harf/rakam</p>
              </div>

              <Button type="submit" className="w-full" disabled={!manualInput.trim()}>
                Barkodu Ara
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Success Display */}
      {lastScanned && !error && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            Barkod başarıyla tarandı: <span className="font-mono">{lastScanned}</span>
          </AlertDescription>
        </Alert>
      )}

      {/* Instructions */}
      <Card className="bg-muted/30">
        <CardContent className="p-4">
          <div className="text-sm space-y-2">
            <div className="font-medium">Tarama İpuçları:</div>
            <ul className="text-muted-foreground space-y-1 text-xs">
              <li>• Barkodu iyi aydınlatılmış bir yerde tutun</li>
              <li>• Kamerayı barkoda 10-20 cm mesafede tutun</li>
              <li>• Barkodun tamamının çerçeve içinde olduğundan emin olun</li>
              <li>• Eğer tarama çalışmıyorsa manuel girişi kullanın</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
