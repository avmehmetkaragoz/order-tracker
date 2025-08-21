"use client"

import { useState } from "react"
import { QRGenerator } from "@/lib/qr-generator"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { QRDisplay } from "./qr-display"
import { useToast } from "@/hooks/use-toast"
import { Printer, Download, Eye, QrCode, Package } from "lucide-react"

interface QRPrinterProps {
  id: string
  title: string
  material: string
  specifications: string
  weight: number
  supplier: string
  date: string
  coilCount?: number
  showCoilQRCodes?: boolean
  customer?: string
  stockType?: string
  location?: string
  highlightedCoil?: string | null
}

export function QRPrinter({
  id,
  title,
  material,
  specifications,
  weight,
  supplier,
  date,
  coilCount = 1,
  showCoilQRCodes = false,
  customer,
  stockType,
  location,
  highlightedCoil,
}: QRPrinterProps) {
  const { toast } = useToast()
  const [isGenerating, setIsGenerating] = useState(false)

  // Generate QR data for display
  const qrData = QRGenerator.generateQRData({
    id,
    material,
    cm: parseInt(specifications.split('cm')[0]) || 0,
    mikron: parseInt(specifications.split('x ')[1]) || 0,
    weight,
    supplier,
    date,
    customer,
    stockType,
    location,
    bobinCount: coilCount
  })

  const handlePrint = async () => {
    setIsGenerating(true)
    try {
      const printableHTML = await QRGenerator.generatePrintableLabel({
        id,
        title,
        material,
        specifications,
        weight,
        supplier,
        date,
        customer,
        stockType,
        location,
        bobinCount: coilCount,
      })

      // Open print window
      const printWindow = window.open("", "_blank")
      if (printWindow) {
        printWindow.document.write(printableHTML)
        printWindow.document.close()
        printWindow.focus()

        // Auto-print after a short delay
        setTimeout(() => {
          printWindow.print()
        }, 500)

        toast({
          title: "QR Kod Etiketi Hazır",
          description: "Yazdırma penceresi açıldı",
        })
      } else {
        throw new Error("Popup engellendi")
      }
    } catch (error) {
      console.error("Print error:", error)
      toast({
        title: "Yazdırma Hatası",
        description: "QR kod yazdırılırken bir hata oluştu",
        variant: "destructive",
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const handlePrintCoilQRCodes = async () => {
    setIsGenerating(true)
    try {
      const printableHTML = await QRGenerator.generateMultipleCoilLabels({
        parentId: id,
        title,
        material,
        specifications,
        totalWeight: weight,
        coilCount,
        supplier,
        date,
        customer,
        stockType,
        location,
      })

      // Open print window
      const printWindow = window.open("", "_blank")
      if (printWindow) {
        printWindow.document.write(printableHTML)
        printWindow.document.close()
        printWindow.focus()

        // Auto-print after a short delay
        setTimeout(() => {
          printWindow.print()
        }, 500)

        toast({
          title: "Bobin QR Etiketleri Hazır",
          description: `${coilCount} adet bobin QR etiketi yazdırma penceresi açıldı`,
        })
      } else {
        throw new Error("Popup engellendi")
      }
    } catch (error) {
      console.error("Print error:", error)
      toast({
        title: "Yazdırma Hatası",
        description: "Bobin QR etiketleri yazdırılırken bir hata oluştu",
        variant: "destructive",
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const handleDownload = async () => {
    try {
      const printableHTML = await QRGenerator.generatePrintableLabel({
        id,
        title,
        material,
        specifications,
        weight,
        supplier,
        date,
        customer,
        stockType,
        location,
        bobinCount: coilCount,
      })

      const blob = new Blob([printableHTML], { type: "text/html" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `qr-kod-${id}.html`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      toast({
        title: "QR Kod İndirildi",
        description: "HTML dosyası olarak kaydedildi",
      })
    } catch (error) {
      console.error("Download error:", error)
      toast({
        title: "İndirme Hatası",
        description: "QR kod indirilirken bir hata oluştu",
        variant: "destructive",
      })
    }
  }

  const handlePreview = async () => {
    try {
      const printableHTML = await QRGenerator.generatePrintableLabel({
        id,
        title,
        material,
        specifications,
        weight,
        supplier,
        date,
        customer,
        stockType,
        location,
        bobinCount: coilCount,
      })

      const previewWindow = window.open("", "_blank")
      if (previewWindow) {
        previewWindow.document.write(printableHTML)
        previewWindow.document.close()
      }
    } catch (error) {
      console.error("Preview error:", error)
      toast({
        title: "Önizleme Hatası",
        description: "QR kod önizlemesi açılırken bir hata oluştu",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="space-y-4">
      {/* Main QR Code Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5" />
            QR Kod Etiketi - Ana/Palet
            <Badge variant="default" className="ml-auto bg-green-600">
              Aktif Sistem
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* QR Code Preview */}
          <div className="bg-white p-4 rounded-lg border-2 border-dashed border-blue-300">
            <div className="text-center mb-3">
              <Badge variant="outline" className="mb-2 border-blue-500 text-blue-700">
                DEPO ETİKETİ - QR KOD
              </Badge>
            </div>

            <div className="text-center mb-3">
              <div className="font-mono text-lg font-bold text-gray-800 bg-gray-100 px-3 py-2 rounded border-dashed border-2 border-gray-300">
                {id}
              </div>
            </div>

            <div className="flex justify-center mb-3">
              <QRDisplay data={qrData} width={200} className="border border-gray-200 rounded" />
            </div>

            <div className="text-center mb-3">
              <div className="font-medium text-sm bg-blue-50 px-3 py-1 rounded border border-blue-200">{specifications}</div>
            </div>

            <div className="text-xs space-y-1 text-muted-foreground">
              <div className="flex justify-between">
                <span>Ağırlık:</span>
                <span>{weight} kg</span>
              </div>
              <div className="flex justify-between">
                <span>Tedarikçi:</span>
                <span>{supplier}</span>
              </div>
              {customer && (
                <div className="flex justify-between">
                  <span>Müşteri:</span>
                  <span className="font-medium text-blue-600 dark:text-blue-400">{customer}</span>
                </div>
              )}
              {stockType && stockType !== 'general' && (
                <div className="flex justify-between">
                  <span>Stok Tipi:</span>
                  <span>{stockType === 'customer' ? 'Müşteri Stoku' : stockType}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Lokasyon:</span>
                <span>{location || 'Depo'}</span>
              </div>
              <div className="flex justify-between">
                <span>Tarih:</span>
                <span>{date}</span>
              </div>
              {coilCount > 1 && (
                <div className="flex justify-between">
                  <span>Bobin Sayısı:</span>
                  <span>{coilCount} adet</span>
                </div>
              )}
            </div>

            <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded text-center">
              <div className="text-xs text-blue-700 font-medium">📱 QR kod ile hızlı erişim</div>
              <div className="text-xs text-blue-600 mt-1">Mobil cihazınızla tarayın</div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-3 gap-2">
            <Button variant="outline" size="sm" onClick={handlePreview} className="bg-transparent">
              <Eye className="h-4 w-4 mr-1" />
              Önizle
            </Button>

            <Button variant="outline" size="sm" onClick={handleDownload} className="bg-transparent">
              <Download className="h-4 w-4 mr-1" />
              İndir
            </Button>

            <Button size="sm" onClick={handlePrint} disabled={isGenerating}>
              <Printer className="h-4 w-4 mr-1" />
              {isGenerating ? "Hazırlanıyor..." : "Yazdır"}
            </Button>
          </div>

          <div className="text-xs text-muted-foreground text-center">
            QR kod içinde tüm ürün bilgileri bulunur
          </div>
        </CardContent>
      </Card>

      {showCoilQRCodes && coilCount > 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Bobin QR Kod Etiketleri
              <Badge variant="secondary" className="ml-auto">
                {coilCount} Adet
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {highlightedCoil && (
              <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg border border-green-200 dark:border-green-800 mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium text-green-700 dark:text-green-300">
                    Bobin C{highlightedCoil} QR kodu tarandı
                  </span>
                </div>
                <div className="text-xs text-green-600 dark:text-green-400">
                  QR Kod: <span className="font-mono">{id}-C{highlightedCoil}</span>
                </div>
                <div className="text-xs text-green-600 dark:text-green-400 mt-1">
                  Bu bobin için özel işlemler yapabilirsiniz
                </div>
              </div>
            )}

            <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="text-center mb-3">
                <Badge variant="secondary" className="mb-2">
                  {coilCount} ADET BOBİN QR ETİKETİ
                </Badge>
              </div>

              <div className="text-sm text-center mb-3">
                <div className="font-medium">{specifications}</div>
                <div className="text-muted-foreground">Her bobin için ayrı QR kod</div>
              </div>

              <div className="text-xs space-y-1 text-muted-foreground">
                <div className="flex justify-between">
                  <span>Toplam Ağırlık:</span>
                  <span>{weight} kg</span>
                </div>
                <div className="flex justify-between">
                  <span>Bobin Başına:</span>
                  <span>~{Math.round((weight / coilCount) * 100) / 100} kg</span>
                </div>
                <div className="flex justify-between">
                  <span>QR Kod Formatı:</span>
                  <span className="font-mono">{id}-C01, C02...</span>
                </div>
              </div>

              {/* Bobin listesi - vurgulanan bobin özel gösterim */}
              {coilCount > 1 && (
                <div className="mt-3 p-2 bg-gray-50 dark:bg-gray-800 rounded">
                  <div className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">Bobin Listesi:</div>
                  <div className="grid grid-cols-4 gap-1">
                    {Array.from({ length: coilCount }, (_, i) => {
                      const coilNum = String(i + 1).padStart(2, '0')
                      const isHighlighted = highlightedCoil === coilNum
                      return (
                        <div
                          key={i}
                          className={`text-xs px-2 py-1 rounded text-center font-mono ${
                            isHighlighted
                              ? 'bg-green-200 dark:bg-green-800 text-green-800 dark:text-green-200 font-bold border-2 border-green-400'
                              : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                          }`}
                        >
                          C{coilNum}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              <div className="mt-3 p-2 bg-blue-100 border border-blue-300 rounded text-center">
                <div className="text-xs text-blue-800 font-medium">🔗 Her QR kod kendi bilgilerini içerir</div>
                <div className="text-xs text-blue-700 mt-1">Tekil takip ve yönetim</div>
              </div>
            </div>

            <Button className="w-full" onClick={handlePrintCoilQRCodes} disabled={isGenerating}>
              <Printer className="h-4 w-4 mr-2" />
              {isGenerating ? "Hazırlanıyor..." : `${coilCount} Adet Bobin QR Etiketi Yazdır`}
            </Button>

            <div className="text-xs text-muted-foreground text-center">
              Her bobine ayrı QR etiket yapıştırarak tekil takip yapabilirsiniz
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}