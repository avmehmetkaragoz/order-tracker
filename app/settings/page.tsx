"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { ordersRepo } from "@/lib/orders-repo"
import { settingsRepo } from "@/lib/settings-repo"
import { pricingRepo } from "@/lib/pricing-repo"
import { warehouseRepo } from "@/lib/warehouse-repo"
import type { SupplierPrice } from "@/types/order"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Plus, Trash2, Download, Upload, Users, Building2, Euro, History } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function SettingsPage() {
  const router = useRouter()
  const { toast } = useToast()

  const [suppliers, setSuppliers] = useState<string[]>([])
  const [requesters, setRequesters] = useState<string[]>([])
  const [customers, setCustomers] = useState<string[]>([])
  const [newSupplier, setNewSupplier] = useState("")
  const [newRequester, setNewRequester] = useState("")
  const [newCustomer, setNewCustomer] = useState("")
  const [orderCount, setOrderCount] = useState(0)
  const [prices, setPrices] = useState<SupplierPrice[]>([])
  const [newPrice, setNewPrice] = useState({
    supplier: "",
    material: "",
    pricePerKg: "",
    currency: "EUR",
    validFrom: new Date().toISOString().split("T")[0],
  })
  const [selectedSupplierForHistory, setSelectedSupplierForHistory] = useState("")
  const [priceHistory, setPriceHistory] = useState<SupplierPrice[]>([])

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [suppliersData, requestersData, customersData, ordersData, pricesData] = await Promise.all([
        settingsRepo.getSuppliers(),
        settingsRepo.getRequesters(),
        settingsRepo.getCustomers(),
        ordersRepo.list(),
        pricingRepo.getPrices(),
      ])

      setSuppliers(Array.isArray(suppliersData) ? suppliersData : [])
      setRequesters(Array.isArray(requestersData) ? requestersData : [])
      setCustomers(Array.isArray(customersData) ? customersData : [])
      setOrderCount(Array.isArray(ordersData) ? ordersData.length : 0)
      setPrices(Array.isArray(pricesData) ? pricesData : [])
    } catch (error) {
      console.error("Error loading settings data:", error)
      setSuppliers([])
      setRequesters([])
      setCustomers([])
      setOrderCount(0)
      setPrices([])
    }
  }

  const handleAddSupplier = async (supplier: string) => {
    if (suppliers.includes(supplier)) {
      toast({
        title: "Hata",
        description: "Bu tedarikçi zaten mevcut",
        variant: "destructive",
      })
      return
    }

    try {
      await settingsRepo.addSupplier(supplier)
      setNewSupplier("")
      await loadData()
      toast({
        title: "Başarılı",
        description: "Tedarikçi eklendi",
      })
    } catch (error) {
      toast({
        title: "Hata",
        description: "Tedarikçi eklenirken bir hata oluştu",
        variant: "destructive",
      })
    }
  }

  const handleRemoveSupplier = async (supplier: string) => {
    try {
      await pricingRepo.deleteSupplierPrices(supplier)
      await settingsRepo.removeSupplier(supplier)
      await loadData()
      toast({
        title: "Başarılı",
        description: "Tedarikçi ve fiyat geçmişi silindi",
      })
    } catch (error) {
      toast({
        title: "Hata",
        description: "Tedarikçi silinirken bir hata oluştu",
        variant: "destructive",
      })
    }
  }

  const handleAddRequester = async (requester: string) => {
    if (requesters.includes(requester)) {
      toast({
        title: "Hata",
        description: "Bu istek sahibi zaten mevcut",
        variant: "destructive",
      })
      return
    }

    try {
      await settingsRepo.addRequester(requester)
      setNewRequester("")
      await loadData()
      toast({
        title: "Başarılı",
        description: "İstek sahibi eklendi",
      })
    } catch (error) {
      toast({
        title: "Hata",
        description: "İstek sahibi eklenirken bir hata oluştu",
        variant: "destructive",
      })
    }
  }

  const handleRemoveRequester = async (requester: string) => {
    try {
      await settingsRepo.removeRequester(requester)
      await loadData()
      toast({
        title: "Başarılı",
        description: "İstek sahibi silindi",
      })
    } catch (error) {
      toast({
        title: "Hata",
        description: "İstek sahibi silinirken bir hata oluştu",
        variant: "destructive",
      })
    }
  }

  const handleAddCustomer = async (customer: string) => {
    if (customers.includes(customer)) {
      toast({
        title: "Hata",
        description: "Bu müşteri zaten mevcut",
        variant: "destructive",
      })
      return
    }

    try {
      await settingsRepo.addCustomer(customer)
      setNewCustomer("")
      await loadData()
      toast({
        title: "Başarılı",
        description: "Müşteri eklendi",
      })
    } catch (error) {
      toast({
        title: "Hata",
        description: "Müşteri eklenirken bir hata oluştu",
        variant: "destructive",
      })
    }
  }

  const handleRemoveCustomer = async (customer: string) => {
    try {
      await settingsRepo.removeCustomer(customer)
      await loadData()
      toast({
        title: "Başarılı",
        description: "Müşteri silindi",
      })
    } catch (error) {
      toast({
        title: "Hata",
        description: "Müşteri silinirken bir hata oluştu",
        variant: "destructive",
      })
    }
  }

  const handleExportData = async () => {
    try {
      const data = await ordersRepo.exportData()
      const blob = new Blob([data], { type: "application/json" })
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = `siparis-takip-${new Date().toISOString().split("T")[0]}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      toast({
        title: "Başarılı",
        description: "Veriler dışa aktarıldı",
      })
    } catch (error) {
      toast({
        title: "Hata",
        description: "Dışa aktarma sırasında bir hata oluştu",
        variant: "destructive",
      })
    }
  }

  const handleImportData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = async (e) => {
      try {
        const jsonData = e.target?.result as string
        const result = await ordersRepo.importData(jsonData)

        if (result.success) {
          await loadData() // Refresh data
          toast({
            title: "Başarılı",
            description: `${result.count} sipariş içe aktarıldı`,
          })
        } else {
          toast({
            title: "Hata",
            description: result.error || "İçe aktarma sırasında bir hata oluştu",
            variant: "destructive",
          })
        }
      } catch (error) {
        toast({
          title: "Hata",
          description: "Dosya okunamadı",
          variant: "destructive",
        })
      }
    }
    reader.readAsText(file)

    // Reset input
    event.target.value = ""
  }

  const handleClearAllData = async () => {
    try {
      // Clear orders
      const orders = await ordersRepo.list()
      if (Array.isArray(orders)) {
        await Promise.all(orders.map((order) => ordersRepo.remove(order.id)))
      }

      // Clear warehouse items (this will also clear stock movements due to CASCADE)
      const warehouseItems = await warehouseRepo.getItems()
      if (Array.isArray(warehouseItems)) {
        await Promise.all(warehouseItems.map((item) => warehouseRepo.deleteItem(item.id)))
      }

      // Clear pricing data
      const prices = await pricingRepo.getPrices()
      if (Array.isArray(prices)) {
        await Promise.all(prices.map((price) => pricingRepo.deletePrice(price.id)))
      }

      // Clear settings
      await settingsRepo.saveSuppliers([])
      await settingsRepo.saveRequesters([])
      await settingsRepo.saveCustomers([])

      await loadData()
      toast({
        title: "Başarılı",
        description: "Tüm veriler temizlendi",
      })
    } catch (error) {
      toast({
        title: "Hata",
        description: "Veriler temizlenirken bir hata oluştu",
        variant: "destructive",
      })
    }
  }

  const handleAddPrice = async () => {
    console.log("[v0] Price form values:", {
      supplier: newPrice.supplier,
      material: newPrice.material,
      pricePerKg: newPrice.pricePerKg,
      validFrom: newPrice.validFrom,
    })

    const supplier = newPrice.supplier.trim()
    const material = newPrice.material.trim()
    const pricePerKg = Number.parseFloat(newPrice.pricePerKg)

    if (!supplier) {
      toast({
        title: "Hata",
        description: "Lütfen tedarikçi seçin",
        variant: "destructive",
      })
      return
    }

    if (!material) {
      toast({
        title: "Hata",
        description: "Lütfen malzeme seçin",
        variant: "destructive",
      })
      return
    }

    if (!newPrice.pricePerKg || isNaN(pricePerKg) || pricePerKg <= 0) {
      toast({
        title: "Hata",
        description: "Lütfen geçerli bir fiyat girin",
        variant: "destructive",
      })
      return
    }

    if (!newPrice.validFrom) {
      toast({
        title: "Hata",
        description: "Lütfen geçerlilik tarihi seçin",
        variant: "destructive",
      })
      return
    }

    try {
      const existingPrice = await pricingRepo.checkExistingPrice(supplier, material.toUpperCase(), newPrice.validFrom)

      if (existingPrice) {
        toast({
          title: "Hata",
          description: `Bu tedarikçi ve malzeme için ${formatDate(newPrice.validFrom)} tarihinde zaten bir fiyat mevcut. Lütfen farklı bir tarih seçin veya mevcut fiyatı güncelleyin.`,
          variant: "destructive",
        })
        return
      }

      await pricingRepo.addPrice({
        supplier,
        material: material.toUpperCase(),
        price_per_unit: pricePerKg,
        currency: newPrice.currency,
        effective_date: newPrice.validFrom,
        is_active: true,
      })

      setNewPrice({
        supplier: "",
        material: "",
        pricePerKg: "",
        currency: "EUR",
        validFrom: new Date().toISOString().split("T")[0],
      })

      await loadData()
      toast({
        title: "Başarılı",
        description: "Fiyat eklendi",
      })
    } catch (error) {
      console.error("[v0] Error adding price:", error)
      toast({
        title: "Hata",
        description: "Fiyat eklenirken bir hata oluştu",
        variant: "destructive",
      })
    }
  }

  const handleDeactivatePrice = async (priceId: string) => {
    try {
      await pricingRepo.updatePrice(priceId, {
        is_active: false,
        valid_to: new Date().toISOString().split("T")[0],
      })
      await loadData()
      toast({
        title: "Başarılı",
        description: "Fiyat devre dışı bırakıldı",
      })
    } catch (error) {
      toast({
        title: "Hata",
        description: "Fiyat güncellenirken bir hata oluştu",
        variant: "destructive",
      })
    }
  }

  const handleDeletePrice = async (priceId: string) => {
    try {
      await pricingRepo.deletePrice(priceId)
      if (selectedSupplierForHistory) {
        const history = await pricingRepo.getPriceHistory(selectedSupplierForHistory)
        setPriceHistory(Array.isArray(history) ? history : [])
      }
      await loadData()
      toast({
        title: "Başarılı",
        description: "Fiyat silindi",
      })
    } catch (error) {
      toast({
        title: "Hata",
        description: "Fiyat silinirken bir hata oluştu",
        variant: "destructive",
      })
    }
  }

  const loadPriceHistory = async (supplier: string) => {
    try {
      setSelectedSupplierForHistory(supplier)
      const history = await pricingRepo.getPriceHistory(supplier)
      setPriceHistory(Array.isArray(history) ? history : [])
    } catch (error) {
      console.error("Error loading price history:", error)
      setPriceHistory([])
    }
  }

  const getActivePrices = () => {
    return Array.isArray(prices) ? prices.filter((p) => p.is_active) : []
  }

  const formatPrice = (price: number, currency: string) => {
    if (price === null || price === undefined || isNaN(price)) {
      return `0.00 ${currency}/kg`
    }
    return `${price.toFixed(2)} ${currency}/kg`
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("tr-TR")
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="container mx-auto px-4 py-4 max-w-md">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => router.push("/")}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-lg font-semibold">Ayarlar</h1>
              <p className="text-sm text-muted-foreground">Uygulama ayarlarını yönetin</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 max-w-md space-y-6">
        {/* Data Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <div className="text-2xl">📊</div>
              Veri Özeti
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-primary">{orderCount}</div>
                <div className="text-xs text-muted-foreground">Sipariş</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-primary">{suppliers.length}</div>
                <div className="text-xs text-muted-foreground">Tedarikçi</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-primary">{requesters.length}</div>
                <div className="text-xs text-muted-foreground">İstek Sahibi</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-primary">{getActivePrices().length}</div>
                <div className="text-xs text-muted-foreground">Aktif Fiyat</div>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 text-center mt-4 pt-4 border-t">
              <div>
                <div className="text-2xl font-bold text-primary">{customers.length}</div>
                <div className="text-xs text-muted-foreground">Müşteri</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pricing Management */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Euro className="h-5 w-5" />
              Fiyat Yönetimi
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Add New Price Form */}
            <div className="space-y-3 p-3 bg-muted/30 rounded-lg">
              <h4 className="text-sm font-medium">Yeni Fiyat Ekle</h4>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label htmlFor="price-supplier" className="text-xs">
                    Tedarikçi
                  </Label>
                  <Select
                    value={newPrice.supplier}
                    onValueChange={(value) => setNewPrice({ ...newPrice, supplier: value })}
                  >
                    <SelectTrigger className="h-8">
                      <SelectValue placeholder="Seçin" />
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
                  <Label htmlFor="price-material" className="text-xs">
                    Malzeme
                  </Label>
                  <Select
                    value={newPrice.material}
                    onValueChange={(value) => setNewPrice({ ...newPrice, material: value })}
                  >
                    <SelectTrigger className="h-8">
                      <SelectValue placeholder="Seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="OPP">OPP</SelectItem>
                      <SelectItem value="CPP">CPP</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label htmlFor="price-amount" className="text-xs">
                    Fiyat (€/kg)
                  </Label>
                  <Input
                    id="price-amount"
                    type="number"
                    step="0.01"
                    placeholder="1.80"
                    value={newPrice.pricePerKg}
                    onChange={(e) => setNewPrice({ ...newPrice, pricePerKg: e.target.value })}
                    className="h-8"
                  />
                </div>

                <div>
                  <Label htmlFor="price-date" className="text-xs">
                    Geçerlilik Tarihi
                  </Label>
                  <Input
                    id="price-date"
                    type="date"
                    value={newPrice.validFrom}
                    onChange={(e) => setNewPrice({ ...newPrice, validFrom: e.target.value })}
                    className="h-8"
                  />
                </div>
              </div>

              <Button onClick={handleAddPrice} size="sm" className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Fiyat Ekle
              </Button>
            </div>

            {/* Active Prices List */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Aktif Fiyatlar</h4>
              {getActivePrices().length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">Henüz fiyat eklenmemiş</p>
              ) : (
                getActivePrices().map((price) => (
                  <div key={price.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-md">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{price.supplier}</span>
                        <Badge variant="secondary" className="text-xs">
                          {price.material}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {formatPrice(price.price_per_unit, price.currency)} • {formatDate(price.effective_date)}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => loadPriceHistory(price.supplier)}
                      >
                        <History className="h-3 w-3" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-destructive">
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Fiyatı sil</AlertDialogTitle>
                            <AlertDialogDescription>
                              Bu fiyatı silmek istediğinizden emin misiniz?
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>İptal</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeletePrice(price.id)}
                              className="bg-destructive text-destructive-foreground"
                            >
                              Sil
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Price History */}
            {selectedSupplierForHistory && priceHistory.length > 0 && (
              <div className="space-y-2 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium">{selectedSupplierForHistory} - Fiyat Geçmişi</h4>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedSupplierForHistory("")}
                    className="h-6 w-6 p-0"
                  >
                    ×
                  </Button>
                </div>
                <div className="space-y-1 max-h-40 overflow-y-auto">
                  {priceHistory.map((price) => (
                    <div
                      key={price.id}
                      className="flex items-center justify-between text-xs p-2 bg-background/50 rounded"
                    >
                      <div className="flex items-center gap-2">
                        <Badge variant={price.is_active ? "default" : "secondary"} className="text-xs">
                          {price.material}
                        </Badge>
                        <span>{formatPrice(price.price_per_unit, price.currency)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-muted-foreground">
                          {formatDate(price.effective_date)}
                          {price.valid_to && ` - ${formatDate(price.valid_to)}`}
                        </div>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-4 w-4 p-0 text-destructive">
                              <Trash2 className="h-2 w-2" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Fiyatı sil</AlertDialogTitle>
                              <AlertDialogDescription>
                                Bu fiyat kaydını silmek istediğinizden emin misiniz?
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>İptal</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeletePrice(price.id)}
                                className="bg-destructive text-destructive-foreground"
                              >
                                Sil
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Suppliers Management */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Tedarikçi Yönetimi
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Yeni tedarikçi adı"
                value={newSupplier}
                onChange={(e) => setNewSupplier(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddSupplier(newSupplier)}
              />
              <Button onClick={() => handleAddSupplier(newSupplier)} size="sm">
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-2">
              {suppliers.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">Henüz tedarikçi eklenmemiş</p>
              ) : (
                suppliers.map((supplier) => (
                  <div key={supplier} className="flex items-center justify-between p-2 bg-muted/50 rounded-md">
                    <div className="flex-1">
                      <span className="text-sm">{supplier}</span>
                      <div className="text-xs text-muted-foreground">
                        {Array.isArray(prices)
                          ? prices.filter((p) => p.supplier === supplier && p.is_active).length
                          : 0}{" "}
                        aktif fiyat
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => loadPriceHistory(supplier)}
                      >
                        <Euro className="h-3 w-3" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-destructive">
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Tedarikçiyi sil</AlertDialogTitle>
                            <AlertDialogDescription>
                              "{supplier}" tedarikçisini silmek istediğinizden emin misiniz?
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>İptal</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleRemoveSupplier(supplier)}
                              className="bg-destructive text-destructive-foreground"
                            >
                              Sil
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Requesters Management */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-5 w-5" />
              İstek Sahibi Yönetimi
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Yeni istek sahibi adı"
                value={newRequester}
                onChange={(e) => setNewRequester(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddRequester(newRequester)}
              />
              <Button onClick={() => handleAddRequester(newRequester)} size="sm">
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-2">
              {requesters.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">Henüz istek sahibi eklenmemiş</p>
              ) : (
                requesters.map((requester) => (
                  <div key={requester} className="flex items-center justify-between p-2 bg-muted/50 rounded-md">
                    <span className="text-sm">{requester}</span>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-destructive">
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>İstek sahibini sil</AlertDialogTitle>
                          <AlertDialogDescription>
                            "{requester}" istek sahibini silmek istediğinizden emin misiniz?
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>İptal</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleRemoveRequester(requester)}
                            className="bg-destructive text-destructive-foreground"
                          >
                            Sil
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Customer Management */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-5 w-5" />
              Müşteri Yönetimi
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Yeni müşteri adı"
                value={newCustomer}
                onChange={(e) => setNewCustomer(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddCustomer(newCustomer)}
              />
              <Button onClick={() => handleAddCustomer(newCustomer)} size="sm">
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-2">
              {customers.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">Henüz müşteri eklenmemiş</p>
              ) : (
                customers.map((customer) => (
                  <div key={customer} className="flex items-center justify-between p-2 bg-muted/50 rounded-md">
                    <span className="text-sm">{customer}</span>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-destructive">
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Müşteriyi sil</AlertDialogTitle>
                          <AlertDialogDescription>
                            "{customer}" müşterisini silmek istediğinizden emin misiniz?
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>İptal</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleRemoveCustomer(customer)}
                            className="bg-destructive text-destructive-foreground"
                          >
                            Sil
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Data Management */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <div className="text-2xl">💾</div>
              Veri Yönetimi
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <Button onClick={handleExportData} className="w-full bg-transparent" variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Verileri Dışa Aktar (JSON)
              </Button>

              <div>
                <Label htmlFor="import-file" className="cursor-pointer">
                  <Button asChild className="w-full bg-transparent" variant="outline">
                    <span>
                      <Upload className="h-4 w-4 mr-2" />
                      Verileri İçe Aktar (JSON)
                    </span>
                  </Button>
                </Label>
                <Input id="import-file" type="file" accept=".json" onChange={handleImportData} className="hidden" />
              </div>

              <div className="pt-2 border-t">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" className="w-full">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Tüm Verileri Temizle
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Tüm verileri temizle</AlertDialogTitle>
                      <AlertDialogDescription>
                        Bu işlem tüm siparişleri, tedarikçileri, istek sahiplerini ve müşterileri kalıcı olarak
                        silecektir. Bu işlem geri alınamaz.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>İptal</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleClearAllData}
                        className="bg-destructive text-destructive-foreground"
                      >
                        Tümünü Sil
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>

            <div className="text-xs text-muted-foreground space-y-1">
              <p>• JSON dışa aktarma tüm sipariş verilerinizi yedekler</p>
              <p>• İçe aktarma mevcut verilerle birleştirir</p>
              <p>• Veri temizleme işlemi geri alınamaz</p>
            </div>
          </CardContent>
        </Card>

        {/* App Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <div className="text-2xl">ℹ️</div>
              Uygulama Bilgisi
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Şirket</span>
              <span>DEKA</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Uygulama</span>
              <span>Sipariş Takip Sistemi</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Versiyon</span>
              <span>2.0.0</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Veri Depolama</span>
              <span>Supabase</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Özellikler</span>
              <div className="flex gap-1">
                <Badge variant="secondary" className="text-xs">
                  Depo Yönetimi
                </Badge>
                <Badge variant="secondary" className="text-xs">
                  Barkod
                </Badge>
              </div>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">PWA Desteği</span>
              <Badge variant="secondary" className="text-xs">
                Aktif
              </Badge>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Mobil Uyumlu</span>
              <Badge variant="secondary" className="text-xs">
                Evet
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
