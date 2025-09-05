"use client"

import { useState } from "react"
import { BarcodeGenerator } from "@/lib/barcode-generator"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { BarcodeDisplay } from "./barcode-display"
import { useToast } from "@/hooks/use-toast"
import { Printer, Download, Eye, QrCode, Package } from "lucide-react"
import { QzPrintButton, generateProductLabelZPL } from "./qz-print-button"
import { PrintNodeButton } from "./printnode-button"

interface BarcodePrinterProps {
  barcode: string
  title: string
  specifications: string
  weight: number
  supplier: string
  date: string
  coilCount?: number
  showCoilBarcodes?: boolean
  customer?: string
}

export function BarcodePrinter({
  barcode,
  title,
  specifications,
  weight,
  supplier,
  date,
  coilCount = 1,
  showCoilBarcodes = false,
  customer,
}: BarcodePrinterProps) {
  const { toast } = useToast()
  const [isGenerating, setIsGenerating] = useState(false)

  const handlePrint = async () => {
    setIsGenerating(true)
    try {
      const printableHTML = BarcodeGenerator.generatePrintableLabel({
        barcode,
        title,
        specifications,
        weight,
        supplier,
        date,
        customer,
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
          title: "Barkod Etiketi Hazır",
          description: "Yazdırma penceresi açıldı",
        })
      } else {
        throw new Error("Popup engellendi")
      }
    } catch (error) {
      console.error("Print error:", error)
      toast({
        title: "Yazdırma Hatası",
        description: "Barkod yazdırılırken bir hata oluştu",
        variant: "destructive",
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const handlePrintCoilBarcodes = async () => {
    setIsGenerating(true)
    try {
      const printableHTML = BarcodeGenerator.generateMultipleCoilLabels({
        parentBarcode: barcode,
        title,
        specifications,
        totalWeight: weight,
        coilCount,
        supplier,
        date,
        customer,
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
          title: "Bobin Etiketleri Hazır",
          description: `${coilCount} adet bobin etiketi yazdırma penceresi açıldı`,
        })
      } else {
        throw new Error("Popup engellendi")
      }
    } catch (error) {
      console.error("Print error:", error)
      toast({
        title: "Yazdırma Hatası",
        description: "Bobin etiketleri yazdırılırken bir hata oluştu",
        variant: "destructive",
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const handleDownload = () => {
    const printableHTML = BarcodeGenerator.generatePrintableLabel({
      barcode,
      title,
      specifications,
      weight,
      supplier,
      date,
      customer,
    })

    const blob = new Blob([printableHTML], { type: "text/html" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `barkod-${barcode}.html`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    toast({
      title: "Barkod İndirildi",
      description: "HTML dosyası olarak kaydedildi",
    })
  }

  const handlePreview = () => {
    const printableHTML = BarcodeGenerator.generatePrintableLabel({
      barcode,
      title,
      specifications,
      weight,
      supplier,
      date,
      customer,
    })

    const previewWindow = window.open("", "_blank")
    if (previewWindow) {
      previewWindow.document.write(printableHTML)
      previewWindow.document.close()
    }
  }

  return (
    <div className="space-y-4">
      {/* Main Barcode Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5" />
            Ana Barkod Etiketi
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Barcode Preview */}
          <div className="bg-white p-4 rounded-lg border-2 border-dashed border-muted-foreground/30">
            <div className="text-center mb-3">
              <Badge variant="outline" className="mb-2">
                DEPO ETİKETİ
              </Badge>
            </div>

            <BarcodeDisplay text={barcode} width={250} height={70} className="mb-3" />

            <div className="text-center mb-3">
              <div className="font-medium text-sm bg-muted/50 px-3 py-1 rounded">{specifications}</div>
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
              <div className="flex justify-between">
                <span>Tarih:</span>
                <span>{date}</span>
              </div>
              <div className="flex justify-between">
                <span>Barkod:</span>
                <span className="font-mono">{barcode}</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" size="sm" onClick={handlePreview} className="bg-transparent">
                <Eye className="h-4 w-4 mr-1" />
                Önizle
              </Button>

              <Button variant="outline" size="sm" onClick={handleDownload} className="bg-transparent">
                <Download className="h-4 w-4 mr-1" />
                İndir
              </Button>
            </div>

            <PrintNodeButton
              zplData={generateProductLabelZPL(
                `${title} - ${specifications}`,
                barcode,
                `https://takip.dekaplastik.com/warehouse/${barcode}`
              )}
              label="Yazdır"
              title={`Barkod Etiket - ${barcode}`}
              onSuccess={() => toast({
                title: "Yazdırma Başarılı ✅",
                description: "Barkod etiketi başarıyla yazıcıya gönderildi! (10x10cm)",
              })}
              onError={(error) => toast({
                title: "Yazdırma Hatası ❌",
                description: error,
                variant: "destructive",
              })}
              className="w-full"
            />
          </div>

          <div className="text-xs text-muted-foreground text-center">Ana etiketi ürün için kullanın</div>
        </CardContent>
      </Card>

      {showCoilBarcodes && coilCount > 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Bobin Barkod Etiketleri
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="text-center mb-3">
                <Badge variant="secondary" className="mb-2">
                  {coilCount} ADET BOBİN ETİKETİ
                </Badge>
              </div>

              <div className="text-sm text-center mb-3">
                <div className="font-medium">{specifications}</div>
                <div className="text-muted-foreground">Her bobin için ayrı barkod</div>
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
                  <span>Barkod Formatı:</span>
                  <span className="font-mono">{barcode}-C01, C02...</span>
                </div>
              </div>
            </div>

            <Button className="w-full" onClick={handlePrintCoilBarcodes} disabled={isGenerating}>
              <Printer className="h-4 w-4 mr-2" />
              {isGenerating ? "Hazırlanıyor..." : `${coilCount} Adet Bobin Etiketi Yazdır`}
            </Button>

            <div className="text-xs text-muted-foreground text-center">
              Her bobine ayrı etiket yapıştırarak tekil takip yapabilirsiniz
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
