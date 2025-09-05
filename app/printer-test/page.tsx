"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Printer, Settings2, Shield, ShieldOff, CheckCircle, XCircle, AlertCircle } from "lucide-react"
import { QzPrintButton, generateTestZPL, generateQRZPL, generateProductLabelZPL, generateShippingLabelZPL } from "@/components/qz-print-button"
import { useToast } from "@/hooks/use-toast"
import { ensureQzConnected, safeDisconnect, getQzPrinters } from "@/lib/qz-connection"

interface StatusCheck {
  name: string
  status: 'success' | 'error' | 'warning' | 'pending'
  message: string
}

export default function PrinterTestPage() {
  const { toast } = useToast()
  const [testText, setTestText] = useState("Türkçe Test: çğıİöşü")
  const [printerName, setPrinterName] = useState("")
  const [insecureMode, setInsecureMode] = useState(true)
  const [isChecking, setIsChecking] = useState(false)
  const [statusChecks, setStatusChecks] = useState<StatusCheck[]>([])
  const [availablePrinters, setAvailablePrinters] = useState<string[]>([])
  const [labelType, setLabelType] = useState("test")
  const [productName, setProductName] = useState("DEKA Plastik Ürünü")
  const [productCode, setProductCode] = useState("DKP-001")
  const [orderNumber, setOrderNumber] = useState("SİP-2025-001")
  const [customerName, setCustomerName] = useState("Müşteri Adı Soyadı")
  const [qrData, setQrData] = useState("https://takip.dekaplastik.com/sipariş/12345")

  // QZ Tray durumunu kontrol et - Yeni timeout'lu sistem
  const checkQzStatus = async () => {
    setIsChecking(true)
    const checks: StatusCheck[] = []

    try {
      // 1. API Endpoint Kontrolü
      checks.push({ name: "API Endpoint", status: 'pending', message: "Kontrol ediliyor..." })
      setStatusChecks([...checks])

      try {
        const response = await fetch('/api/qz-sign', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ data: 'test' }),
        })
        
        if (response.ok) {
          checks[0] = { name: "API Endpoint", status: 'success', message: "QZ Tray API endpoint çalışıyor" }
        } else {
          checks[0] = { name: "API Endpoint", status: 'error', message: "API endpoint hatası" }
          setStatusChecks([...checks])
          return
        }
      } catch (error) {
        checks[0] = { name: "API Endpoint", status: 'error', message: "API endpoint'e erişilemiyor" }
        setStatusChecks([...checks])
        return
      }
      setStatusChecks([...checks])

      // 2. QZ Tray Tam Bağlantı Testi (timeout'lu)
      checks.push({ name: "QZ Tray Bağlantısı", status: 'pending', message: "QZ Tray'e bağlanılıyor (timeout: 8s)..." })
      setStatusChecks([...checks])

      try {
        await ensureQzConnected()
        checks[1] = { name: "QZ Tray Bağlantısı", status: 'success', message: "QZ Tray bağlantısı başarılı (timeout korumalı)" }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error)
        if (errorMessage.includes('timeout')) {
          checks[1] = { name: "QZ Tray Bağlantısı", status: 'error', message: `Bağlantı zaman aşımı: ${errorMessage}` }
        } else {
          checks[1] = { name: "QZ Tray Bağlantısı", status: 'error', message: `Bağlantı hatası: ${errorMessage}` }
        }
        setStatusChecks([...checks])
        return
      }
      setStatusChecks([...checks])

      // 3. Yazıcı Kontrolü (timeout'lu)
      checks.push({ name: "Yazıcı Kontrolü", status: 'pending', message: "Yazıcılar aranıyor (timeout: 5s)..." })
      setStatusChecks([...checks])

      try {
        const printers = await getQzPrinters()
        
        if (printers.length > 0) {
          // Yazıcıları state'e kaydet
          setAvailablePrinters(printers)
          checks[2] = { name: "Yazıcı Kontrolü", status: 'success', message: `${printers.length} yazıcı bulundu: ${printers.slice(0, 2).join(', ')}${printers.length > 2 ? '...' : ''}` }
        } else {
          setAvailablePrinters([])
          checks[2] = { name: "Yazıcı Kontrolü", status: 'warning', message: "Hiç yazıcı bulunamadı" }
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error)
        setAvailablePrinters([])
        checks[2] = { name: "Yazıcı Kontrolü", status: 'error', message: `Yazıcı listesi hatası: ${errorMessage}` }
      }
      setStatusChecks([...checks])

      // 4. Bağlantı Kapatma
      checks.push({ name: "Bağlantı Kapatma", status: 'pending', message: "Bağlantı kapatılıyor..." })
      setStatusChecks([...checks])

      try {
        await safeDisconnect()
        checks[3] = { name: "Bağlantı Kapatma", status: 'success', message: "QZ Tray bağlantısı güvenli şekilde kapatıldı" }
      } catch (error) {
        checks[3] = { name: "Bağlantı Kapatma", status: 'warning', message: "Bağlantı kapatma uyarısı" }
      }
      setStatusChecks([...checks])

      // Genel sonuç
      const hasErrors = checks.some(check => check.status === 'error')
      if (!hasErrors) {
        toast({
          title: "QZ Tray Kontrolü Başarılı ✅",
          description: "Tüm kontroller başarıyla tamamlandı. Timeout koruması aktif. Yazdırma testi yapabilirsiniz.",
        })
      } else {
        toast({
          title: "QZ Tray Kontrolü Tamamlandı ⚠️",
          description: "Bazı kontrollerde sorun var. Timeout mesajları hangi adımda takıldığını gösterir.",
          variant: "destructive",
        })
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      toast({
        title: "Kontrol Hatası",
        description: `QZ Tray kontrolü hatası: ${errorMessage}`,
        variant: "destructive",
      })
    } finally {
      setIsChecking(false)
    }
  }

  // Seçilen etiket türüne göre ZPL kodunu oluştur
  const generateZPLData = () => {
    switch (labelType) {
      case "test":
        return generateTestZPL(testText)
      case "qr":
        return generateQRZPL(qrData, testText)
      case "product":
        return generateProductLabelZPL(productName, productCode, qrData)
      case "shipping":
        return generateShippingLabelZPL(orderNumber, customerName, qrData)
      default:
        return generateTestZPL(testText)
    }
  }

  // Etiket türüne göre buton etiketi
  const getPrintButtonLabel = () => {
    switch (labelType) {
      case "test":
        return "📄 Test Etiketi Yazdır"
      case "qr":
        return "🔲 QR Kod Etiketi Yazdır"
      case "product":
        return "📦 Ürün Etiketi Yazdır"
      case "shipping":
        return "🚚 Kargo Etiketi Yazdır"
      default:
        return "🖨️ Yazdır"
    }
  }

  const handleSuccess = () => {
    const labelNames = {
      test: "Test etiketi",
      qr: "QR kod etiketi",
      product: "Ürün etiketi",
      shipping: "Kargo etiketi"
    }
    
    toast({
      title: "Yazdırma Başarılı ✅",
      description: `${labelNames[labelType as keyof typeof labelNames]} başarıyla yazıcıya gönderildi! (10x10cm)`,
    })
  }

  const handleError = (error: string) => {
    toast({
      title: "Yazdırma Hatası ❌",
      description: error,
      variant: "destructive",
    })
  }

  const getStatusIcon = (status: StatusCheck['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />
      case 'pending':
        return <div className="h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 max-w-2xl">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="sm" onClick={() => window.history.back()} className="p-2">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Printer className="h-6 w-6" />
              QZ Tray Test
            </h1>
            <p className="text-sm text-muted-foreground">
              QZ Tray bağlantısını test edin ve yazdırma yapın
            </p>
          </div>
        </div>

        {/* QZ Tray Kontrol */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings2 className="h-5 w-5" />
              QZ Tray Durum Kontrolü
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={checkQzStatus} 
              disabled={isChecking}
              className="w-full mb-4"
            >
              <Settings2 className="h-4 w-4 mr-2" />
              {isChecking ? 'Kontrol Ediliyor...' : 'Durum Kontrolü Yap'}
            </Button>

            {/* Durum Sonuçları */}
            {statusChecks.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Kontrol Sonuçları:</h4>
                {statusChecks.map((check, index) => (
                  <div key={index} className="flex items-center gap-3 p-2 rounded border">
                    {getStatusIcon(check.status)}
                    <div className="flex-1">
                      <div className="font-medium text-sm">{check.name}</div>
                      <div className="text-xs text-muted-foreground">{check.message}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Yazdırma Testi */}
        <Card>
          <CardHeader>
            <CardTitle>🖨️ Yazdırma Testi</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <Label htmlFor="labelType">Etiket Türü (10x10cm için optimize edilmiş)</Label>
                <Select value={labelType} onValueChange={setLabelType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Etiket türü seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="test">📄 Basit Test Etiketi</SelectItem>
                    <SelectItem value="qr">🔲 QR Kod Etiketi</SelectItem>
                    <SelectItem value="product">📦 Ürün Etiketi</SelectItem>
                    <SelectItem value="shipping">🚚 Kargo Etiketi</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Basit Test Etiketi */}
              {labelType === "test" && (
                <div className="space-y-2">
                  <Label htmlFor="testText">Test Metni</Label>
                  <Input
                    id="testText"
                    value={testText}
                    onChange={(e) => setTestText(e.target.value)}
                    placeholder="Yazdırılacak test metni..."
                  />
                </div>
              )}

              {/* QR Kod Etiketi */}
              {labelType === "qr" && (
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="qrData">QR Kod Verisi</Label>
                    <Input
                      id="qrData"
                      value={qrData}
                      onChange={(e) => setQrData(e.target.value)}
                      placeholder="QR kodda yer alacak veri (URL, metin vb.)"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="qrText">QR Etiket Metni</Label>
                    <Input
                      id="qrText"
                      value={testText}
                      onChange={(e) => setTestText(e.target.value)}
                      placeholder="QR kodun yanında görünecek metin"
                    />
                  </div>
                </div>
              )}

              {/* Ürün Etiketi */}
              {labelType === "product" && (
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="productName">Ürün Adı</Label>
                    <Input
                      id="productName"
                      value={productName}
                      onChange={(e) => setProductName(e.target.value)}
                      placeholder="Ürün adı"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="productCode">Ürün Kodu</Label>
                    <Input
                      id="productCode"
                      value={productCode}
                      onChange={(e) => setProductCode(e.target.value)}
                      placeholder="Ürün kodu"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="productQrData">QR Takip Verisi</Label>
                    <Input
                      id="productQrData"
                      value={qrData}
                      onChange={(e) => setQrData(e.target.value)}
                      placeholder="Ürün takip için QR kod verisi"
                    />
                  </div>
                </div>
              )}

              {/* Kargo Etiketi */}
              {labelType === "shipping" && (
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="orderNumber">Sipariş Numarası</Label>
                    <Input
                      id="orderNumber"
                      value={orderNumber}
                      onChange={(e) => setOrderNumber(e.target.value)}
                      placeholder="Sipariş numarası"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="customerName">Müşteri Adı</Label>
                    <Input
                      id="customerName"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Müşteri adı"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="shippingQrData">Kargo Takip Verisi</Label>
                    <Input
                      id="shippingQrData"
                      value={qrData}
                      onChange={(e) => setQrData(e.target.value)}
                      placeholder="Kargo takip için QR kod verisi"
                    />
                  </div>
                </div>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="printerName">Yazıcı Seçimi</Label>
                {availablePrinters.length > 0 ? (
                  <Select value={printerName} onValueChange={setPrinterName}>
                    <SelectTrigger>
                      <SelectValue placeholder="Yazıcı seçin (boş bırakırsanız varsayılan kullanılır)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__auto__">🎯 Otomatik (Varsayılan/İlk Yazıcı)</SelectItem>
                      {availablePrinters.map((printer, index) => (
                        <SelectItem key={index} value={printer}>
                          🖨️ {printer}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="p-3 bg-gray-50 dark:bg-gray-900/20 rounded border text-sm text-muted-foreground">
                    ℹ️ Önce "Durum Kontrolü Yap" butonuna tıklayarak yazıcıları listeleyin
                  </div>
                )}
                
                {availablePrinters.length > 0 && (
                  <div className="p-2 bg-blue-50 dark:bg-blue-950/20 rounded border border-blue-200 text-xs text-blue-700 dark:text-blue-300">
                    ✅ {availablePrinters.length} yazıcı bulundu. Seçim yapabilirsiniz.
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900/20 rounded border">
                <div className="flex items-center gap-2">
                  {insecureMode ? (
                    <ShieldOff className="h-4 w-4 text-orange-500" />
                  ) : (
                    <Shield className="h-4 w-4 text-green-500" />
                  )}
                  <Label className="text-sm">
                    Geliştirme Modu (Güvenli Olmayan)
                  </Label>
                </div>
                <Switch
                  checked={insecureMode}
                  onCheckedChange={setInsecureMode}
                />
              </div>

              {insecureMode && (
                <div className="p-3 bg-orange-50 dark:bg-orange-950/20 border border-orange-200 rounded text-sm text-orange-700 dark:text-orange-300">
                  ⚠️ Geliştirme modu: SSL sertifikası gerektirmez, test için daha kolay.
                </div>
              )}
            </div>

            <QzPrintButton
              zplData={generateZPLData()}
              label={getPrintButtonLabel()}
              printerName={printerName === "__auto__" ? undefined : printerName || undefined}
              insecureMode={insecureMode}
              onSuccess={handleSuccess}
              onError={handleError}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
