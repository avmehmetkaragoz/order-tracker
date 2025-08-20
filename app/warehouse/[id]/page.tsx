"use client"

import { use, useEffect, useState } from "react"
import { warehouseRepo } from "@/lib/warehouse-repo"
import { ordersRepo } from "@/lib/orders-repo"
import type { WarehouseItem, StockMovement } from "@/types/warehouse"
import type { Order } from "@/types/order"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { LoadingSpinner } from "@/components/loading-spinner"
import { BarcodePrinter } from "@/components/barcode-printer"
import { ReturnBarcodePrinter } from "@/components/return-barcode-printer"
import { ArrowLeft, Package, History, Edit, TrendingDown, TrendingUp, RotateCcw, LogOut, Undo2, ExternalLink } from "lucide-react"
import { ProductExitDialog, type ProductExitData } from "@/components/product-exit-dialog"
import { ProductEditDialog, type ProductEditData } from "@/components/product-edit-dialog"
import { ProductReturnDialog, type ProductReturnData } from "@/components/product-return-dialog"

export default function WarehouseItemDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: itemId } = use(params)
  const [item, setItem] = useState<WarehouseItem | null>(null)
  const [movements, setMovements] = useState<StockMovement[]>([])
  const [orderDetails, setOrderDetails] = useState<Order | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isExitDialogOpen, setIsExitDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isReturnDialogOpen, setIsReturnDialogOpen] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)

  useEffect(() => {
    loadItemData()
  }, [itemId])

  const loadItemData = async () => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(itemId)) {
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    try {
      const [warehouseItem, stockMovements] = await Promise.all([
        warehouseRepo.getItemById(itemId),
        warehouseRepo.getStockMovements(itemId),
      ])
      setItem(warehouseItem)
      setMovements(stockMovements)

      // Load order details if item has orderId
      if (warehouseItem?.orderId) {
        try {
          const order = await ordersRepo.get(warehouseItem.orderId)
          setOrderDetails(order)
        } catch (error) {
          console.error("Error loading order details:", error)
          setOrderDetails(null)
        }
      } else {
        setOrderDetails(null)
      }
    } catch (error) {
      console.error("Error loading item data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Stokta":
        return "bg-green-500"
      case "Rezerve":
        return "bg-yellow-500"
      case "Stok Yok":
        return "bg-red-500"
      case "Hasarlı":
        return "bg-gray-500"
      default:
        return "bg-gray-500"
    }
  }

  const getMovementIcon = (type: string) => {
    switch (type) {
      case "Gelen":
        return <TrendingUp className="h-4 w-4 text-green-500" />
      case "Çıkan":
        return <TrendingDown className="h-4 w-4 text-red-500" />
      case "İade":
        return <RotateCcw className="h-4 w-4 text-blue-500" />
      default:
        return <History className="h-4 w-4 text-gray-500" />
    }
  }

  const translateNotes = (notes: string) => {
    if (!notes) return notes

    const translations: { [key: string]: string } = {
      "Initial stock entry": "İlk stok girişi",
      "initial stock entry": "İlk stok girişi",
      "Stock adjustment": "Stok düzeltmesi",
      "stock adjustment": "Stok düzeltmesi",
      "Damaged goods": "Hasarlı ürün",
      "damaged goods": "Hasarlı ürün",
      "Returned from": "İade edildi:",
      "returned from": "İade edildi:",
      "Sent to": "Gönderildi:",
      "sent to": "Gönderildi:",
    }

    let translatedNotes = notes
    Object.entries(translations).forEach(([english, turkish]) => {
      translatedNotes = translatedNotes.replace(new RegExp(english, "gi"), turkish)
    })

    return translatedNotes
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("tr-TR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const handleProductExit = async (exitData: ProductExitData) => {
    if (!item) return

    setIsProcessing(true)
    try {
      console.log("[v1] Processing product exit:", exitData)
      
      const updatedItem = await warehouseRepo.processProductExit(item.id, exitData)
      
      if (updatedItem) {
        setItem(updatedItem)
        // Reload movements to show the new exit record
        const updatedMovements = await warehouseRepo.getStockMovements(item.id)
        setMovements(updatedMovements)
        
        setIsExitDialogOpen(false)
        console.log("[v1] Product exit processed successfully")
      } else {
        console.error("[v1] Failed to process product exit")
        // TODO: Show error toast
      }
    } catch (error) {
      console.error("[v1] Error processing product exit:", error)
      // TODO: Show error toast
    } finally {
      setIsProcessing(false)
    }
  }

  const handleProductEdit = async (editData: ProductEditData) => {
    if (!item) return

    setIsProcessing(true)
    try {
      console.log("[v1] Processing product edit:", editData)
      
      const updatedItem = await warehouseRepo.updateItemDetails(item.id, editData)
      
      if (updatedItem) {
        setItem(updatedItem)
        // Reload movements to show the new edit record
        const updatedMovements = await warehouseRepo.getStockMovements(item.id)
        setMovements(updatedMovements)
        
        setIsEditDialogOpen(false)
        console.log("[v1] Product edit processed successfully")
      } else {
        console.error("[v1] Failed to process product edit")
        // TODO: Show error toast
      }
    } catch (error) {
      console.error("[v1] Error processing product edit:", error)
      // TODO: Show error toast
    } finally {
      setIsProcessing(false)
    }
  }

  const handleProductReturn = async (returnData: ProductReturnData) => {
    if (!item) return

    setIsProcessing(true)
    try {
      console.log("[v1] Processing product return:", returnData)
      
      const updatedItem = await warehouseRepo.processProductReturn(item.id, returnData)
      
      if (updatedItem) {
        setItem(updatedItem)
        // Reload movements to show the new return record
        const updatedMovements = await warehouseRepo.getStockMovements(item.id)
        setMovements(updatedMovements)
        
        setIsReturnDialogOpen(false)
        console.log("[v1] Product return processed successfully")
        
        // TODO: Generate and print return barcode if requested
        if (returnData.generateReturnBarcode) {
          console.log("[v1] Generating return barcode...")
          // This will be implemented when we add barcode generation
        }
      } else {
        console.error("[v1] Failed to process product return")
        // TODO: Show error toast
      }
    } catch (error) {
      console.error("[v1] Error processing product return:", error)
      // TODO: Show error toast
    } finally {
      setIsProcessing(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="text-muted-foreground mt-4">Ürün bilgileri yükleniyor...</p>
        </div>
      </div>
    )
  }

  if (!item) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">Ürün Bulunamadı</h3>
          <p className="text-muted-foreground mb-4">Aradığınız ürün mevcut değil</p>
          <Button onClick={() => (window.location.href = "/warehouse")}>Depoya Dön</Button>
        </div>
      </div>
    )
  }

  // Check if there are return movements to determine barcode display logic
  const hasReturnMovements = movements.some(
    movement => movement.type === "Gelen" && 
    movement.notes && 
    movement.notes.includes("Ürün dönüş")
  )

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 max-w-md">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="sm" onClick={() => window.history.back()} className="p-2">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">Ürün Detayı</h1>
            <p className="text-sm text-muted-foreground">{item.barcode}</p>
          </div>
        </div>

        {/* Product Actions */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <Button 
            variant="outline" 
            className="w-full bg-transparent"
            onClick={() => setIsExitDialogOpen(true)}
            disabled={!item || (item.currentWeight || 0) <= 0}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Ürün Çıkış
          </Button>
          
          <Button 
            variant="outline" 
            className="w-full bg-transparent"
            onClick={() => setIsReturnDialogOpen(true)}
            disabled={isProcessing}
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Ürün Dönüş
          </Button>
        </div>

        {/* Item Details */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                {item.cm}cm • {item.mikron}μ • {item.material}
              </CardTitle>
              <div className={`w-3 h-3 rounded-full ${getStatusColor(item.status)}`} />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-muted-foreground">Mevcut Ağırlık</div>
                <div className="text-2xl font-bold text-primary">{item.currentWeight || 0}kg</div>
                <div className="text-xs text-muted-foreground">/ {item.originalWeight || 0}kg orijinal</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Bobin Sayısı</div>
                <div className="text-2xl font-bold text-primary">{item.bobinCount || 0}</div>
                <div className="text-xs text-muted-foreground">adet</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-muted-foreground">Tedarikçi</div>
                <div className="font-medium">{item.supplier}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Durum</div>
                <Badge variant="outline">{item.status}</Badge>
              </div>
              <div>
                <div className="text-muted-foreground">Konum</div>
                <div className="font-medium">{item.location === "Genel Depo" ? "Depo" : (item.location || "Depo")}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Alış Tarihi</div>
                <div className="font-medium">
                  {item.receivedDate ? formatDate(item.receivedDate) : "Belirtilmemiş"}
                </div>
              </div>
              {/* Customer info if available */}
              {orderDetails?.customer && (
                <div>
                  <div className="text-muted-foreground">Müşteri</div>
                  <div className="font-medium text-blue-600 dark:text-blue-400">{orderDetails.customer}</div>
                </div>
              )}
            </div>

            {item.notes && (
              <div>
                <div className="text-sm text-muted-foreground mb-1">Notlar</div>
                <div className="text-sm bg-muted/50 p-3 rounded-md">{translateNotes(item.notes)}</div>
              </div>
            )}

            {/* Actions inside card */}
            <div className="grid grid-cols-1 gap-3 pt-2">
              <Button 
                variant="outline" 
                className="w-full bg-transparent"
                onClick={() => setIsEditDialogOpen(true)}
                disabled={isProcessing}
              >
                <Edit className="h-4 w-4 mr-2" />
                Ürün Bilgilerini Düzenle
              </Button>
              
              {/* Order redirect button - only show if item came from an order */}
              {item.orderId && (
                <Button 
                  variant="outline" 
                  className="w-full bg-transparent border-blue-200 text-blue-600 hover:bg-blue-50 dark:border-blue-800 dark:text-blue-400 dark:hover:bg-blue-950"
                  onClick={() => window.location.href = `/orders/${item.orderId}`}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Sipariş Detayına Git
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Barcode Printer */}
        <div className="mb-6">
          <BarcodePrinter
            barcode={item.barcode}
            title={`${item.cm}cm • ${item.mikron}μ • ${item.material}`}
            specifications={`${item.cm}cm • ${item.mikron}μ • ${item.material}`}
            weight={item.currentWeight || 0}
            supplier={item.supplier}
            date={item.receivedDate ? formatDate(item.receivedDate) : "Belirtilmemiş"}
            coilCount={item.bobinCount || 0}
            showCoilBarcodes={!hasReturnMovements}
            customer={orderDetails?.customer}
          />
        </div>

        {/* Return Barcode Printer - Only show if there are return movements */}
        <div className="mb-6">
          <ReturnBarcodePrinter
            parentBarcode={item.barcode}
            title={`${item.cm}cm • ${item.mikron}μ • ${item.material}`}
            specifications={`${item.cm}cm • ${item.mikron}μ • ${item.material}`}
            supplier={item.supplier}
            returnMovements={movements}
            customer={orderDetails?.customer}
          />
        </div>


        {/* Stock Movements */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Stok Hareketleri
            </CardTitle>
          </CardHeader>
          <CardContent>
            {movements.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                <History className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>Henüz hareket kaydı yok</p>
              </div>
            ) : (
              <div className="space-y-3">
                {movements.map((movement) => (
                  <div key={movement.id} className="flex items-center gap-3 p-3 bg-muted/30 rounded-md">
                    <div className="flex-shrink-0">{getMovementIcon(movement.type)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{movement.type}</span>
                        <span className="text-xs text-muted-foreground">
                          {movement.movementDate ? formatDate(movement.movementDate) : "Belirtilmemiş"}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {movement.weightAfter - movement.weightBefore > 0 ? "+" : ""}
                        {(movement.weightAfter - movement.weightBefore) || 0}kg
                        {movement.operator && ` • ${movement.operator}`}
                      </div>
                      {movement.notes && (
                        <div className="text-xs text-muted-foreground mt-1">{translateNotes(movement.notes)}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Product Exit Dialog */}
        {item && (
          <ProductExitDialog
            open={isExitDialogOpen}
            onOpenChange={setIsExitDialogOpen}
            item={item}
            onConfirm={handleProductExit}
          />
        )}

        {/* Product Edit Dialog */}
        {item && (
          <ProductEditDialog
            open={isEditDialogOpen}
            onOpenChange={setIsEditDialogOpen}
            item={item}
            onConfirm={handleProductEdit}
          />
        )}

        {/* Product Return Dialog */}
        {item && (
          <ProductReturnDialog
            open={isReturnDialogOpen}
            onOpenChange={setIsReturnDialogOpen}
            item={item}
            onConfirm={handleProductReturn}
          />
        )}
      </div>
    </div>
  )
}
