"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { warehouseRepo } from "@/lib/warehouse-repo"
import { OrderWarehouseIntegration } from "@/lib/order-warehouse-integration"
import type { WarehouseItem, WarehouseFilters, WarehouseSummary } from "@/types/warehouse"
import type { Order } from "@/types/order"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { LoadingSpinner } from "@/components/loading-spinner"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/hooks/use-toast"
import {
  Package,
  Plus,
  Search,
  BarChart3,
  AlertTriangle,
  CheckCircle,
  Clock,
  XCircle,
  ArrowLeft,
  QrCode,
  Truck,
  ShoppingCart,
  Trash2,
  Edit,
  X,
} from "lucide-react"

export default function WarehousePage() {
  const [items, setItems] = useState<WarehouseItem[]>([])
  const [summary, setSummary] = useState<WarehouseSummary | null>(null)
  const [orderSummary, setOrderSummary] = useState<any>(null)
  const [undeliveredOrders, setUndeliveredOrders] = useState<Order[]>([])
  const [filters, setFilters] = useState<WarehouseFilters>({})
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set())
  const [isSelectionMode, setIsSelectionMode] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    loadWarehouseData()
  }, [filters])

  const loadWarehouseData = async () => {
    setIsLoading(true)
    try {
      const [warehouseItems, warehouseSummary, orderWarehouseSummary] = await Promise.all([
        warehouseRepo.getItems(filters),
        warehouseRepo.getWarehouseSummary(),
        OrderWarehouseIntegration.getOrderWarehouseSummary(),
      ])
      setItems(warehouseItems)
      setSummary(warehouseSummary)
      setOrderSummary(orderWarehouseSummary)

      try {
        const receivableOrders = await OrderWarehouseIntegration.getReceivableOrders()
        // Ensure receivableOrders is an array before calling slice
        const ordersArray = Array.isArray(receivableOrders) ? receivableOrders : []
        setUndeliveredOrders(ordersArray.slice(0, 5))
      } catch (error) {
        console.error("Error loading receivable orders:", error)
        setUndeliveredOrders([])
      }
    } catch (error) {
      console.error("Error loading warehouse data:", error)
      setItems([])
      setSummary(null)
      setOrderSummary(null)
      setUndeliveredOrders([])
    } finally {
      setIsLoading(false)
    }
  }

  const handleSearch = (value: string) => {
    setSearchTerm(value)
    setFilters({ ...filters, search: value })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Stokta":
      case "In Stock":
        return "bg-green-500"
      case "Rezerve":
      case "Reserved":
        return "bg-yellow-500"
      case "Stok Yok":
      case "Out of Stock":
        return "bg-red-500"
      case "Hasarlı":
      case "Damaged":
        return "bg-gray-500"
      default:
        return "bg-gray-500"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Stokta":
      case "In Stock":
        return <CheckCircle className="h-4 w-4" />
      case "Rezerve":
      case "Reserved":
        return <Clock className="h-4 w-4" />
      case "Stok Yok":
      case "Out of Stock":
        return <XCircle className="h-4 w-4" />
      case "Hasarlı":
      case "Damaged":
        return <AlertTriangle className="h-4 w-4" />
      default:
        return <Package className="h-4 w-4" />
    }
  }

  const getStatusInTurkish = (status: string) => {
    switch (status) {
      case "In Stock":
        return "Stokta"
      case "Reserved":
        return "Rezerve"
      case "Out of Stock":
        return "Stok Yok"
      case "Damaged":
        return "Hasarlı"
      default:
        return status
    }
  }

  const handleSelectItem = (itemId: string, checked: boolean) => {
    const newSelected = new Set(selectedItems)
    if (checked) {
      newSelected.add(itemId)
    } else {
      newSelected.delete(itemId)
    }
    setSelectedItems(newSelected)
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedItems(new Set(items.map((item) => item.id)))
    } else {
      setSelectedItems(new Set())
    }
  }

  const handleDeleteSelected = async () => {
    if (selectedItems.size === 0) return

    if (!confirm(`${selectedItems.size} ürünü silmek istediğinizden emin misiniz?`)) {
      return
    }

    try {
      for (const itemId of selectedItems) {
        await warehouseRepo.deleteItem(itemId)
      }

      toast({
        title: "Başarılı",
        description: `${selectedItems.size} ürün silindi`,
      })

      setSelectedItems(new Set())
      setIsSelectionMode(false)
      loadWarehouseData()
    } catch (error) {
      toast({
        title: "Hata",
        description: "Ürünler silinirken bir hata oluştu",
        variant: "destructive",
      })
    }
  }

  const handleDeleteItem = async (itemId: string, e: React.MouseEvent) => {
    e.stopPropagation()

    if (!confirm("Bu ürünü silmek istediğinizden emin misiniz?")) {
      return
    }

    try {
      await warehouseRepo.deleteItem(itemId)
      toast({
        title: "Başarılı",
        description: "Ürün silindi",
      })
      loadWarehouseData()
    } catch (error) {
      toast({
        title: "Hata",
        description: "Ürün silinirken bir hata oluştu",
        variant: "destructive",
      })
    }
  }

  const handleEditItem = (itemId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    window.location.href = `/warehouse/${itemId}?edit=true`
  }

  const exitSelectionMode = () => {
    setIsSelectionMode(false)
    setSelectedItems(new Set())
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="text-muted-foreground mt-4">Depo verileri yükleniyor...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 max-w-md">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="sm" onClick={() => window.history.back()} className="p-2">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">Depo Yönetimi</h1>
            <p className="text-sm text-muted-foreground">Stok takibi ve barkod yönetimi</p>
          </div>
          {!isSelectionMode && items.length > 0 && (
            <Button variant="outline" size="sm" onClick={() => setIsSelectionMode(true)}>
              Seç
            </Button>
          )}
        </div>

        {/* Bulk Action Bar */}
        {isSelectionMode && (
          <Card className="mb-4 border-primary">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Checkbox
                    checked={selectedItems.size === items.length && items.length > 0}
                    onCheckedChange={handleSelectAll}
                  />
                  <span className="text-sm font-medium">
                    {selectedItems.size > 0 ? `${selectedItems.size} seçili` : "Tümünü seç"}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {selectedItems.size > 0 && (
                    <Button variant="destructive" size="sm" onClick={handleDeleteSelected}>
                      <Trash2 className="h-4 w-4 mr-1" />
                      Sil ({selectedItems.size})
                    </Button>
                  )}
                  <Button variant="ghost" size="sm" onClick={exitSelectionMode}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Summary Cards */}
        {summary && (
          <div className="grid grid-cols-2 gap-3 mb-6">
            <Card>
              <CardContent className="p-4 text-center">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <Package className="h-4 w-4 text-primary" />
                  <span className="text-2xl font-bold text-primary">{summary.totalItems || 0}</span>
                </div>
                <div className="text-xs text-muted-foreground">Toplam Ürün</div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 text-center">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <BarChart3 className="h-4 w-4 text-blue-500" />
                  <span className="text-2xl font-bold text-blue-500">
                    {summary.totalWeight && !isNaN(summary.totalWeight) ? Math.round(summary.totalWeight) : 0}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground">Toplam KG</div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 text-center">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-2xl font-bold text-green-500">
                    {summary.itemsByStatus?.["Stokta"] || 0}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground">Stokta</div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 text-center">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <Truck className="h-4 w-4 text-orange-500" />
                  <span className="text-2xl font-bold text-orange-500">{orderSummary?.pendingReceival || 0}</span>
                </div>
                <div className="text-xs text-muted-foreground">Bekleyen Kabul</div>
                {(orderSummary?.pendingReceival || 0) > 0 && (
                  <Badge variant="destructive" className="text-xs mt-1">
                    Dikkat!
                  </Badge>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Undelivered Orders Card */}
        {undeliveredOrders.length > 0 && (
          <Card className="mb-6">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <ShoppingCart className="h-4 w-4 text-orange-500" />
                Bekleyen Siparişler
              </CardTitle>
              <CardDescription className="text-xs">
                Henüz teslim edilmemiş siparişler ({undeliveredOrders.length} adet)
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-2">
                {undeliveredOrders.map((order) => (
                  <div
                    key={order.id}
                    className="flex items-center justify-between p-2 bg-muted/30 rounded-md cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => (window.location.href = `/orders/${order.id}`)}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium truncate">
                        {order.requester} → {order.supplier}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {order.cm}cm • {order.mikron}μ • {order.material}
                        {order.quantity && ` • ${order.quantity}kg`}
                        {order.bobin_sayisi && ` • ${order.bobin_sayisi} bobin`}
                      </div>
                    </div>
                    <Badge variant="outline" className="text-xs ml-2">
                      {order.status === "Requested" && "Talep Edildi"}
                      {order.status === "Ordered" && "Sipariş Verildi"}
                      {order.status === "Return" && "İade"}
                    </Badge>
                  </div>
                ))}
              </div>
              {undeliveredOrders.length >= 5 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full mt-3 text-xs"
                  onClick={() => (window.location.href = "/orders")}
                >
                  Tüm Siparişleri Görüntüle
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {/* Search and Actions */}
        <div className="space-y-3 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Barkod, malzeme, tedarikçi ara..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="grid grid-cols-3 gap-2">
            <Button
              variant="outline"
              size="sm"
              className="bg-transparent"
              onClick={() => (window.location.href = "/warehouse/new")}
            >
              <Plus className="h-4 w-4 mr-1" />
              Yeni Ürün
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="bg-transparent"
              onClick={() => (window.location.href = "/warehouse/receive")}
            >
              <Truck className="h-4 w-4 mr-1" />
              Sipariş Kabul
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="bg-transparent"
              onClick={() => (window.location.href = "/barcode-scanner")}
            >
              <QrCode className="h-4 w-4 mr-1" />
              Barkod Oku
            </Button>
          </div>
        </div>

        {/* Test Data Button */}
        {items.length === 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Depo Boş
              </CardTitle>
              <CardDescription>Yeni ürün ekleyerek depo yönetimine başlayın</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => (window.location.href = "/warehouse/new")} className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                İlk Ürünü Ekle
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Warehouse Items List */}
        <div className="space-y-3">
          {items.map((item) => (
            <Card
              key={item.id}
              className={`cursor-pointer hover:bg-accent/50 transition-colors ${
                isSelectionMode ? "border-primary/20" : ""
              }`}
              onClick={() => {
                if (isSelectionMode) {
                  handleSelectItem(item.id, !selectedItems.has(item.id))
                } else {
                  window.location.href = `/warehouse/${item.id}`
                }
              }}
            >
              <CardContent className="p-4">
                {/* Selection Checkbox and Individual Action Buttons */}
                <div className="flex items-start gap-3">
                  {isSelectionMode && (
                    <Checkbox
                      checked={selectedItems.has(item.id)}
                      onCheckedChange={(checked) => handleSelectItem(item.id, checked as boolean)}
                      onClick={(e) => e.stopPropagation()}
                    />
                  )}

                  <div className="flex-1">
                    {/* Header with status */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${getStatusColor(item.status)}`} />
                        <span className="font-medium text-sm">{item.supplier}</span>
                        {item.orderId && (
                          <Badge variant="outline" className="text-xs">
                            Sipariş Bağlantılı
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {item.location || "Konum yok"}
                        </Badge>
                        {!isSelectionMode && (
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              onClick={(e) => handleEditItem(item.id, e)}
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                              onClick={(e) => handleDeleteItem(item.id, e)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Specifications */}
                    <div className="mb-3">
                      <div className="text-sm font-medium text-foreground mb-1">
                        {item.cm || 0}cm • {item.mikron || 0}μ • {item.material || "N/A"}
                      </div>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>
                          {item.currentWeight || 0}kg / {item.originalWeight || 0}kg
                        </span>
                        <span>{item.bobinCount || 0} bobin</span>
                      </div>
                    </div>

                    {/* Status and Barcode */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(item.status)}
                        <span className="text-xs text-muted-foreground">{getStatusInTurkish(item.status)}</span>
                      </div>
                      <div className="text-xs font-mono text-muted-foreground">{item.barcode}</div>
                    </div>

                    {/* Low stock warning */}
                    {(item.currentWeight || 0) < 50 && item.status === "Stokta" && (
                      <div className="mt-2 p-2 bg-orange-50 dark:bg-orange-950/20 rounded-md">
                        <div className="flex items-center gap-2 text-orange-600 dark:text-orange-400">
                          <AlertTriangle className="h-3 w-3" />
                          <span className="text-xs">Düşük stok seviyesi</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Empty State */}
        {items.length === 0 && summary?.totalItems === 0 && (
          <div className="text-center py-12">
            <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Depo Boş</h3>
            <p className="text-muted-foreground mb-4">Henüz depoya ürün eklenmemiş</p>
            <Button onClick={() => (window.location.href = "/warehouse/new")}>
              <Plus className="h-4 w-4 mr-2" />
              İlk Ürünü Ekle
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
