"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { QRGenerator } from "@/lib/qr-generator"
import { ArrowLeft, Printer, Eye, Download, TestTube } from "lucide-react"

export default function PrinterTestPage() {
  const [testData, setTestData] = useState({
    id: "DK250121G01",
    material: "Test Malzeme",
    specifications: "100cm x 50μ",
    weight: 1250,
    supplier: "Test Tedarikçi",
    date: "2025-01-21",
    customer: "Test Müşteri",
    location: "A1-B2-C3"
  })

  const handleInputChange = (field: string, value: string | number) => {
    setTestData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handlePrintTest = async () => {
    try {
      const printableHTML = await QRGenerator.generatePrintableLabel({
        id: testData.id,
        title: "Test Etiketi",
        material: testData.material,
        specifications: testData.specifications,
        weight: testData.weight,
        supplier: testData.supplier,
        date: testData.date,
        customer: testData.customer,
        location: testData.location,
        bobinCount: 1
      })

      const printWindow = window.open("", "_blank")
      if (printWindow) {
        printWindow.document.write(printableHTML)
        printWindow.document.close()
        printWindow.focus()

        setTimeout(() => {
          printWindow.print()
        }, 500)
      }
    } catch (error) {
      console.error("Print test error:", error)
    }
  }

  const handlePreviewTest = async () => {
    try {
      const printableHTML = await QRGenerator.generatePrintableLabel({
        id: testData.id,
        title: "Test Etiketi",
        material: testData.material,
        specifications: testData.specifications,
        weight: testData.weight,
        supplier: testData.supplier,
        date: testData.date,
        customer: testData.customer,
        location: testData.location,
        bobinCount: 1
      })

      const previewWindow = window.open("", "_blank")
      if (previewWindow) {
        previewWindow.document.write(printableHTML)
        previewWindow.document.close()
      }
    } catch (error) {
      console.error("Preview test error:", error)
    }
  }

  const handleDownloadTest = async () => {
    try {
      const printableHTML = await QRGenerator.generatePrintableLabel({
        id: testData.id,
        title: "Test Etiketi",
        material: testData.material,
        specifications: testData.specifications,
        weight: testData.weight,
        supplier: testData.supplier,
        date: testData.date,
        customer: testData.customer,
        location: testData.location,
        bobinCount: 1
      })

      const blob = new Blob([printableHTML], { type: "text/html" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `test-etiket-${testData.id}.html`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error("Download test error:", error)
    }
  }

  const generateRandomTestData = () => {
    const materials = ["PE Film", "PP Film", "PET Film", "Alüminyum Folyo", "Kraft Kağıt"]
    const suppliers = ["Tedarikçi A", "Tedarikçi B", "Tedarikçi C", "Global Supplier"]
    const customers = ["Müşteri X", "Müşteri Y", "Müşteri Z", ""]
    const locations = ["A1-B2-C3", "D4-E5-F6", "G7-H8-I9", "J10-K11-L12"]
    
    const randomMaterial = materials[Math.floor(Math.random() * materials.length)]
    const randomSupplier = suppliers[Math.floor(Math.random() * suppliers.length)]
    const randomCustomer = customers[Math.floor(Math.random() * customers.length)]
    const randomLocation = locations[Math.floor(Math.random() * locations.length)]
    
    const randomCm = Math.floor(Math.random() * 200) + 50 // 50-250cm
    const randomMikron = Math.floor(Math.random() * 100) + 20 // 20-120μ
    const randomWeight = Math.floor(Math.random() * 2000) + 500 // 500-2500kg
    
    const newId = QRGenerator.generateWarehouseId(randomCustomer)
    
    setTestData({
      id: newId,
      material: randomMaterial,
      specifications: `${randomCm}cm x ${randomMikron}μ`,
      weight: randomWeight,
      supplier: randomSupplier,
      date: new Date().toISOString().split('T')[0],
      customer: randomCustomer,
      location: randomLocation
    })
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="sm" onClick={() => window.history.back()} className="p-2">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Yazıcı Test Sayfası</h1>
            <p className="text-sm text-muted-foreground">10cm x 10cm QR kod etiketlerini test edin</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Test Data Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TestTube className="h-5 w-5" />
                Test Verisi
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="id">Ürün ID</Label>
                <Input
                  id="id"
                  value={testData.id}
                  onChange={(e) => handleInputChange("id", e.target.value)}
                  className="font-mono"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="material">Malzeme</Label>
                <Input
                  id="material"
                  value={testData.material}
                  onChange={(e) => handleInputChange("material", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="specifications">Boyutlar</Label>
                <Input
                  id="specifications"
                  value={testData.specifications}
                  onChange={(e) => handleInputChange("specifications", e.target.value)}
                  placeholder="100cm x 50μ"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="weight">Ağırlık (kg)</Label>
                <Input
                  id="weight"
                  type="number"
                  value={testData.weight}
                  onChange={(e) => handleInputChange("weight", parseInt(e.target.value) || 0)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="supplier">Tedarikçi</Label>
                <Input
                  id="supplier"
                  value={testData.supplier}
                  onChange={(e) => handleInputChange("supplier", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="customer">Müşteri (Opsiyonel)</Label>
                <Input
                  id="customer"
                  value={testData.customer}
                  onChange={(e) => handleInputChange("customer", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Lokasyon</Label>
                <Input
                  id="location"
                  value={testData.location}
                  onChange={(e) => handleInputChange("location", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="date">Tarih</Label>
                <Input
                  id="date"
                  type="date"
                  value={testData.date}
                  onChange={(e) => handleInputChange("date", e.target.value)}
                />
              </div>

              <Button onClick={generateRandomTestData} variant="outline" className="w-full">
                🎲 Rastgele Test Verisi Oluştur
              </Button>
            </CardContent>
          </Card>

          {/* Test Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Test İşlemleri</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                  📏 Etiket Boyutları
                </h3>
                <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                  <li>• <strong>Boyut:</strong> 10cm x 10cm</li>
                  <li>• <strong>QR Kod:</strong> 4.2cm x 4.2cm</li>
                  <li>• <strong>Kenar Boşluğu:</strong> 0.3cm</li>
                  <li>• <strong>Logo:</strong> DEKA text-based</li>
                </ul>
              </div>

              <div className="bg-green-50 dark:bg-green-950/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
                <h3 className="font-semibold text-green-900 dark:text-green-100 mb-2">
                  🖨️ Yazıcı Ayarları
                </h3>
                <ul className="text-sm text-green-800 dark:text-green-200 space-y-1">
                  <li>• <strong>Kağıt Boyutu:</strong> Özel (10cm x 10cm)</li>
                  <li>• <strong>Kenar Boşlukları:</strong> 0mm</li>
                  <li>• <strong>Ölçekleme:</strong> %100</li>
                  <li>• <strong>Renk:</strong> Siyah-Beyaz</li>
                </ul>
              </div>

              <div className="grid grid-cols-1 gap-3">
                <Button onClick={handlePreviewTest} variant="outline" className="w-full">
                  <Eye className="h-4 w-4 mr-2" />
                  Önizleme
                </Button>

                <Button onClick={handleDownloadTest} variant="outline" className="w-full">
                  <Download className="h-4 w-4 mr-2" />
                  HTML İndir
                </Button>

                <Button onClick={handlePrintTest} className="w-full">
                  <Printer className="h-4 w-4 mr-2" />
                  Test Yazdır
                </Button>
              </div>

              <div className="bg-yellow-50 dark:bg-yellow-950/20 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800">
                <h3 className="font-semibold text-yellow-900 dark:text-yellow-100 mb-2">
                  ⚠️ Test Notları
                </h3>
                <ul className="text-sm text-yellow-800 dark:text-yellow-200 space-y-1">
                  <li>• İlk yazdırmada boyutları kontrol edin</li>
                  <li>• QR kod okunabilirliğini test edin</li>
                  <li>• Yazıcı ayarlarını kaydedin</li>
                  <li>• Farklı kağıt türlerini deneyin</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}