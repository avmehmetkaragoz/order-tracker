"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { ordersRepo } from "@/lib/orders-repo"
import { settingsRepo } from "@/lib/settings-repo"
import type { Order, OrderFilters, GroupBy, SortBy } from "@/types/order"
import { SearchBar } from "@/components/search-bar"
import { FilterBar } from "@/components/filter-bar"
import { OrderList } from "@/components/order-list"
import { EmptyState } from "@/components/empty-state"
import { LoadingSpinner } from "@/components/loading-spinner"
import { KeyboardShortcuts } from "@/components/keyboard-shortcuts"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Plus, Trash2, Check, X } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function OrdersPage() {
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([])
  const [filters, setFilters] = useState<OrderFilters>({ hideDelivered: false, searchField: "all" })
  const [groupBy, setGroupBy] = useState<GroupBy>("supplier")
  const [sortBy, setSortBy] = useState<SortBy>("newest")
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)
  const [isRetrying, setIsRetrying] = useState(false)
  const [selectedOrders, setSelectedOrders] = useState<string[]>([])
  const [showSelection, setShowSelection] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [orderToDelete, setOrderToDelete] = useState<string | null>(null)
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false)
  const [warehouseDeleteDialogOpen, setWarehouseDeleteDialogOpen] = useState(false)
  const [orderWithWarehouse, setOrderWithWarehouse] = useState<{ orderId: string; warehouseItemId: string } | null>(
    null,
  )
  const [deleteFromWarehouseToo, setDeleteFromWarehouseToo] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    loadOrders()
  }, [])

  useEffect(() => {
    applyFiltersAndSort()
  }, [orders, filters, sortBy])

  const loadOrders = async (isRetry = false) => {
    try {
      if (isRetry) {
        setIsRetrying(true)
      } else {
        setIsLoading(true)
      }
      setError(null)

      const allOrders = await ordersRepo.list()

      if (!Array.isArray(allOrders)) {
        throw new Error("Invalid response format")
      }

      setOrders(allOrders)
      setRetryCount(0)
      setError(null)
    } catch (err) {
      console.error("[v0] Error loading orders:", err)
      const errorMessage = err instanceof Error ? err.message : "Bilinmeyen hata"
      setError(`Siparişler yüklenirken hata oluştu: ${errorMessage}`)

      // Auto-retry up to 3 times with exponential backoff
      if (retryCount < 3) {
        const delay = Math.pow(2, retryCount) * 1000 // 1s, 2s, 4s
        setTimeout(() => {
          setRetryCount((prev) => prev + 1)
          loadOrders(true)
        }, delay)
      }
    } finally {
      setIsLoading(false)
      setIsRetrying(false)
    }
  }

  const applyFiltersAndSort = async () => {
    try {
      const filtered = await ordersRepo.list(filters)

      if (!Array.isArray(filtered)) {
        console.warn("[v0] Invalid filtered orders response, using empty array")
        setFilteredOrders([])
        return
      }

      filtered.sort((a, b) => {
        switch (sortBy) {
          case "newest":
            return new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime()
          case "eta":
            if (!a.eta_date && !b.eta_date) return 0
            if (!a.eta_date) return 1
            if (!b.eta_date) return -1
            return new Date(a.eta_date).getTime() - new Date(b.eta_date).getTime()
          case "supplier":
            return a.supplier.localeCompare(b.supplier, "tr")
          case "requester":
            return a.requester.localeCompare(b.requester, "tr")
          default:
            return 0
        }
      })

      setFilteredOrders(filtered)
    } catch (err) {
      console.error("[v0] Error applying filters:", err)
      // Fallback to showing all orders without filters
      setFilteredOrders(orders)
      toast({
        title: "Filtreleme hatası",
        description: "Filtreler uygulanırken hata oluştu, tüm siparişler gösteriliyor.",
        variant: "destructive",
      })
    }
  }

  const handleRetry = () => {
    setRetryCount(0)
    loadOrders()
  }

  const handleSearch = (search: string, field?: string) => {
    setFilters((prev) => ({ ...prev, search, searchField: field }))
  }

  const handleFilterChange = (newFilters: Partial<OrderFilters>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }))
  }

  const handleOrderUpdate = async (orderId: string, updates: Partial<Order>) => {
    await ordersRepo.update(orderId, updates)
    await loadOrders()
  }

  const handleMarkDelivered = async (orderId: string) => {
    await ordersRepo.update(orderId, {
      status: "Delivered",
      delivered_date: new Date().toISOString().split("T")[0],
    })
    await loadOrders()
  }

  const handleDeleteOrder = async (orderId: string) => {
    try {
      console.log("[v0] Starting deletion process for order:", orderId)
      const { warehouseRepo } = await import("@/lib/warehouse-repo")
      const warehouseItems = await warehouseRepo.getItemsByOrderId(orderId)
      console.log("[v0] Found warehouse items:", warehouseItems)

      if (warehouseItems && warehouseItems.length > 0) {
        console.log("[v0] Order has warehouse items, showing warehouse deletion dialog")
        setOrderWithWarehouse({ orderId, warehouseItemId: warehouseItems[0].id })
        setWarehouseDeleteDialogOpen(true)
      } else {
        console.log("[v0] No warehouse items found, showing regular deletion dialog")
        setOrderToDelete(orderId)
        setDeleteDialogOpen(true)
      }
    } catch (error) {
      console.error("[v0] Error checking warehouse items:", error)
      setOrderToDelete(orderId)
      setDeleteDialogOpen(true)
    }
  }

  const handleStatusChange = async (orderId: string, newStatus: Order["status"]) => {
    const updates: Partial<Order> = { status: newStatus }

    if (newStatus === "Delivered") {
      updates.delivered_date = new Date().toISOString().split("T")[0]
    }

    await ordersRepo.update(orderId, updates)
    await loadOrders()

    toast({
      title: "Durum güncellendi",
      description: `Sipariş durumu "${
        newStatus === "Delivered"
          ? "Teslim Edildi"
          : newStatus === "Ordered"
            ? "Sipariş Verildi"
            : newStatus === "Cancelled"
              ? "İptal Edildi"
              : newStatus === "Return"
                ? "İade"
                : "Talep Edildi"
      }" olarak değiştirildi.`,
    })
  }

  const handleRequesterChange = async (orderId: string, newRequester: string) => {
    const currentRequesters = await settingsRepo.getRequesters()
    if (!currentRequesters.includes(newRequester)) {
      await settingsRepo.addRequester(newRequester)
    }

    await ordersRepo.update(orderId, { requester: newRequester })
    await loadOrders()

    toast({
      title: "Sipariş veren güncellendi",
      description: `Sipariş veren "${newRequester}" olarak değiştirildi.`,
    })
  }

  const handleSupplierChange = async (orderId: string, newSupplier: string) => {
    const currentSuppliers = await settingsRepo.getSuppliers()
    if (!currentSuppliers.includes(newSupplier)) {
      await settingsRepo.addSupplier(newSupplier)
    }

    await ordersRepo.update(orderId, { supplier: newSupplier })
    await loadOrders()

    toast({
      title: "Tedarikçi güncellendi",
      description: `Tedarikçi "${newSupplier}" olarak değiştirildi.`,
    })
  }

  const confirmDelete = async () => {
    if (orderToDelete) {
      const success = await ordersRepo.remove(orderToDelete)
      if (success) {
        await loadOrders()
        toast({
          title: "Sipariş silindi",
          description: "Sipariş başarıyla silindi.",
        })
      }
    }
    setDeleteDialogOpen(false)
    setOrderToDelete(null)
  }

  const confirmBulkDelete = async () => {
    const deletedCount = await ordersRepo.removeBulk(selectedOrders)
    await loadOrders()
    setSelectedOrders([])
    setShowSelection(false)
    toast({
      title: "Siparişler silindi",
      description: `${deletedCount} sipariş başarıyla silindi.`,
    })
    setBulkDeleteDialogOpen(false)
  }

  const handleSelectionChange = (orderId: string, selected: boolean) => {
    if (selected) {
      setSelectedOrders((prev) => [...prev, orderId])
    } else {
      setSelectedOrders((prev) => prev.filter((id) => id !== orderId))
    }
  }

  const toggleSelectionMode = () => {
    setShowSelection(!showSelection)
    setSelectedOrders([])
  }

  const selectAll = () => {
    setSelectedOrders(filteredOrders.map((order) => order.id))
  }

  const deselectAll = () => {
    setSelectedOrders([])
  }

  const confirmWarehouseDelete = async () => {
    if (orderWithWarehouse) {
      const { orderId, warehouseItemId } = orderWithWarehouse

      console.log("[v0] Starting warehouse deletion process")
      console.log("[v0] Order ID:", orderId)
      console.log("[v0] Delete from warehouse too:", deleteFromWarehouseToo)

      let warehouseItems: any[] = []
      if (deleteFromWarehouseToo) {
        console.log("[v0] Getting warehouse items before order deletion")
        const { warehouseRepo } = await import("@/lib/warehouse-repo")
        try {
          warehouseItems = await warehouseRepo.getItemsByOrderId(orderId)
          console.log("[v0] Warehouse items to delete:", warehouseItems)
        } catch (error) {
          console.error("[v0] Error getting warehouse items:", error)
        }
      }

      if (deleteFromWarehouseToo && warehouseItems.length > 0) {
        console.log("[v0] Deleting warehouse items before order deletion")
        const { warehouseRepo } = await import("@/lib/warehouse-repo")
        try {
          for (const item of warehouseItems) {
            console.log("[v0] Deleting warehouse item:", item.id)
            const deleteResult = await warehouseRepo.deleteItem(item.id)
            console.log("[v0] Warehouse item deletion result:", deleteResult)
          }
          console.log("[v0] All warehouse items deleted successfully")
        } catch (error) {
          console.error("[v0] Error deleting warehouse items:", error)
          toast({
            title: "Hata",
            description: "Depo ürünleri silinirken hata oluştu.",
            variant: "destructive",
          })
          setWarehouseDeleteDialogOpen(false)
          setOrderWithWarehouse(null)
          setDeleteFromWarehouseToo(false)
          return
        }
      }

      const orderSuccess = await ordersRepo.remove(orderId)
      console.log("[v0] Order deletion success:", orderSuccess)

      if (orderSuccess) {
        console.log("[v0] Reloading orders after deletion")
        await loadOrders()

        if (deleteFromWarehouseToo && warehouseItems.length > 0) {
          toast({
            title: "Sipariş ve depo ürünü silindi",
            description: "Sipariş ve ilgili depo ürünü başarıyla silindi.",
          })
        } else {
          toast({
            title: "Sipariş silindi",
            description: deleteFromWarehouseToo
              ? "Sipariş silindi, depo ürünü bulunamadı."
              : "Sipariş silindi, depo ürünü korundu.",
          })
        }
      }
    }

    setWarehouseDeleteDialogOpen(false)
    setOrderWithWarehouse(null)
    setDeleteFromWarehouseToo(false)
  }

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === "f") {
        e.preventDefault()
        const searchInput = document.querySelector('input[placeholder*="ara"]') as HTMLInputElement
        if (searchInput) {
          searchInput.focus()
          searchInput.select()
        }
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <LoadingSpinner size="lg" />
          <p className="text-muted-foreground">Siparişler yükleniyor...</p>
          {retryCount > 0 && <p className="text-sm text-orange-600">Yeniden deneniyor... ({retryCount}/3)</p>}
        </div>
      </div>
    )
  }

  if (error && orders.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4 max-w-md mx-auto px-4">
          <div className="text-red-500 text-lg">⚠️</div>
          <h2 className="text-lg font-semibold">Bağlantı Hatası</h2>
          <p className="text-muted-foreground text-sm">{error}</p>
          <div className="space-y-2">
            <Button onClick={handleRetry} disabled={isRetrying}>
              {isRetrying ? "Yeniden deneniyor..." : "Tekrar Dene"}
            </Button>
            <p className="text-xs text-muted-foreground">
              Sorun devam ederse lütfen internet bağlantınızı kontrol edin
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <KeyboardShortcuts />

      {error && orders.length > 0 && (
        <div className="bg-orange-50 dark:bg-orange-950/50 border-b border-orange-200 dark:border-orange-800">
          <div className="container mx-auto px-4 py-2 max-w-md">
            <div className="flex items-center justify-between text-sm">
              <span className="text-orange-700 dark:text-orange-300">Bazı veriler yüklenemedi</span>
              <Button variant="ghost" size="sm" onClick={handleRetry} disabled={isRetrying}>
                {isRetrying ? "Yeniden deneniyor..." : "Yenile"}
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="container mx-auto px-4 py-4 max-w-md">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold">Siparişler</h1>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={toggleSelectionMode}
                className={showSelection ? "bg-blue-50 text-blue-600" : ""}
              >
                {showSelection ? <X className="h-4 w-4" /> : <Check className="h-4 w-4" />}
              </Button>
              <div className="text-sm text-muted-foreground">{filteredOrders.length} sipariş</div>
            </div>
          </div>

          {showSelection && (
            <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-950/50 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                    {selectedOrders.length} sipariş seçili
                  </span>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="sm" onClick={selectAll} className="h-7 px-2 text-xs">
                      Tümünü Seç
                    </Button>
                    <Button variant="ghost" size="sm" onClick={deselectAll} className="h-7 px-2 text-xs">
                      Temizle
                    </Button>
                  </div>
                </div>
                {selectedOrders.length > 0 && (
                  <Button variant="destructive" size="sm" onClick={confirmBulkDelete} className="h-8">
                    <Trash2 className="h-3 w-3 mr-1" />
                    Sil ({selectedOrders.length})
                  </Button>
                )}
              </div>
            </div>
          )}

          <SearchBar onSearch={handleSearch} />

          <FilterBar
            filters={filters}
            onFilterChange={handleFilterChange}
            groupBy={groupBy}
            onGroupByChange={setGroupBy}
            sortBy={sortBy}
            onSortByChange={setSortBy}
            orders={orders}
          />
        </div>
      </div>

      <div className="container mx-auto px-4 max-w-md">
        <OrderList
          orders={filteredOrders}
          groupBy={groupBy}
          onMarkDelivered={handleMarkDelivered}
          onOrderClick={(orderId) => {
            router.push(`/orders/${orderId}`)
          }}
          onDelete={handleDeleteOrder}
          selectedOrders={selectedOrders}
          onSelectionChange={handleSelectionChange}
          showSelection={showSelection}
          onStatusChange={handleStatusChange}
          onRequesterChange={handleRequesterChange}
          onSupplierChange={handleSupplierChange}
        />

        {filteredOrders.length === 0 && (
          <EmptyState
            icon="🔍"
            title="Sipariş bulunamadı"
            description="Filtreleri değiştirin veya yeni sipariş oluşturun"
            actionLabel="İlk siparişinizi oluşturun"
            onAction={() => router.push("/orders/new")}
          />
        )}
      </div>

      <Button
        size="lg"
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-shadow active:scale-95"
        onClick={() => router.push("/orders/new")}
      >
        <Plus className="h-6 w-6" />
        <span className="sr-only">Yeni sipariş oluştur</span>
      </Button>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Siparişi Sil</AlertDialogTitle>
            <AlertDialogDescription>
              Bu siparişi silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>İptal</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
              Sil
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={bulkDeleteDialogOpen} onOpenChange={setBulkDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Seçili Siparişleri Sil</AlertDialogTitle>
            <AlertDialogDescription>
              {selectedOrders.length} siparişi silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>İptal</AlertDialogCancel>
            <AlertDialogAction onClick={confirmBulkDelete} className="bg-red-600 hover:bg-red-700">
              Sil ({selectedOrders.length})
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={warehouseDeleteDialogOpen} onOpenChange={setWarehouseDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Sipariş ve Depo Ürünü</AlertDialogTitle>
            <AlertDialogDescription>
              Bu sipariş depoda kayıtlı bir ürüne sahip. Nasıl silmek istiyorsunuz?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <div className="space-y-3">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  name="deleteOption"
                  checked={!deleteFromWarehouseToo}
                  onChange={() => setDeleteFromWarehouseToo(false)}
                  className="w-4 h-4"
                />
                <span className="text-sm">Sadece siparişi sil (depo ürünü korunsun)</span>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  name="deleteOption"
                  checked={deleteFromWarehouseToo}
                  onChange={() => setDeleteFromWarehouseToo(true)}
                  className="w-4 h-4"
                />
                <span className="text-sm">Hem siparişi hem depo ürünü sil</span>
              </label>
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>İptal</AlertDialogCancel>
            <AlertDialogAction onClick={confirmWarehouseDelete} className="bg-red-600 hover:bg-red-700">
              Sil
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
