"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Printer, Eye } from "lucide-react"
import { QzPrintButton, generateTestZPL } from "./qz-print-button"

export function DynamicPrinterTest() {
  const [debug, setDebug] = useState(true)

  // 🎯 RAW HTML: Absolutely no CSS
  const generateBasicLabel = () => {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Raw HTML Test</title>
        </head>
        <body ${debug ? 'style="border: 10px solid red;"' : ''}>
          <h1>RAW HTML TEST</h1>
          <h2>DK250121G01</h2>
          <table border="1" width="200" height="200">
            <tr>
              <td align="center">
                <b>QR CODE AREA</b><br/>
                200x200 px
              </td>
            </tr>
          </table>
          <p><b>RAW HTML - No CSS Constraints</b></p>
          <p>Zebra Driver Native Size Test</p>
        </body>
      </html>
    `
  }

  const handleBasicPrint = () => {
    const printWindow = window.open("", "_blank")
    if (printWindow) {
      printWindow.document.write(generateBasicLabel())
      printWindow.document.close()
      printWindow.focus()
      setTimeout(() => printWindow.print(), 500)
    }
  }

  const handleBasicPreview = () => {
    const previewWindow = window.open("", "_blank")
    if (previewWindow) {
      previewWindow.document.write(generateBasicLabel())
      previewWindow.document.close()
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>🎯 BASIC 10x10cm Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          
          <div className="bg-green-100 border-2 border-green-500 p-4 rounded-lg">
            <h4 className="font-medium text-green-900 mb-2 text-lg">
              🎯 BRILLIANT IDEA! ZEBRA BYPASS - DIRECT 10x10CM GENERATION!
            </h4>
            <div className="bg-white p-3 rounded border-l-4 border-green-600 mb-3">
              <p className="text-sm text-green-800 font-medium mb-2">
                <strong>ZEBRA DRIVER'I BYPASS EDELIM!</strong>
              </p>
              <ul className="text-sm text-green-700 space-y-1">
                <li>✅ <strong>PDF Generation</strong>: Perfect 10x10cm square</li>
                <li>✅ <strong>Canvas/SVG</strong>: Pixel-perfect image</li>
                <li>✅ <strong>Normal Printer</strong>: Canon, HP, Brother test</li>
                <li>✅ <strong>Manual Print</strong>: PDF → Any printer</li>
                <li>🎯 <strong>Zebra ignored</strong>: Hardware constraint bypass!</li>
              </ul>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-300 p-4 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-3">
              🚀 ZEBRA BYPASS SOLUTIONS
            </h4>
            
            <div className="grid grid-cols-1 gap-3">
              <Button
                className="w-full"
                variant="default"
                onClick={() => {
                  const pdfWindow = window.open('', '_blank')
                  if (pdfWindow) {
                    pdfWindow.document.write(`
                      <!DOCTYPE html>
                      <html><head><title>Perfect 10x10cm PDF</title>
                      <style>
                        @page { size: 10cm 10cm; margin: 0; }
                        body { margin: 0; padding: 1cm; font-family: Arial; border: 5px solid red; }
                      </style></head>
                      <body>
                        <h1>PERFECT SQUARE</h1>
                        <h2>DK250121G01</h2>
                        <table border="2" width="200" height="200" style="margin: 1cm auto;">
                          <tr><td align="center"><b>QR CODE<br/>PERFECT SQUARE</b></td></tr>
                        </table>
                        <p><b>PDF Generation - Any Printer Compatible</b></p>
                      </body></html>
                    `)
                    pdfWindow.document.close()
                  }
                }}
              >
                📄 PDF Perfect Square (Any Printer)
              </Button>
              
              <Button
                className="w-full"
                variant="outline"
                onClick={() => {
                  alert("Canvas ile 10x10cm image generate → Download → Manuel print any printer")
                }}
              >
                🖼️ Canvas Image Generation
              </Button>

              <Button
                className="w-full"
                variant="secondary"
                onClick={() => {
                  alert("Normal home/office printer (Canon, HP, Brother) ile 10x10cm test")
                }}
              >
                🖨️ Normal Printer Test
              </Button>
            </div>

            <div className="bg-blue-100 p-3 rounded mt-3 text-sm text-blue-800">
              <strong>Strategy:</strong> Generate perfect 10x10cm content → Use ANY printer except Zebra ZD220!
            </div>
          </div>

          <div className="flex items-center justify-between">
            <Label>🎨 Debug Red Border</Label>
            <Switch
              checked={debug}
              onCheckedChange={setDebug}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Button onClick={handleBasicPreview} variant="outline" className="w-full">
              <Eye className="h-4 w-4 mr-2" />
              Basic Preview
            </Button>
            <Button onClick={handleBasicPrint} className="w-full">
              <Printer className="h-4 w-4 mr-2" />
              Basic 10x10cm Print
            </Button>
            <QzPrintButton
              zplData={generateTestZPL("DYNAMIC TEST LABEL")}
              label="QZ Test Yazdır"
              onSuccess={() => alert("QZ Test yazdırma başarılı!")}
              onError={(error) => alert(`QZ Test hatası: ${error}`)}
            />
          </div>

          <div className="bg-yellow-50 border border-yellow-300 p-4 rounded-lg">
            <h4 className="font-medium text-yellow-900 mb-3">
              🛠️ PHYSICAL CONSTRAINT SOLUTIONS
            </h4>
            
            <div className="space-y-3">
              <div className="bg-white p-3 rounded border-l-4 border-yellow-500">
                <h5 className="font-medium text-yellow-800 mb-2">1. 📋 Label Stock Orientation</h5>
                <p className="text-sm text-yellow-700">
                  <strong>Etiket kağıdını 90° çevirin!</strong><br/>
                  Zebra'da kağıt yönü → Portrait yerine Landscape olarak yerleştirin
                </p>
              </div>

              <div className="bg-white p-3 rounded border-l-4 border-blue-500">
                <h5 className="font-medium text-blue-800 mb-2">2. 🔧 Driver Mode Change</h5>
                <p className="text-sm text-blue-700">
                  <strong>ZPL → EPL mode:</strong><br/>
                  Windows → Devices → ZDesigner → Properties → Advanced → Print Processor: "EPL Page Mode"
                </p>
              </div>

              <div className="bg-white p-3 rounded border-l-4 border-green-500">
                <h5 className="font-medium text-green-800 mb-2">3. 🔄 Print Spooler Restart</h5>
                <p className="text-sm text-green-700">
                  <strong>Windows Service restart:</strong><br/>
                  Windows + R → "services.msc" → "Print Spooler" → Restart
                </p>
              </div>

              <div className="bg-white p-3 rounded border-l-4 border-purple-500">
                <h5 className="font-medium text-purple-800 mb-2">4. 🎯 Alternative Test</h5>
                <p className="text-sm text-purple-700">
                  <strong>Başka yazıcı test:</strong><br/>
                  Normal yazıcıda (Canon, HP, etc.) 10x10cm test → Kare çıkıyor mu?
                </p>
              </div>
            </div>
          </div>

        </CardContent>
      </Card>
    </div>
  )
}