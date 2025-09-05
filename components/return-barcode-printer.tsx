"use client"

import { useState } from "react"
import { QRGenerator } from "@/lib/qr-generator"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { QRDisplay } from "./qr-display"
import { useToast } from "@/hooks/use-toast"
import { Printer, Download, Eye, RotateCcw, QrCode } from "lucide-react"
import { QzPrintButton, generateShippingLabelZPL } from "./qz-print-button"
import { PrintNodeButton } from "./printnode-button"
import type { StockMovement } from "@/types/warehouse"

interface ReturnBarcodePrinterProps {
  parentBarcode: string
  title: string
  specifications: string
  supplier: string
  returnMovements: StockMovement[]
  customer?: string
}

export function ReturnBarcodePrinter({
  parentBarcode,
  title,
  specifications,
  supplier,
  returnMovements,
  customer,
}: ReturnBarcodePrinterProps) {
  const { toast } = useToast()
  const [isGenerating, setIsGenerating] = useState(false)

  // Filter return movements (type "Gelen" with "Ürün dönüş" in notes)
  const returnOnlyMovements = returnMovements.filter(
    movement => movement.type === "Gelen" && 
    movement.notes && 
    movement.notes.includes("Ürün dönüş")
  )

  if (returnOnlyMovements.length === 0) {
    return null
  }

  const handlePrintReturnQRCodes = async () => {
    setIsGenerating(true)
    try {
      // Generate QR codes based on returned coil count, not movement count
      const returnQRCodes: Array<{
        qrCode: string
        weight: number
        date: string
        condition: string
        operator: string
        notes: string
      }> = []

      let qrIndex = 1

      returnOnlyMovements.forEach((movement) => {
        const returnDate = movement.movementDate ? new Date(movement.movementDate).toLocaleDateString("tr-TR") : "Belirtilmemiş"
        
        // Extract condition from notes if available
        let condition = "Kullanılabilir"
        if (movement.notes?.includes("Hasarlı")) {
          condition = "Hasarlı"
        } else if (movement.notes?.includes("Kontrol Gerekli")) {
          condition = "Kontrol Gerekli"
        }

        // Extract returned coil count from notes (e.g., "2 bobin")
        const bobinMatch = movement.notes?.match(/(\d+)\s*bobin/i)
        const returnedCoilCount = bobinMatch ? parseInt(bobinMatch[1]) : 1

        // Calculate weight per coil for this return
        const totalReturnWeight = movement.weightAfter || 0
        const weightPerCoil = returnedCoilCount > 0 ? totalReturnWeight / returnedCoilCount : totalReturnWeight

        // Generate one QR code for each returned coil
        for (let i = 0; i < returnedCoilCount; i++) {
          returnQRCodes.push({
            qrCode: `${parentBarcode}-R${String(qrIndex).padStart(2, '0')}`,
            weight: weightPerCoil,
            date: returnDate,
            condition,
            operator: movement.operator || "",
            notes: movement.notes || ""
          })
          qrIndex++
        }
      })

      const printableHTML = await QRGenerator.generateReturnLabels({
        parentQRCode: parentBarcode,
        title,
        specifications,
        supplier,
        customer,
        returnQRCodes
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
          title: "Dönüş QR Etiketleri Hazır",
          description: `${returnQRCodes.length} adet dönüş QR etiketi yazdırma penceresi açıldı`,
        })
      } else {
        throw new Error("Popup engellendi")
      }
    } catch (error) {
      console.error("Print error:", error)
      toast({
        title: "Yazdırma Hatası",
        description: "Dönüş QR etiketleri yazdırılırken bir hata oluştu",
        variant: "destructive",
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const handlePreviewReturnQRCodes = async () => {
    try {
      // Generate QR codes based on returned coil count, not movement count
      const returnQRCodes: Array<{
        qrCode: string
        weight: number
        date: string
        condition: string
        operator: string
        notes: string
      }> = []

      let qrIndex = 1

      returnOnlyMovements.forEach((movement) => {
        const returnDate = movement.movementDate ? new Date(movement.movementDate).toLocaleDateString("tr-TR") : "Belirtilmemiş"
        
        // Extract condition from notes if available
        let condition = "Kullanılabilir"
        if (movement.notes?.includes("Hasarlı")) {
          condition = "Hasarlı"
        } else if (movement.notes?.includes("Kontrol Gerekli")) {
          condition = "Kontrol Gerekli"
        }

        // Extract returned coil count from notes (e.g., "2 bobin")
        const bobinMatch = movement.notes?.match(/(\d+)\s*bobin/i)
        const returnedCoilCount = bobinMatch ? parseInt(bobinMatch[1]) : 1

        // Calculate weight per coil for this return
        const totalReturnWeight = movement.weightAfter || 0
        const weightPerCoil = returnedCoilCount > 0 ? totalReturnWeight / returnedCoilCount : totalReturnWeight

        // Generate one QR code for each returned coil
        for (let i = 0; i < returnedCoilCount; i++) {
          returnQRCodes.push({
            qrCode: `${parentBarcode}-R${String(qrIndex).padStart(2, '0')}`,
            weight: weightPerCoil,
            date: returnDate,
            condition,
            operator: movement.operator || "",
            notes: movement.notes || ""
          })
          qrIndex++
        }
      })

      const printableHTML = await QRGenerator.generateReturnLabels({
        parentQRCode: parentBarcode,
        title,
        specifications,
        supplier,
        customer,
        returnQRCodes
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
        description: "Dönüş QR etiketleri önizlemesi açılırken bir hata oluştu",
        variant: "destructive",
      })
    }
  }

  const totalReturnWeight = returnOnlyMovements.reduce((sum, movement) => sum + (movement.weightAfter || 0), 0)
  
  // Calculate total returned coil count
  const totalReturnedCoils = returnOnlyMovements.reduce((sum, movement) => {
    const bobinMatch = movement.notes?.match(/(\d+)\s*bobin/i)
    const returnedCoilCount = bobinMatch ? parseInt(bobinMatch[1]) : 1
    return sum + returnedCoilCount
  }, 0)

  return (
    <Card className="border-orange-200 bg-orange-50 dark:bg-orange-950/20 dark:border-orange-800">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-orange-900 dark:text-orange-100">
          <RotateCcw className="h-5 w-5" />
          Dönüş Bobinleri QR Kod Etiketleri
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-white dark:bg-orange-900/30 p-4 rounded-lg border border-orange-200 dark:border-orange-700">
          <div className="text-center mb-3">
            <Badge variant="secondary" className="mb-2 bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">
              DÖNÜŞ ETİKETİ - QR KOD (10x10cm)
            </Badge>
          </div>

          {/* Ana Layout: Sol tarafta bilgiler, sağ tarafta QR kod */}
          <div className="flex items-start gap-4 mb-3">
            {/* Sol taraf: ID ve bilgiler */}
            <div className="flex-1">
              {/* ID - En üstte büyük */}
              <div className="mb-3">
                <div className="font-mono text-xl font-bold text-orange-800 dark:text-orange-200 bg-orange-100 dark:bg-orange-900/50 px-3 py-2 rounded border-dashed border-2 border-orange-300 dark:border-orange-700">
                  {parentBarcode}-R01
                </div>
              </div>

              {/* Özellikler */}
              <div className="mb-3">
                <div className="font-medium text-sm bg-orange-50 dark:bg-orange-900/30 px-3 py-1 rounded border border-orange-200 dark:border-orange-700">{specifications}</div>
              </div>

              {/* Diğer bilgiler */}
              <div className="text-xs space-y-1 text-orange-700 dark:text-orange-300">
                <div className="flex justify-between">
                  <span>Toplam Dönüş:</span>
                  <span className="font-medium">{totalReturnWeight.toFixed(1)} kg</span>
                </div>
                <div className="flex justify-between">
                  <span>Etiket Sayısı:</span>
                  <span className="font-medium">{totalReturnedCoils} adet</span>
                </div>
                <div className="flex justify-between">
                  <span>Durum:</span>
                  <span className="font-medium">Dönüş</span>
                </div>
              </div>
            </div>

            {/* Sağ taraf: QR kod - Diğer etiketlerle aynı boyut */}
            <div className="flex-shrink-0">
              <QRDisplay 
                data={`${parentBarcode}-R01`} 
                width={120} 
                className="border border-orange-200 dark:border-orange-700 rounded" 
              />
            </div>
          </div>

          {/* Ayırıcı çizgi - QR koda değmeyecek şekilde, diğer etiketlerle aynı uzunluk */}
          <div className="mb-3">
            <div className="w-3/5 h-px bg-orange-300 dark:bg-orange-700 border-t border-dashed"></div>
          </div>

          {/* Alt bilgiler */}
          <div className="text-xs space-y-1 text-orange-700 dark:text-orange-300">
            <div className="flex justify-between">
              <span>QR Kod Formatı:</span>
              <span className="font-mono">{parentBarcode}-R01, R02...</span>
            </div>
            <div className="flex justify-between">
              <span>Tip:</span>
              <span>Dönüş Etiketi</span>
            </div>
          </div>

          {/* Return movements preview */}
          <div className="mt-3 space-y-2">
            <div className="text-xs font-medium text-orange-800 dark:text-orange-200">Dönüş Detayları:</div>
            {returnOnlyMovements.slice(0, 3).map((movement, index) => {
              const returnDate = movement.movementDate ? new Date(movement.movementDate).toLocaleDateString("tr-TR") : "Belirtilmemiş"
              let condition = "Kullanılabilir"
              if (movement.notes?.includes("Hasarlı")) {
                condition = "Hasarlı"
              } else if (movement.notes?.includes("Kontrol Gerekli")) {
                condition = "Kontrol Gerekli"
              }

              return (
                <div key={movement.id} className="text-xs bg-orange-100 dark:bg-orange-900/50 p-2 rounded border border-orange-200 dark:border-orange-700">
                  <div className="flex justify-between items-center">
                    <span className="font-mono">{parentBarcode}-R{String(index + 1).padStart(2, '0')}</span>
                    <span className="font-medium">{(movement.weightAfter || 0).toFixed(1)}kg</span>
                  </div>
                  <div className="flex justify-between text-orange-600 dark:text-orange-400">
                    <span>{condition}</span>
                    <span>{returnDate}</span>
                  </div>
                </div>
              )
            })}
            {returnOnlyMovements.length > 3 && (
              <div className="text-xs text-orange-600 dark:text-orange-400 text-center">
                +{returnOnlyMovements.length - 3} adet daha...
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePreviewReturnQRCodes}
            className="w-full bg-transparent border-orange-300 text-orange-700 hover:bg-orange-100 dark:border-orange-700 dark:text-orange-300 dark:hover:bg-orange-900/30"
          >
            <Eye className="h-4 w-4 mr-1" />
            Önizle
          </Button>

          <PrintNodeButton
            zplData={generateShippingLabelZPL(
              `DÖNÜŞ-${parentBarcode}`,
              `${customer || supplier} - Dönüş`,
              `https://takip.dekaplastik.com/warehouse/${parentBarcode}`
            )}
            label="Yazdır"
            title={`Dönüş Etiket - ${parentBarcode}`}
            onSuccess={() => toast({
              title: "Yazdırma Başarılı ✅",
              description: "Dönüş etiketi başarıyla yazıcıya gönderildi! (10x10cm)",
            })}
            onError={(error) => toast({
              title: "Yazdırma Hatası ❌",
              description: error,
              variant: "destructive",
            })}
            className="w-full"
          />
        </div>

        <div className="text-xs text-orange-600 dark:text-orange-400 text-center">
          Dönüş yapılan bobinleri QR kod ile ayrı takip etmek için kullanın
        </div>
      </CardContent>
    </Card>
  )
}
