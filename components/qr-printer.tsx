"use client"

import { useState } from "react"
import { QRGenerator } from "@/lib/qr-generator"
import { DebugQRGenerator } from "@/lib/qr-generator-debug"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { QRDisplay } from "./qr-display"
import { useToast } from "@/hooks/use-toast"
import { Printer, Download, Eye, QrCode, Package } from "lucide-react"
import { QzPrintButton, generateQRZPL } from "./qz-print-button"
import { PrintNodeButton } from "./printnode-button"

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
  const [selectedCoils, setSelectedCoils] = useState<Set<number>>(
    new Set(Array.from({ length: coilCount }, (_, i) => i + 1))
  )

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
      console.log("🎯 DEBUG QR generation with data:", {
        id, title, material, specifications, weight, supplier, date, customer, stockType, location, bobinCount: coilCount
      })

      // Parametreleri kontrol et
      if (!id || !specifications || !material) {
        throw new Error("Gerekli bilgiler eksik: ID, malzeme veya özellikler boş")
      }

      const printableHTML = await DebugQRGenerator.generatePrintableLabel({
        id,
        title,
        material,
        specifications,
        weight: weight || 0,
        supplier: supplier || "Tedarikçi belirtilmemiş",
        date: date || new Date().toLocaleDateString('tr-TR'),
        customer,
        stockType,
        location,
        bobinCount: coilCount,
      })

      console.log("QR generation successful, HTML length:", printableHTML.length)

      // Enhanced print window with better content loading detection
      const printWindow = window.open("", "_blank", "width=800,height=600,scrollbars=yes,resizable=yes")
      if (printWindow) {
        // Write content to print window
        printWindow.document.open()
        printWindow.document.write(printableHTML)
        printWindow.document.close()
        
        // Enhanced content loading detection
        const waitForContentLoad = () => {
          return new Promise<void>((resolve, reject) => {
            let attempts = 0
            const maxAttempts = 50 // 5 seconds max wait
            
            const checkContent = () => {
              attempts++
              
              try {
                // Check if document is ready and content is loaded
                const doc = printWindow.document
                const isDocumentReady = doc.readyState === 'complete'
                const hasContent = doc.body && doc.body.innerHTML.length > 100
                const hasImages = doc.images.length === 0 || Array.from(doc.images).every(img => img.complete)
                
                console.log(`Content check attempt ${attempts}:`, {
                  isDocumentReady,
                  hasContent,
                  hasImages,
                  bodyLength: doc.body?.innerHTML.length || 0,
                  imageCount: doc.images.length
                })
                
                if (isDocumentReady && hasContent && hasImages) {
                  console.log("Content fully loaded, proceeding with print")
                  resolve()
                } else if (attempts >= maxAttempts) {
                  console.warn("Content loading timeout, proceeding anyway")
                  resolve()
                } else {
                  setTimeout(checkContent, 100)
                }
              } catch (error) {
                console.error("Error checking content:", error)
                if (attempts >= maxAttempts) {
                  reject(new Error("Content loading failed"))
                } else {
                  setTimeout(checkContent, 100)
                }
              }
            }
            
            // Start checking immediately
            checkContent()
          })
        }
        
        // Wait for content to load, then print
        try {
          await waitForContentLoad()
          
          // Focus and print with enhanced timing
          printWindow.focus()
          
          // Give extra time for Zebra ZD220 driver to initialize
          setTimeout(() => {
            try {
              console.log("Initiating print for Zebra ZD220")
              printWindow.print()
              
              // Enhanced cleanup with multiple strategies
              const cleanup = () => {
                setTimeout(() => {
                  try {
                    if (!printWindow.closed) {
                      printWindow.close()
                      console.log("Print window closed successfully")
                    }
                  } catch (e) {
                    console.log("Print window cleanup:", e instanceof Error ? e.message : String(e))
                  }
                }, 1000)
              }
              
              // Multiple cleanup triggers
              if (printWindow.addEventListener) {
                printWindow.addEventListener('afterprint', cleanup)
                printWindow.addEventListener('beforeunload', cleanup)
              }
              
              // Fallback cleanup
              setTimeout(cleanup, 5000)
              
            } catch (printError) {
              console.error("Print execution error:", printError)
              toast({
                title: "Yazdırma Hatası",
                description: "Yazıcı ile iletişim kurulamadı. Zebra ZD220 bağlantısını kontrol edin.",
                variant: "destructive",
              })
            }
          }, 1500) // Increased delay for Zebra ZD220
          
        } catch (loadError) {
          console.error("Content loading error:", loadError)
          // Fallback: try to print anyway
          printWindow.focus()
          setTimeout(() => printWindow.print(), 1000)
        }

        toast({
          title: "QR Kod Etiketi Hazırlanıyor",
          description: "Zebra ZD220 için etiket hazırlanıyor, lütfen bekleyin...",
        })
      } else {
        throw new Error("Popup engellendi - lütfen tarayıcı ayarlarından popup'ları etkinleştirin")
      }
    } catch (error) {
      console.error("Print error details:", {
        error,
        stack: error instanceof Error ? error.stack : null,
        message: error instanceof Error ? error.message : String(error),
        data: { id, title, material, specifications, weight, supplier, date, customer, stockType, location, coilCount }
      })
      
      toast({
        title: "Yazdırma Hatası",
        description: error instanceof Error ? error.message : "QR kod yazdırılırken bir hata oluştu. Lütfen tekrar deneyin.",
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
      const printWindow = window.open("", "_blank", "width=800,height=600")
      if (printWindow) {
        printWindow.document.write(printableHTML)
        printWindow.document.close()
        printWindow.focus()

        // Auto-print after a short delay
        setTimeout(() => {
          printWindow.print()
          
          // Yazdırma dialog kapatıldıktan sonra pencereyi kapat
          setTimeout(() => {
            try {
              printWindow.close()
            } catch (e) {
              console.log("Print window already closed or blocked")
            }
          }, 2000) // 2 saniye sonra kapat
        }, 500)

        // Yazdırma dialog için event listener ekle
        const handleAfterPrint = () => {
          setTimeout(() => {
            try {
              printWindow.close()
            } catch (e) {
              console.log("Print window already closed or blocked")
            }
          }, 500)
        }

        // Yazdırma tamamlandığında veya iptal edildiğinde pencereyi kapat
        printWindow.addEventListener('afterprint', handleAfterPrint)
        
        // Focus kaybedildiğinde de pencereyi kapat (kullanıcı başka yere tıklarsa)
        printWindow.addEventListener('blur', () => {
          setTimeout(() => {
            try {
              if (!printWindow.closed) {
                printWindow.close()
              }
            } catch (e) {
              console.log("Print window already closed or blocked")
            }
          }, 1000)
        })

        toast({
          title: "Bobin QR Etiketleri Hazır",
          description: `${coilCount} adet bobin QR etiketi yazdırma penceresi açıldı, işlem sonrası otomatik kapanacak`,
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

  // Bobin seçim fonksiyonları
  const toggleCoilSelection = (coilNumber: number) => {
    setSelectedCoils(prev => {
      const newSet = new Set(prev)
      if (newSet.has(coilNumber)) {
        newSet.delete(coilNumber)
      } else {
        newSet.add(coilNumber)
      }
      return newSet
    })
  }

  const selectAllCoils = () => {
    setSelectedCoils(new Set(Array.from({ length: coilCount }, (_, i) => i + 1)))
  }

  const deselectAllCoils = () => {
    setSelectedCoils(new Set())
  }

  // Seçili bobinler için QZ Tray yazdırma
  const handleQzPrintSelectedCoils = async () => {
    if (selectedCoils.size === 0) {
      toast({
        title: "Seçim Hatası",
        description: "Yazdırmak için en az bir bobin seçmelisiniz.",
        variant: "destructive",
      })
      return
    }

    setIsGenerating(true)
    try {
      const selectedCoilsArray = Array.from(selectedCoils).sort((a, b) => a - b)
      
      // Her seçili bobin için sırayla yazdır
      for (const coilNumber of selectedCoilsArray) {
        const coilId = `${id}-C${String(coilNumber).padStart(2, '0')}`
        const coilWeight = Math.round((weight / coilCount) * 100) / 100
        
        // Bobin için QR data oluştur
        const coilQRData = QRGenerator.generateQRData({
          id: coilId,
          material,
          cm: parseInt(specifications.split('cm')[0]) || 0,
          mikron: parseInt(specifications.split('x ')[1]) || 0,
          weight: coilWeight,
          supplier,
          date,
          customer,
          stockType,
          location,
          bobinCount: 1
        })

        // ZPL data oluştur
        const zplData = generateQRZPL(
          coilQRData, 
          `${coilId}\n${specifications}\n${coilWeight}kg\n${supplier}\n${customer || ''}\n1 Bobin`
        )

        // QZ Tray ile yazdır
        await new Promise<void>((resolve, reject) => {
          const printWithQz = async () => {
            try {
              const { printWithQz: qzPrint } = await import('@/lib/qz-connection')
              await qzPrint(zplData)
              resolve()
            } catch (error) {
              reject(error)
            }
          }
          printWithQz()
        })

        // Bobinler arası kısa bekleme
        if (coilNumber !== selectedCoilsArray[selectedCoilsArray.length - 1]) {
          await new Promise(resolve => setTimeout(resolve, 500))
        }
      }

      toast({
        title: "QZ Bobin Yazdırma Başarılı ✅",
        description: `${selectedCoils.size} adet seçili bobin etiketi QZ Tray ile yazdırıldı!`,
      })

    } catch (error) {
      console.error("QZ Coil print error:", error)
      toast({
        title: "QZ Bobin Yazdırma Hatası ❌",
        description: error instanceof Error ? error.message : "Bobin etiketleri yazdırılırken hata oluştu",
        variant: "destructive",
      })
    } finally {
      setIsGenerating(false)
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
          {/* QR Code Preview - Güncel ZPL Tasarımına Uygun */}
          <div className="bg-white p-4 rounded-lg border-2 border-dashed border-blue-300">
            <div className="text-center mb-3">
              <Badge variant="outline" className="mb-2 border-blue-500 text-blue-700">
                DEPO ETİKETİ - QR KOD (10x10cm)
              </Badge>
            </div>

            {/* Ana Layout: Sol tarafta bilgiler, sağ tarafta QR kod */}
            <div className="flex items-start gap-4 mb-3">
              {/* Sol taraf: ID ve bilgiler */}
              <div className="flex-1">
                {/* ID - En üstte büyük */}
                <div className="mb-3">
                  <div className="font-mono text-xl font-bold text-gray-800 bg-gray-100 px-3 py-2 rounded border-dashed border-2 border-gray-300">
                    {id}
                  </div>
                </div>

                {/* Özellikler */}
                <div className="mb-3">
                  <div className="font-medium text-sm bg-blue-50 px-3 py-1 rounded border border-blue-200">{specifications}</div>
                </div>

                {/* Diğer bilgiler */}
                <div className="text-xs space-y-1 text-muted-foreground">
                  <div className="flex justify-between">
                    <span>Ağırlık:</span>
                    <span className="font-medium">{weight} kg</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tedarikçi:</span>
                    <span className="font-medium">{supplier}</span>
                  </div>
                  {customer && (
                    <div className="flex justify-between">
                      <span>Müşteri:</span>
                      <span className="font-medium text-blue-600 dark:text-blue-400">{customer}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Sağ taraf: QR kod - Küçük boyut */}
              <div className="flex-shrink-0">
                <QRDisplay data={qrData} width={120} className="border border-gray-200 rounded" />
              </div>
            </div>

            {/* Ayırıcı çizgi - QR koda değmeyecek şekilde */}
            <div className="mb-3">
              <div className="w-3/5 h-px bg-gray-300 border-t border-dashed"></div>
            </div>

            {/* Alt bilgiler */}
            <div className="text-xs space-y-1 text-muted-foreground">
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
              zplData={generateQRZPL(qrData, `${id}\n${specifications}\n${weight}kg\n${supplier}\n${customer || ''}\n${coilCount} Bobin`)}
              label="Yazdır"
              title={`QR Etiket - ${id}`}
              onSuccess={() => toast({
                title: "Yazdırma Başarılı ✅",
                description: "QR kod etiketi başarıyla yazıcıya gönderildi! (10x10cm)",
              })}
              onError={(error) => toast({
                title: "Yazdırma Hatası ❌",
                description: error,
                variant: "destructive",
              })}
              className="w-full"
            />
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

              {/* Bobin QR Önizleme - Güncel ZPL Tasarımına Uygun */}
              <div className="bg-white p-3 rounded border mb-3">
                <div className="flex items-start gap-3">
                  {/* Sol taraf: Bobin bilgileri */}
                  <div className="flex-1">
                    <div className="font-mono text-sm font-bold text-gray-800 mb-2">
                      {id}-C01
                    </div>
                    <div className="text-xs bg-blue-50 px-2 py-1 rounded border border-blue-200 mb-2">
                      {specifications}
                    </div>
                    <div className="text-xs space-y-1 text-muted-foreground">
                      <div>Bobin 1/{coilCount}</div>
                      <div>~{Math.round((weight / coilCount) * 100) / 100} kg</div>
                    </div>
                  </div>
                  
                  {/* Sağ taraf: Küçük QR kod */}
                  <div className="flex-shrink-0">
                    <QRDisplay 
                      data={QRGenerator.generateQRData({
                        id: `${id}-C01`,
                        material,
                        cm: parseInt(specifications.split('cm')[0]) || 0,
                        mikron: parseInt(specifications.split('x ')[1]) || 0,
                        weight: Math.round((weight / coilCount) * 100) / 100,
                        supplier,
                        date,
                        customer,
                        stockType,
                        location,
                        bobinCount: 1
                      })} 
                      width={64} 
                      className="border border-gray-200 rounded" 
                    />
                  </div>
                </div>
                
                {/* Ayırıcı çizgi */}
                <div className="mt-2">
                  <div className="w-3/5 h-px bg-gray-300 border-t border-dashed"></div>
                </div>
              </div>

              <div className="text-xs space-y-1 text-muted-foreground mb-3">
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

            </div>

            <div className="space-y-3">
              {/* Bobin Seçim Sistemi */}
              <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded border">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-xs font-medium text-gray-700 dark:text-gray-300">
                    Yazdırılacak Bobinleri Seçin: ({selectedCoils.size}/{coilCount})
                  </div>
                  <div className="flex gap-1">
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      onClick={selectAllCoils}
                      className="h-6 px-2 text-xs"
                    >
                      Tümü
                    </Button>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      onClick={deselectAllCoils}
                      className="h-6 px-2 text-xs"
                    >
                      Hiçbiri
                    </Button>
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {Array.from({ length: coilCount }, (_, i) => {
                    const coilNumber = i + 1
                    const coilNum = String(coilNumber).padStart(2, '0')
                    const isSelected = selectedCoils.has(coilNumber)
                    const isHighlighted = highlightedCoil === coilNum
                    return (
                      <button
                        key={i}
                        type="button"
                        className={`text-xs px-3 py-2 rounded text-center font-mono cursor-pointer border-2 transition-all ${
                          isSelected
                            ? isHighlighted
                              ? 'bg-green-200 dark:bg-green-800 text-green-800 dark:text-green-200 font-bold border-green-400'
                              : 'bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200 border-blue-400'
                            : 'bg-white dark:bg-gray-700 text-gray-400 dark:text-gray-500 border-gray-300 hover:border-gray-400'
                        }`}
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          toggleCoilSelection(coilNumber)
                        }}
                      >
                        C{coilNum}
                        {isSelected && <span className="ml-1">✓</span>}
                      </button>
                    )
                  })}
                </div>
                <div className="mt-2 text-xs text-muted-foreground">
                  💡 Seçili bobinler mavi, vurgulanan bobin yeşil renkte. Tıklayarak seçimi değiştirebilirsiniz.
                </div>
              </div>

              {/* Yazdırma Seçenekleri */}
              <div className="flex justify-center">
                {/* QZ Tray Yazdırma - Seçimli */}
                <Button 
                  onClick={handleQzPrintSelectedCoils} 
                  disabled={isGenerating || selectedCoils.size === 0}
                  className="w-full"
                  size="sm"
                >
                  <Printer className="h-4 w-4 mr-2" />
                  {isGenerating ? "Yazdırılıyor..." : `Yazdır (${selectedCoils.size})`}
                </Button>
              </div>
            </div>

            <div className="text-xs text-muted-foreground text-center">
              Her bobine ayrı QR etiket yapıştırarak tekil takip yapabilirsiniz
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
