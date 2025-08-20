"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, Save, X, Calculator, ExternalLink } from "lucide-react"
import { ordersRepo } from "@/lib/orders-repo"
import { settingsRepo } from "@/lib/settings-repo"
import { pricingRepo } from "@/lib/pricing-repo"
import { warehouseRepo } from "@/lib/warehouse-repo"
import { useToast } from "@/hooks/use-toast"
import { StockAlertCard } from "@/components/stock-alert-card"
import type { OrderStatus } from "@/types/order"
import type { WarehouseItem } from "@/types/warehouse"

export default function NewOrderPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [suppliers, setSuppliers] = useState<string[]>([])
  const [requesters, setRequesters] = useState<string[]>([])
  const [customPrice, setCustomPrice] = useState(false)
  const [calculatedPrice, setCalculatedPrice] = useState<number | null>(null)
  const [pricePerUnit, setPricePerUnit] = useState("")
  const [totalPrice, setTotalPrice] = useState("")
  const [currency, setCurrency] = useState("EUR")
  const [isAddingPrice, setIsAddingPrice] = useState(false)
  
  // Stock control states
  const [availableStock, setAvailableStock] = useState<WarehouseItem[]>([])
  const [isCheckingStock, setIsCheckingStock] = useState(false)
  const [showStockAlert, setShowStockAlert] = useState(false)
  const [originalQuantity, setOriginalQuantity] = useState<number | null>(null)
  const [isOptimized, setIsOptimized] = useState(false)

  console.log("[v0] NewOrderPage component rendering")

  const [form, setForm] = useState({
    requester: "",
    supplier: "",
    customer: "",
    status: "Requested" as OrderStatus,
    material: "",
    cm: "",
    mikron: "",
    bobin_sayisi: "",
    description: "",
    quantity: "",
    unit: "KG",
    ordered_date: "",
    eta_date: "",
    notes: "",
    tags: "",
  })

  const statusOptions: Record<OrderStatus, string> = {
    "Requested": "Talep Edildi",
    "Ordered": "Sipariş Verildi", 
    "Delivered": "Teslim Edildi",
    "Cancelled": "İptal Edildi",
    "Return": "İade",
  }

  useEffect(() => {
    console.log("[v0] Price calculation effect triggered", {
      customPrice,
      material: form.material,
      quantity: form.quantity,
      supplier: form.supplier,
    })

    const calculatePrice = async () => {
      if (!customPrice && form.material && form.supplier) {
        try {
          console.log("[v0] Calculating price for:", form.supplier, form.material, form.quantity)
          const priceResult = await pricingRepo.calculateOrderPrice(
            form.supplier,
            form.material,
            form.quantity ? Number.parseFloat(form.quantity) : 1, // Use 1 as default for price calculation
          )

          console.log("[v0] Price calculation result:", priceResult)
          if (priceResult) {
            setCalculatedPrice(priceResult.pricePerKg)
            setCurrency(priceResult.currency)
          } else {
            setCalculatedPrice(null)
          }
        } catch (error) {
          console.error("[v0] Error calculating price:", error)
          setCalculatedPrice(null)
        }
      } else {
        setCalculatedPrice(null)
      }
    }

    calculatePrice()
  }, [form.material, form.supplier, form.quantity, customPrice]) // include quantity to recalc total properly

  useEffect(() => {
    console.log("[v0] Loading settings...")

    const loadSettings = async () => {
      try {
        const [suppliersData, requestersData] = await Promise.all([
          settingsRepo.getSuppliers(),
          settingsRepo.getRequesters(),
        ])

        console.log("[v0] Settings loaded:", { suppliersData, requestersData })
        setSuppliers(suppliersData || [])
        setRequesters(requestersData || [])

        if (requestersData && requestersData.length > 0 && !form.requester) {
          setForm((prev) => ({ ...prev, requester: requestersData[0] }))
        }
        if (suppliersData && suppliersData.length > 0 && !form.supplier) {
          setForm((prev) => ({ ...prev, supplier: suppliersData[0] }))
        }
      } catch (error) {
        console.error("[v0] Error loading settings:", error)
      }
    }

    loadSettings()
  }, [])

  const handleSave = async () => {
    if (!form.requester || !form.supplier || !form.customer || !form.material || !form.quantity) {
      toast({
        title: "Eksik Bilgi",
        description: "İstek sahibi, tedarikçi, müşteri, malzeme ve miktar alanları zorunludur.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    
    const orderData = {
      requester: form.requester,
      supplier: form.supplier,
      customer: form.customer || undefined,
      status: form.status,
      material: form.material || undefined,
      cm: form.cm ? Number.parseInt(form.cm) : undefined,
      mikron: form.mikron ? Number.parseInt(form.mikron) : undefined,
      bobin_sayisi: form.bobin_sayisi ? Number.parseInt(form.bobin_sayisi) : undefined,
      description: form.description || undefined,
      quantity: Number.parseFloat(form.quantity),
      unit: form.unit,
      ordered_date: form.ordered_date || undefined,
      eta_date: form.eta_date || undefined,
      notes: form.notes || undefined,
      tags: form.tags
        ? form.tags
            .split(",")
            .map((tag) => tag.trim())
            .filter(Boolean)
        : undefined,
      created_at: new Date().toISOString(),
      custom_price: customPrice,
      price_per_unit: customPrice ? (pricePerUnit ? Number.parseFloat(pricePerUnit) : undefined) : calculatedPrice || undefined,
      total_price: customPrice
        ? totalPrice
          ? Number.parseFloat(totalPrice)
          : undefined
        : calculatedPrice && form.quantity
          ? calculatedPrice * Number.parseFloat(form.quantity)
          : undefined,
      currency: currency,
    }

    try {
      console.log("[v0] About to create order with data:", orderData)
      const createdOrder = await ordersRepo.create(orderData)
      console.log("[v0] Order created successfully:", createdOrder)

      toast({
        title: "Sipariş Oluşturuldu",
        description: "Yeni sipariş başarıyla kaydedildi.",
      })

      // Redirect to the created order's detail page
      router.push(`/orders/${createdOrder.id}`)
    } catch (error) {
      console.error("[v0] Detailed error creating order:", error)
      console.error("[v0] Order data that failed:", orderData)
      toast({
        title: "Hata",
        description: `Sipariş oluşturulurken bir hata oluştu: ${error instanceof Error ? error.message : 'Bilinmeyen hata'}`,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleQuickAddPrice = async () => {
    if (!form.supplier || !form.material) {
      toast({
        title: "Eksik Bilgi",
        description: "Tedarikçi ve malzeme seçimi gerekli.",
        variant: "destructive",
      })
      return
    }

    setIsAddingPrice(true)
    try {
      // Add default pricing data
      await pricingRepo.addPrice({
        supplier: form.supplier,
        material: form.material,
        price_per_unit: 25.5,
        currency: "TL",
        effective_date: new Date().toISOString().split("T")[0],
        is_active: true,
      })

      toast({
        title: "Fiyat Eklendi",
        description: `${form.supplier} - ${form.material} için varsayılan fiyat (25.50 TL/kg) eklendi.`,
      })

      // Trigger price recalculation
      const priceResult = await pricingRepo.calculateOrderPrice(
        form.supplier,
        form.material,
        form.quantity ? Number.parseFloat(form.quantity) : 1,
      )

      if (priceResult) {
        setCalculatedPrice(priceResult.pricePerKg)
        setCurrency(priceResult.currency)
      }
    } catch (error) {
      console.error("[v0] Error adding quick price:", error)
      toast({
        title: "Hata",
        description: "Fiyat eklenirken bir hata oluştu.",
        variant: "destructive",
      })
    } finally {
      setIsAddingPrice(false)
    }
  }

  // Debounced stock checking function
  const debouncedStockCheck = useCallback(
    useMemo(() => {
      let timeoutId: NodeJS.Timeout
      return (material: string, cm: string, mikron: string, quantity: string) => {
        clearTimeout(timeoutId)
        timeoutId = setTimeout(async () => {
          if (material && cm && mikron && quantity) {
            setIsCheckingStock(true)
            try {
              const stockItems = await warehouseRepo.getAvailableStockBySpecs(
                parseInt(cm),
                parseInt(mikron),
                material
              )
              
              setAvailableStock(stockItems)
              
              // Calculate total available stock
              const totalAvailable = stockItems.reduce((sum, item) => sum + item.currentWeight, 0)
              const requiredQuantity = parseFloat(quantity)
              
              // Check if this is an optimized quantity
              const isCurrentlyOptimized = isOptimized && originalQuantity !== null
              
              // Show alert logic:
              // 1. We have stock available
              // 2. Stock is less than required quantity
              // 3. Not optimized yet (if already optimized, don't show alert)
              let shouldShowAlert = false
              
              if (totalAvailable > 0 && !isCurrentlyOptimized) {
                // Only show alert if not optimized yet and stock < required
                shouldShowAlert = totalAvailable < requiredQuantity
              }
              
              setShowStockAlert(shouldShowAlert)
            } catch (error) {
              console.error("Error checking stock:", error)
              setAvailableStock([])
              setShowStockAlert(false)
            } finally {
              setIsCheckingStock(false)
            }
          } else {
            setAvailableStock([])
            setShowStockAlert(false)
          }
        }, 500)
      }
    }, [isOptimized, originalQuantity]),
    [isOptimized, originalQuantity]
  )

  // Stock calculations
  const stockCalculations = useMemo(() => {
    if (!availableStock.length || !form.quantity) {
      return null
    }

    const requiredQuantity = parseFloat(form.quantity)
    const totalAvailable = availableStock.reduce((sum, item) => sum + item.currentWeight, 0)
    
    // If we're in optimized state, calculate based on original quantity
    const baseQuantity = isOptimized && originalQuantity ? originalQuantity : requiredQuantity
    const optimizedQuantity = Math.max(0, baseQuantity - totalAvailable)
    const savingsPercentage = totalAvailable > 0 ? Math.round((totalAvailable / baseQuantity) * 100) : 0

    return {
      requiredQuantity,
      totalAvailable,
      optimizedQuantity,
      savingsPercentage: Math.min(savingsPercentage, 100)
    }
  }, [availableStock, form.quantity, isOptimized, originalQuantity])

  // Handle stock optimization
  const handleOptimizeOrder = useCallback(() => {
    if (stockCalculations) {
      // Save original quantity if not already saved
      if (originalQuantity === null) {
        setOriginalQuantity(stockCalculations.requiredQuantity)
      }
      
      // Update form directly without triggering updateField to avoid resetting optimization state
      setForm((prev) => ({ ...prev, quantity: stockCalculations.optimizedQuantity.toString() }))
      setIsOptimized(true)
      setShowStockAlert(false)
      
      toast({
        title: "Sipariş Optimize Edildi",
        description: `Miktar ${stockCalculations.optimizedQuantity} kg olarak güncellendi.`,
      })
    }
  }, [stockCalculations, originalQuantity, toast])

  const updateField = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    
    // Reset optimization state if user manually changes quantity
    if (field === "quantity" && isOptimized) {
      const newQuantity = parseFloat(value)
      const currentOptimizedQuantity = stockCalculations?.optimizedQuantity || 0
      
      // If user changes quantity to something different than optimized quantity, reset optimization
      if (newQuantity !== currentOptimizedQuantity) {
        setIsOptimized(false)
        setOriginalQuantity(null)
      }
    }
    
    // Reset optimization state if specifications change
    if (field === "material" || field === "cm" || field === "mikron") {
      setIsOptimized(false)
      setOriginalQuantity(null)
    }
    
    // Trigger stock check when relevant fields change
    if (field === "material" || field === "cm" || field === "mikron" || field === "quantity") {
      const newForm = { ...form, [field]: value }
      debouncedStockCheck(newForm.material, newForm.cm, newForm.mikron, newForm.quantity)
    }
  }

  const clearDate = (field: string) => {
    setForm((prev) => ({ ...prev, [field]: "" }))
  }

  console.log("[v0] About to render NewOrderPage", { suppliers, requesters, form })

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b">
        <div className="container mx-auto px-4 py-4 max-w-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" onClick={() => router.push("/orders")}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <h1 className="text-lg font-semibold">Yeni Sipariş</h1>
                <p className="text-sm text-muted-foreground">Sipariş bilgilerini girin</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 max-w-md space-y-6">
        {/* Temel Bilgiler */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Temel Bilgiler</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="requester">İstek Sahibi *</Label>
              <Select value={form.requester} onValueChange={(value) => updateField("requester", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="İstek sahibi seçin" />
                </SelectTrigger>
                <SelectContent>
                  {requesters.map((requester) => (
                    <SelectItem key={requester} value={requester}>
                      {requester}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="supplier">Tedarikçi *</Label>
              <Select value={form.supplier} onValueChange={(value) => updateField("supplier", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Tedarikçi seçin" />
                </SelectTrigger>
                <SelectContent>
                  {suppliers.map((supplier) => (
                    <SelectItem key={supplier} value={supplier}>
                      {supplier}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="customer">Müşteri *</Label>
              <Input
                id="customer"
                value={form.customer}
                onChange={(e) => updateField("customer", e.target.value)}
                placeholder="Müşteri adı"
              />
            </div>

            <div>
              <Label htmlFor="status">Durum</Label>
              <Select value={form.status} onValueChange={(value) => updateField("status", value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(statusOptions).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Ürün Bilgileri */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Ürün Bilgileri</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="material">Malzeme</Label>
              <Select value={form.material} onValueChange={(value) => updateField("material", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Malzeme seçin" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="OPP">OPP</SelectItem>
                  <SelectItem value="CPP">CPP</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label htmlFor="cm">CM</Label>
                <Input
                  id="cm"
                  type="number"
                  value={form.cm}
                  onChange={(e) => updateField("cm", e.target.value)}
                  placeholder="100"
                />
              </div>
              <div>
                <Label htmlFor="mikron">Mikron</Label>
                <Input
                  id="mikron"
                  type="number"
                  value={form.mikron}
                  onChange={(e) => updateField("mikron", e.target.value)}
                  placeholder="30"
                />
              </div>
              <div>
                <Label htmlFor="bobin_sayisi">Bobin</Label>
                <Input
                  id="bobin_sayisi"
                  type="number"
                  value={form.bobin_sayisi}
                  onChange={(e) => updateField("bobin_sayisi", e.target.value)}
                  placeholder="3"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="description">Açıklama</Label>
              <Textarea
                id="description"
                value={form.description}
                onChange={(e) => updateField("description", e.target.value)}
                placeholder="Ürün açıklaması"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="quantity" className="flex items-center gap-2 h-5">
                  Miktar
                  {isCheckingStock && (
                    <div className="h-3 w-3 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"></div>
                  )}
                </Label>
                <Input
                  id="quantity"
                  type="number"
                  step="0.01"
                  value={form.quantity}
                  onChange={(e) => updateField("quantity", e.target.value)}
                  placeholder="100"
                />
              </div>
              <div>
                <Label htmlFor="unit" className="h-5 flex items-center">Birim</Label>
                <Select value={form.unit} onValueChange={(value) => updateField("unit", value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="KG">KG</SelectItem>
                    <SelectItem value="TON">TON</SelectItem>
                    <SelectItem value="ADET">ADET</SelectItem>
                    <SelectItem value="METRE">METRE</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stok Uyarısı */}
        {showStockAlert && stockCalculations && (
          <StockAlertCard
            requiredAmount={isOptimized && originalQuantity ? originalQuantity : stockCalculations.requiredQuantity}
            availableStock={stockCalculations.totalAvailable}
            specifications={`${form.cm}cm • ${form.mikron}μ • ${form.material}`}
            onOptimize={handleOptimizeOrder}
            stockItems={availableStock.map(item => ({
              id: item.id,
              weight: item.currentWeight,
              barcode: item.barcode,
              supplier: item.supplier
            }))}
          />
        )}

        {/* Optimizasyon Bilgi Kartı */}
        {isOptimized && originalQuantity && stockCalculations && (
          <Card className="border-green-200 bg-green-50 dark:bg-green-950/20 dark:border-green-800">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0">
                  ✅
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-green-900 dark:text-green-100 mb-2">
                    Sipariş Optimize Edildi!
                  </h4>
                  
                  <div className="text-sm text-green-700 dark:text-green-300 space-y-2">
                    <div className="bg-white dark:bg-green-900/30 p-3 rounded border border-green-200 dark:border-green-700">
                      <div className="space-y-1">
                        <div className="flex justify-between">
                          <span>🎯 Asıl ihtiyaç:</span>
                          <span className="font-medium">{originalQuantity}kg</span>
                        </div>
                        <div className="flex justify-between">
                          <span>📦 Mevcut stok:</span>
                          <span className="font-medium">{stockCalculations.totalAvailable}kg</span>
                        </div>
                        <div className="flex justify-between">
                          <span>🛒 Yeni sipariş:</span>
                          <span className="font-medium">{stockCalculations.optimizedQuantity}kg</span>
                        </div>
                        <div className="flex justify-between border-t pt-1 mt-1 font-semibold">
                          <span>= Toplam tedarik:</span>
                          <span>{stockCalculations.totalAvailable + stockCalculations.optimizedQuantity}kg</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex gap-2 mt-3">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 text-xs h-8"
                        onClick={() => {
                          setForm((prev) => ({ ...prev, quantity: originalQuantity?.toString() || "" }))
                          setIsOptimized(false)
                          setOriginalQuantity(null)
                          toast({
                            title: "Asıl Miktara Dönüldü",
                            description: `Miktar ${originalQuantity}kg olarak geri yüklendi.`,
                          })
                        }}
                      >
                        🔄 Asıl Miktara Dön ({originalQuantity}kg)
                      </Button>
                    </div>
                    
                    <p className="text-xs text-center">
                      💡 Mevcut stok kullanılarak sipariş miktarı optimize edildi
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Fiyat Bilgileri */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Calculator className="h-4 w-4" />
              Fiyat Bilgileri
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="custom-price">Özel Fiyat</Label>
              <Switch id="custom-price" checked={customPrice} onCheckedChange={setCustomPrice} />
            </div>

            {!customPrice && (
              <div className="bg-muted/50 p-3 rounded-lg">
                <div className="text-sm text-muted-foreground mb-2">Otomatik Hesaplama</div>
                {calculatedPrice !== null ? (
                  <div className="space-y-1">
                    <div className="text-lg font-semibold">
                      {calculatedPrice?.toFixed(2) || "0.00"} {currency}/kg
                    </div>
                    {form.quantity && (
                      <div className="text-sm text-muted-foreground">
                        Toplam:{" "}
                        {calculatedPrice && form.quantity
                          ? (calculatedPrice * Number.parseFloat(form.quantity)).toFixed(2)
                          : "0.00"}{" "}
                        {currency}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {form.supplier && form.material ? (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                        <div className="text-sm font-medium text-yellow-800 mb-1">Fiyat Bilgisi Bulunamadı</div>
                        <div className="text-xs text-yellow-700 mb-3">
                          {form.supplier} tedarikçisi için {form.material} malzemesine ait aktif fiyat bulunamadı.
                        </div>
                        <div className="flex flex-col gap-2">
                          <Button
                            type="button"
                            variant="default"
                            size="sm"
                            className="text-xs h-8"
                            onClick={handleQuickAddPrice}
                            disabled={isAddingPrice}
                          >
                            <Calculator className="h-3 w-3 mr-1" />
                            {isAddingPrice ? "Ekleniyor..." : "Hızlı Fiyat Ekle (25.50 TL/kg)"}
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="text-xs h-8 bg-transparent"
                            onClick={() => window.open("/settings", "_blank")}
                          >
                            <ExternalLink className="h-3 w-3 mr-1" />
                            Ayarlar'da Fiyat Ekle
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="text-xs h-8 bg-transparent"
                            onClick={() => setCustomPrice(true)}
                          >
                            <Calculator className="h-3 w-3 mr-1" />
                            Özel Fiyat Kullan
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="text-sm text-muted-foreground">
                        Fiyat hesaplanabilmesi için tedarikçi, malzeme ve miktar bilgilerini girin
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {customPrice && (
              <>
                <Separator />
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="price-per-unit">Birim Fiyat</Label>
                      <Input
                        id="price-per-unit"
                        type="number"
                        step="0.01"
                        value={pricePerUnit}
                        onChange={(e) => setPricePerUnit(e.target.value)}
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <Label htmlFor="currency">Para Birimi</Label>
                      <Select value={currency} onValueChange={setCurrency}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="EUR">EUR</SelectItem>
                          <SelectItem value="USD">USD</SelectItem>
                          <SelectItem value="TRY">TRY</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="total-price">Toplam Fiyat</Label>
                    <Input
                      id="total-price"
                      type="number"
                      step="0.01"
                      value={totalPrice}
                      onChange={(e) => setTotalPrice(e.target.value)}
                      placeholder="0.00"
                    />
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Opsiyonel Bilgiler */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Opsiyonel Bilgiler</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="ordered_date">Sipariş Tarihi</Label>
              <div className="relative">
                <Input
                  id="ordered_date"
                  type="date"
                  value={form.ordered_date}
                  onChange={(e) => updateField("ordered_date", e.target.value)}
                />
                {form.ordered_date && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-1 top-1 h-6 w-6 p-0"
                    onClick={() => clearDate("ordered_date")}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="eta_date">Beklenen Geliş Tarihi</Label>
              <div className="relative">
                <Input
                  id="eta_date"
                  type="date"
                  value={form.eta_date}
                  onChange={(e) => updateField("eta_date", e.target.value)}
                />
                {form.eta_date && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-1 top-1 h-6 w-6 p-0"
                    onClick={() => clearDate("eta_date")}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="notes">Notlar</Label>
              <Textarea
                id="notes"
                value={form.notes}
                onChange={(e) => updateField("notes", e.target.value)}
                placeholder="Ek notlar"
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="tags">Etiketler</Label>
              <Input
                id="tags"
                value={form.tags}
                onChange={(e) => updateField("tags", e.target.value)}
                placeholder="ACİL, ÖZEL (virgülle ayırın)"
              />
            </div>
          </CardContent>
        </Card>

        <div className="space-y-3">
          <Button onClick={handleSave} className="w-full" size="lg" disabled={isLoading}>
            <Save className="h-4 w-4 mr-2" />
            {isLoading ? "Kaydediliyor..." : "Siparişi Kaydet"}
          </Button>

          <Button
            onClick={() => router.push("/orders")}
            variant="ghost"
            className="w-full"
            size="lg"
            disabled={isLoading}
          >
            İptal Et
          </Button>
        </div>
      </div>
    </div>
  )
}
