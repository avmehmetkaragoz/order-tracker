"use client"

import { use, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { ordersRepo } from "@/lib/orders-repo"
import { settingsRepo } from "@/lib/settings-repo"
import { pricingRepo } from "@/lib/pricing-repo"
import { OrderWarehouseIntegration } from "@/lib/order-warehouse-integration"
import type { Order, OrderStatus } from "@/types/order"
import type { WarehouseItem } from "@/types/warehouse"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Trash2, ChevronDown, ChevronUp, Package, Euro, Warehouse, ExternalLink } from "lucide-react"
import { formatDate, isOverdue } from "@/lib/date-utils"
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

const statusLabels: Record<OrderStatus, string> = {
  Requested: "Talep Edildi",
  Ordered: "Sipariş Verildi",
  Return: "İade",
  Delivered: "Teslim Edildi",
  Cancelled: "İptal Edildi",
}

const statusColors = {
  Requested: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  Ordered: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  Return: "bg-purple-500/10 text-purple-500 border-purple-500/20",
  Delivered: "bg-green-500/10 text-green-500 border-green-500/20",
  Cancelled: "bg-red-500/10 text-red-500 border-red-500/20",
}

export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const { id: orderId } = use(params)

  const [order, setOrder] = useState<Order | null>(null)
  const [editedOrder, setEditedOrder] = useState<Order | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [showAllFields, setShowAllFields] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  const [suppliers, setSuppliers] = useState<string[]>([])
  const [requesters, setRequesters] = useState<string[]>([])

  const [useCustomPrice, setUseCustomPrice] = useState(false)

  const [warehouseStatus, setWarehouseStatus] = useState<{
    isInWarehouse: boolean
    warehouseItem?: WarehouseItem
    canReceive: boolean
  }>({ isInWarehouse: false, canReceive: false })

  useEffect(() => {
    loadOrder()
    loadSettings()
  }, [orderId, router])

  useEffect(() => {
    if (editedOrder?.custom_price) {
      setUseCustomPrice(true)
    }
  }, [editedOrder])

  useEffect(() => {
    if (order) {
      loadWarehouseStatus()
    }
  }, [order])

  const loadOrder = async () => {
    if (orderId === "new" || !orderId) {
      console.log("[v0] OrderDetailPage: Skipping load for new order or missing ID")
      setIsLoading(false)
      return
    }

    console.log("[v0] OrderDetailPage: Loading order with ID:", orderId)
    try {
      const foundOrder = await ordersRepo.get(orderId)
      console.log("[v0] OrderDetailPage: Order fetch result:", foundOrder)
      
      if (foundOrder) {
        console.log("[v0] OrderDetailPage: Setting order data:", foundOrder)
        setOrder(foundOrder)
        setEditedOrder(foundOrder)
      } else {
        console.warn("[v0] OrderDetailPage: No order found for ID:", orderId)
      }
    } catch (error) {
      console.error("[v0] OrderDetailPage: Error fetching order:", error)
    }
    setIsLoading(false)
  }

  const loadSettings = async () => {
    try {
      const [suppliersData, requestersData] = await Promise.all([
        settingsRepo.getSuppliers(),
        settingsRepo.getRequesters(),
      ])
      setSuppliers(suppliersData || [])
      setRequesters(requestersData || [])
    } catch (error) {
      console.error("Error loading settings:", error)
      setSuppliers([])
      setRequesters([])
    }
  }

  const loadWarehouseStatus = async () => {
    try {
      const status = await OrderWarehouseIntegration.getOrderWarehouseStatus(orderId)
      setWarehouseStatus(status)
    } catch (error) {
      console.error("Error loading warehouse status:", error)
    }
  }

  const handleSave = async () => {
    if (!editedOrder) return

    setIsSaving(true)
    try {
      if (editedOrder.supplier && !suppliers.includes(editedOrder.supplier)) {
        await settingsRepo.addSupplier(editedOrder.supplier)
      }
      if (editedOrder.requester && !requesters.includes(editedOrder.requester)) {
        await settingsRepo.addRequester(editedOrder.requester)
      }

      const updatedOrder = await ordersRepo.update(orderId, editedOrder)
      if (updatedOrder) {
        setOrder(updatedOrder)
        setIsEditing(false)
      }
    } catch (error) {
      console.error("Error saving order:", error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    try {
      await ordersRepo.remove(orderId)
      router.push("/orders")
    } catch (error) {
      console.error("Error deleting order:", error)
    }
  }

  const handleStatusChange = (newStatus: OrderStatus) => {
    if (!editedOrder) return

    const updates: Partial<Order> = { status: newStatus }

    if (newStatus === "Delivered" && !editedOrder.delivered_date) {
      updates.delivered_date = new Date().toISOString().split("T")[0]
    }
    if (newStatus === "Ordered" && !editedOrder.ordered_date) {
      updates.ordered_date = new Date().toISOString().split("T")[0]
    }

    setEditedOrder({ ...editedOrder, ...updates })
  }

  const handleQuickAction = (action: string) => {
    if (!editedOrder) return

    const today = new Date().toISOString().split("T")[0]

    switch (action) {
      case "delivered":
        setEditedOrder({
          ...editedOrder,
          status: "Delivered",
          delivered_date: today,
        })
        break
    }
  }

  const updateField = (field: keyof Order, value: any) => {
    if (!editedOrder) return
    setEditedOrder({ ...editedOrder, [field]: value })
  }

  const updatePricingField = (field: string, value: any) => {
    if (!editedOrder) return
    setEditedOrder({
      ...editedOrder,
      [field]: value,
    })
  }

  const calculateAutomaticPrice = async () => {
    if (!editedOrder?.supplier || !editedOrder?.material || !editedOrder?.quantity) {
      return null
    }

    try {
      const price = await pricingRepo.calculateOrderPrice(
        editedOrder.supplier,
        editedOrder.material,
        editedOrder.quantity,
      )
      if (!price) return null

      return {
        pricePerKg: price.pricePerKg,
        totalPrice: price.totalPrice,
        currency: price.currency,
      }
    } catch (error) {
      console.error("Error calculating price:", error)
      return null
    }
  }

  if (orderId === "new") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Yönlendiriliyor...</p>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-sm text-muted-foreground">Sipariş yükleniyor...</p>
        </div>
      </div>
    )
  }

  if (!order || !editedOrder) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Sipariş bulunamadı</h2>
          <Button onClick={() => router.push("/orders")}>Siparişlere Dön</Button>
        </div>
      </div>
    )
  }

  const overdue = isOverdue(order)
  const basicFields = ["requester", "supplier", "material", "spec", "description", "quantity", "unit", "status"]
  const advancedFields = ["created_at", "ordered_date", "eta_date", "delivered_date", "notes", "tags"]

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="container mx-auto px-4 py-4 max-w-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" onClick={() => router.push("/orders")}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <h1 className="text-lg font-semibold">Sipariş Detayı</h1>
                <p className="text-sm text-muted-foreground">#{order?.id?.slice(0, 8) || "Unknown"}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {!isEditing ? (
                <Button onClick={() => setIsEditing(true)}>Düzenle</Button>
              ) : (
                <>
                  <Button variant="outline" onClick={() => setIsEditing(false)} disabled={isSaving}>
                    İptal
                  </Button>
                  <Button onClick={handleSave} disabled={isSaving}>
                    {isSaving ? "Kaydediliyor..." : "Kaydet"}
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 max-w-md space-y-6">
        {(warehouseStatus.isInWarehouse || warehouseStatus.canReceive) && (
          <Card className="border-blue-200 dark:border-blue-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
                <Warehouse className="h-5 w-5" />
                Depo Durumu
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {warehouseStatus.isInWarehouse && warehouseStatus.warehouseItem ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-green-500/10 text-green-500 border-green-500/20">Depoda Mevcut</Badge>
                    <span className="text-sm text-muted-foreground font-mono">
                      {warehouseStatus.warehouseItem.barcode}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-muted-foreground">Mevcut Ağırlık</div>
                      <div className="font-medium">{warehouseStatus.warehouseItem.currentWeight || 0}kg</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Bobin Sayısı</div>
                      <div className="font-medium">{warehouseStatus.warehouseItem.bobinCount || 0} adet</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Konum</div>
                      <div className="font-medium">{warehouseStatus.warehouseItem.location || "Belirtilmemiş"}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Durum</div>
                      <Badge variant="outline" className="text-xs">
                        {warehouseStatus.warehouseItem.status === "Stokta"
                          ? "Stokta"
                          : warehouseStatus.warehouseItem.status === "Stok Yok"
                            ? "Stok Yok"
                            : warehouseStatus.warehouseItem.status === "Rezerve"
                              ? "Rezerve"
                              : warehouseStatus.warehouseItem.status}
                      </Badge>
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full bg-transparent"
                    onClick={() => (window.location.href = `/warehouse/${warehouseStatus.warehouseItem?.id}`)}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Depo Detaylarını Görüntüle
                  </Button>
                </div>
              ) : warehouseStatus.canReceive ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-orange-500/10 text-orange-500 border-orange-500/20">Depoya Alınabilir</Badge>
                  </div>

                  <p className="text-sm text-muted-foreground">Bu sipariş teslim edildi ve depoya alınmayı bekliyor.</p>

                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full bg-transparent"
                    onClick={() => (window.location.href = `/warehouse/receive?orderId=${orderId}`)}
                  >
                    <Warehouse className="h-4 w-4 mr-2" />
                    Depoya Al
                  </Button>
                </div>
              ) : null}
            </CardContent>
          </Card>
        )}

        {/* Status Update Card */}
        <Card className="border-amber-200 dark:border-amber-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2 text-amber-700 dark:text-amber-300">
              <div className="h-4 w-4 rounded bg-gradient-to-br from-amber-500 to-orange-500"></div>
              Durum Güncelleme
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-sm text-muted-foreground">Mevcut Durum</Label>
              <Badge className={statusColors[order.status]}>
                {statusLabels[order.status]}
              </Badge>
            </div>

            {isEditing ? (
              <div className="space-y-3">
                <Select value={editedOrder.status} onValueChange={handleStatusChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Requested">Talep Edildi</SelectItem>
                    <SelectItem value="Ordered">Sipariş Verildi</SelectItem>
                    <SelectItem value="Delivered">Teslim Edildi</SelectItem>
                    <SelectItem value="Return">İade</SelectItem>
                    <SelectItem value="Cancelled">İptal Edildi</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">
                Durumu güncellemek için düzenleme moduna geçin
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Package className="h-4 w-4 text-primary" />
              Temel Bilgiler
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* People Section */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <div className="h-1 w-1 bg-blue-500 rounded-full"></div>
                Kişiler
              </div>
              <div className="grid grid-cols-1 gap-3 pl-3">
                <div className="flex justify-between items-center">
                  <Label className="text-sm text-muted-foreground">İstek Sahibi</Label>
                  {isEditing ? (
                    <Input
                      value={editedOrder.requester}
                      onChange={(e) => updateField("requester", e.target.value)}
                      list="requesters"
                      className="w-40 h-8 text-sm"
                    />
                  ) : (
                    <Badge
                      variant="outline"
                      className="bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-300"
                    >
                      {order.requester}
                    </Badge>
                  )}
                </div>
                <div className="flex justify-between items-center">
                  <Label className="text-sm text-muted-foreground">Tedarikçi</Label>
                  {isEditing ? (
                    <Input
                      value={editedOrder.supplier}
                      onChange={(e) => updateField("supplier", e.target.value)}
                      list="suppliers"
                      className="w-40 h-8 text-sm"
                    />
                  ) : (
                    <Badge
                      variant="outline"
                      className="bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-300"
                    >
                      {order.supplier}
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            <div className="border-t border-border/50"></div>

            {/* Product Section */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <div className="h-1 w-1 bg-purple-500 rounded-full"></div>
                Ürün Bilgileri
              </div>
              <div className="grid grid-cols-1 gap-3 pl-3">
                <div className="flex justify-between items-center">
                  <Label className="text-sm text-muted-foreground">Malzeme</Label>
                  {isEditing ? (
                    <Input
                      value={editedOrder.material || ""}
                      onChange={(e) => updateField("material", e.target.value)}
                      placeholder="OPP, CPP..."
                      className="w-32 h-8 text-sm"
                    />
                  ) : (
                    <Badge className="bg-purple-500/10 text-purple-500 border-purple-500/20">
                      {order.material || "-"}
                    </Badge>
                  )}
                </div>
                <div className="flex justify-between items-center">
                  <Label className="text-sm text-muted-foreground">Özellik</Label>
                  {isEditing ? (
                    <Input
                      value={editedOrder.spec || ""}
                      onChange={(e) => updateField("spec", e.target.value)}
                      placeholder="1.90 OPP..."
                      className="w-32 h-8 text-sm"
                    />
                  ) : (
                    <span className="text-sm font-mono bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-xs">
                      {order.spec || "-"}
                    </span>
                  )}
                </div>
                <div className="flex justify-between items-center">
                  <Label className="text-sm text-muted-foreground">Miktar</Label>
                  {isEditing ? (
                    <div className="flex gap-1">
                      <Input
                        type="number"
                        value={editedOrder.quantity || ""}
                        onChange={(e) => updateField("quantity", e.target.value ? Number(e.target.value) : undefined)}
                        className="w-20 h-8 text-sm"
                      />
                      <Input
                        value={editedOrder.unit || ""}
                        onChange={(e) => updateField("unit", e.target.value)}
                        placeholder="kg"
                        className="w-16 h-8 text-sm"
                      />
                    </div>
                  ) : (
                    <div className="flex flex-col items-end gap-1">
                      {order.actual_quantity && order.actual_quantity !== order.quantity ? (
                        <>
                          <Badge
                            variant="outline"
                            className="bg-orange-50 dark:bg-orange-950/20 text-orange-700 dark:text-orange-300"
                          >
                            Sipariş: {order.quantity} {order.unit}
                          </Badge>
                          <Badge
                            variant="outline"
                            className="bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-300"
                          >
                            Gerçek: {order.actual_quantity} {order.unit}
                          </Badge>
                        </>
                      ) : (
                        <Badge
                          variant="outline"
                          className="bg-orange-50 dark:bg-orange-950/20 text-orange-700 dark:text-orange-300"
                        >
                          {order.quantity} {order.unit}
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {isEditing && (
              <>
                <div className="border-t border-border/50"></div>
                <div className="space-y-3">
                  <Label htmlFor="description" className="text-sm font-medium">
                    Açıklama
                  </Label>
                  <Textarea
                    id="description"
                    value={editedOrder.description || ""}
                    onChange={(e) => updateField("description", e.target.value)}
                    placeholder="Sipariş açıklaması..."
                    rows={2}
                    className="text-sm"
                  />
                </div>
              </>
            )}

            {!isEditing && order.description && (
              <>
                <div className="border-t border-border/50"></div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <div className="h-1 w-1 bg-gray-500 rounded-full"></div>
                    Açıklama
                  </div>
                  <p className="text-sm pl-3 bg-gray-50 dark:bg-gray-900/50 p-3 rounded-lg border">
                    {order.description}
                  </p>
                </div>
              </>
            )}

            <div className="border-t border-border/50"></div>

            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <div className="h-1 w-1 bg-emerald-500 rounded-full"></div>
                Fiyat Bilgileri
              </div>

              {isEditing && (
                <div className="flex items-center space-x-2 pl-3">
                  <Checkbox
                    id="useCustomPrice"
                    checked={useCustomPrice}
                    onCheckedChange={(checked) => {
                      setUseCustomPrice(checked as boolean)
                      updatePricingField("custom_price", checked)
                      if (!checked) {
                        updatePricingField("price_per_unit", undefined)
                        updatePricingField("currency", undefined)
                      }
                    }}
                  />
                  <Label htmlFor="useCustomPrice" className="text-sm">
                    Özel fiyat kullan
                  </Label>
                </div>
              )}

              {isEditing && useCustomPrice && (
                <div className="grid grid-cols-2 gap-3 pl-3">
                  <div>
                    <Label htmlFor="customPrice" className="text-xs text-muted-foreground">
                      Fiyat
                    </Label>
                    <Input
                      id="customPrice"
                      type="number"
                      step="0.01"
                      value={editedOrder.price_per_unit || ""}
                      onChange={(e) =>
                        updatePricingField("price_per_unit", e.target.value ? Number(e.target.value) : undefined)
                      }
                      placeholder="1.80"
                      className="h-8 text-sm"
                    />
                  </div>
                  <div>
                    <Label htmlFor="customCurrency" className="text-xs text-muted-foreground">
                      Para Birimi
                    </Label>
                    <Select
                      value={editedOrder.currency || "€"}
                      onValueChange={(value) => updatePricingField("currency", value)}
                    >
                      <SelectTrigger className="h-8 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="€">€ Euro</SelectItem>
                        <SelectItem value="$">$ Dolar</SelectItem>
                        <SelectItem value="₺">₺ Türk Lirası</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              <div className="pl-3">
                {(() => {
                  const customPricing = editedOrder.custom_price && editedOrder.price_per_unit
                  const automaticPricing = !editedOrder.custom_price && calculateAutomaticPrice()

                  if (isEditing && useCustomPrice && editedOrder.price_per_unit && editedOrder.quantity) {
                    const totalCustom = editedOrder.price_per_unit * editedOrder.quantity
                    return (
                      <div className="bg-emerald-50 dark:bg-emerald-950/20 p-3 rounded-lg border border-emerald-200 dark:border-emerald-800">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-sm">
                            <Euro className="h-4 w-4 text-emerald-600" />
                            <span className="font-medium text-emerald-700 dark:text-emerald-300">
                              {editedOrder.price_per_unit} {editedOrder.currency || "€"}/{editedOrder.unit || "kg"}
                            </span>
                          </div>
                          <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                            {totalCustom.toFixed(2)} {editedOrder.currency || "€"}
                          </Badge>
                        </div>
                      </div>
                    )
                  }

                  if (!isEditing && (order.price_per_unit || order.total_price)) {
                    return (
                      <div className="bg-gray-50 dark:bg-gray-950/20 p-3 rounded-lg border">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-sm">
                            <Euro className="h-4 w-4 text-gray-600" />
                            <span className="font-medium">
                              {order.price_per_unit} {order.currency || "€"}/{order.unit || "kg"}
                            </span>
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            {order.actual_total_price && order.actual_total_price !== order.total_price ? (
                              <>
                                <Badge variant="outline" className="text-xs line-through text-muted-foreground">
                                  Sipariş: {order.total_price?.toFixed(2)} {order.currency || "€"}
                                </Badge>
                                <Badge className="bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-300 border-green-500/20">
                                  Gerçek: {order.actual_total_price.toFixed(2)} {order.currency || "€"}
                                </Badge>
                              </>
                            ) : (
                              <Badge variant="outline">
                                {(order.actual_total_price || order.total_price || 0).toFixed(2)} {order.currency || "€"}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  }

                  return <p className="text-sm text-muted-foreground">Fiyat bilgisi mevcut değil</p>
                })()}
              </div>
            </div>
          </CardContent>
        </Card>

        {(showAllFields || isEditing) && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <div className="h-4 w-4 rounded bg-gradient-to-br from-blue-500 to-purple-500"></div>
                Detaylı Bilgiler
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <div className="h-1 w-1 bg-blue-500 rounded-full"></div>
                  Tarih Bilgileri
                </div>
                <div className="grid grid-cols-1 gap-3 pl-3">
                  <div className="flex justify-between items-center">
                    <Label className="text-sm text-muted-foreground">Oluşturulma</Label>
                    {isEditing ? (
                      <Input
                        type="date"
                        value={editedOrder.created_at || ""}
                        onChange={(e) => updateField("created_at", e.target.value)}
                        className="w-36 h-8 text-sm"
                      />
                    ) : (
                      <Badge variant="outline" className="font-mono text-xs">
                        {order.created_at ? formatDate(order.created_at) : "Invalid Date"}
                      </Badge>
                    )}
                  </div>
                  <div className="flex justify-between items-center">
                    <Label className="text-sm text-muted-foreground">Sipariş Tarihi</Label>
                    {isEditing ? (
                      <Input
                        type="date"
                        value={editedOrder.ordered_date || ""}
                        onChange={(e) => updateField("ordered_date", e.target.value)}
                        className="w-36 h-8 text-sm"
                      />
                    ) : (
                      <Badge variant="outline" className="font-mono text-xs">
                        {order.ordered_date ? formatDate(order.ordered_date) : "-"}
                      </Badge>
                    )}
                  </div>
                  <div className="flex justify-between items-center">
                    <Label className="text-sm text-muted-foreground">Beklenen Geliş</Label>
                    {isEditing ? (
                      <Input
                        type="date"
                        value={editedOrder.eta_date || ""}
                        onChange={(e) => updateField("eta_date", e.target.value)}
                        className="w-36 h-8 text-sm"
                      />
                    ) : (
                      <Badge variant="outline" className="font-mono text-xs">
                        {order.eta_date ? formatDate(order.eta_date) : "-"}
                      </Badge>
                    )}
                  </div>
                  <div className="flex justify-between items-center">
                    <Label className="text-sm text-muted-foreground">Teslim Tarihi</Label>
                    {isEditing ? (
                      <Input
                        type="date"
                        value={editedOrder.delivered_date || ""}
                        onChange={(e) => updateField("delivered_date", e.target.value)}
                        className="w-36 h-8 text-sm"
                      />
                    ) : (
                      <Badge variant="outline" className="font-mono text-xs">
                        {order.delivered_date ? formatDate(order.delivered_date) : "-"}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              <div className="border-t border-border/50"></div>

              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <div className="h-1 w-1 bg-purple-500 rounded-full"></div>
                  Ek Bilgiler
                </div>
                <div className="space-y-3 pl-3">
                  <div>
                    <Label htmlFor="notes" className="text-sm text-muted-foreground">
                      Notlar
                    </Label>
                    {isEditing ? (
                      <Textarea
                        id="notes"
                        value={editedOrder.notes || ""}
                        onChange={(e) => updateField("notes", e.target.value)}
                        placeholder="Ek notlar..."
                        rows={3}
                        className="mt-1 text-sm"
                      />
                    ) : (
                      <div className="mt-1">
                        {order.notes ? (
                          <p className="text-sm bg-gray-50 dark:bg-gray-950/50 p-3 rounded-lg border">{order.notes}</p>
                        ) : (
                          <span className="text-sm text-muted-foreground">-</span>
                        )}
                      </div>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="tags" className="text-sm text-muted-foreground">
                      Etiketler
                    </Label>
                    {isEditing ? (
                      <Input
                        id="tags"
                        value={editedOrder.tags?.join(", ") || ""}
                        onChange={(e) =>
                          updateField(
                            "tags",
                            e.target.value
                              .split(",")
                              .map((tag) => tag.trim())
                              .filter(Boolean),
                          )
                        }
                        placeholder="acil, özel (virgülle ayırın)"
                        className="mt-1 text-sm"
                      />
                    ) : (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {order.tags?.length ? (
                          order.tags.map((tag) => (
                            <Badge key={tag} className="bg-indigo-500/10 text-indigo-600 border-indigo-500/20 text-xs">
                              {tag}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-sm text-muted-foreground">-</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {!isEditing && (
          <Button variant="outline" onClick={() => setShowAllFields(!showAllFields)} className="w-full bg-transparent">
            {showAllFields ? (
              <>
                <ChevronUp className="h-4 w-4 mr-2" />
                Daha Az Alan
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4 mr-2" />
                Daha Fazla Alan
              </>
            )}
          </Button>
        )}

        {isEditing && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" className="w-full">
                <Trash2 className="h-4 w-4 mr-2" />
                Siparişi Sil
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Siparişi silmek istediğinizden emin misiniz?</AlertDialogTitle>
                <AlertDialogDescription>
                  Bu işlem geri alınamaz. Sipariş kalıcı olarak silinecektir.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>İptal</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
                  Sil
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>
    </div>
  )
}
