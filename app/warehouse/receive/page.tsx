"use client"

import { useEffect, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { LoadingSpinner } from "@/components/loading-spinner"
import { ArrowLeft, Package, Truck, CheckCircle, AlertCircle } from "lucide-react"
import { ordersRepo } from "@/lib/orders-repo"
import { OrderWarehouseIntegration } from "@/lib/order-warehouse-integration"
import { useToast } from "@/hooks/use-toast"
import type { Order } from "@/types/order"

export default function ReceiveOrdersPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(true)
  const [isReceiving, setIsReceiving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [order, setOrder] = useState<Order | null>(null)
  const [receiveData, setReceiveData] = useState({
    actualWeight: "",
    actualBobinCount: "",
    notes: "",
  })

  useEffect(() => {
    console.log("[v0] Warehouse receive page loading")
    loadOrderData()
  }, [searchParams])

  const loadOrderData = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const orderId = searchParams.get("orderId")
      console.log("[v0] Loading order for receive:", orderId)

      if (!orderId) {
        setError("Sipariş ID'si bulunamadı")
        setIsLoading(false)
        return
      }

      const orderData = await ordersRepo.get(orderId)

      if (!orderData) {
        setError("Sipariş bulunamadı")
        setIsLoading(false)
        return
      }

      setOrder(orderData)

      setReceiveData({
        actualWeight: orderData.quantity?.toString() || "",
        actualBobinCount: orderData.bobin_sayisi?.toString() || "",
        notes: "",
      })

      setIsLoading(false)
      console.log("[v0] Order loaded successfully:", orderData)
    } catch (error) {
      console.error("[v0] Error loading order:", error)
      setError("Sipariş yüklenirken hata oluştu")
      setIsLoading(false)
    }
  }

  const handleReceiveOrder = async () => {
    if (!order) return

    try {
      setIsReceiving(true)
      console.log("[v0] Receiving order into warehouse:", order.id)

      const actualWeight = Number.parseFloat(receiveData.actualWeight)
      const actualBobinCount = Number.parseInt(receiveData.actualBobinCount)

      if (isNaN(actualWeight) || actualWeight <= 0) {
        toast({
          title: "Hata",
          description: "Geçerli bir ağırlık giriniz",
          variant: "destructive",
        })
        setIsReceiving(false)
        return
      }

      if (isNaN(actualBobinCount) || actualBobinCount <= 0) {
        toast({
          title: "Hata",
          description: "Geçerli bir bobin sayısı giriniz",
          variant: "destructive",
        })
        setIsReceiving(false)
        return
      }

      await OrderWarehouseIntegration.receiveOrderInWarehouse(order.id, {
        actualWeight,
        actualBobinCount,
        notes: receiveData.notes,
      })

      toast({
        title: "Başarılı",
        description: "Sipariş başarıyla depoya alındı",
      })

      router.push(`/orders/${order.id}`)
    } catch (error) {
      console.error("[v0] Error receiving order:", error)
      toast({
        title: "Hata",
        description: "Sipariş depoya alınırken hata oluştu",
        variant: "destructive",
      })
    } finally {
      setIsReceiving(false)
    }
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">Hata Oluştu</h3>
          <p className="text-muted-foreground mb-4">{error}</p>
          <div className="space-x-2">
            <Button variant="outline" onClick={() => router.back()}>
              Geri Dön
            </Button>
            <Button onClick={loadOrderData}>Tekrar Dene</Button>
          </div>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="text-muted-foreground mt-4">Sipariş bilgileri yükleniyor...</p>
        </div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">Sipariş Bulunamadı</h3>
          <p className="text-muted-foreground mb-4">Belirtilen sipariş bulunamadı</p>
          <Button onClick={() => router.back()}>Geri Dön</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 max-w-md">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="sm" onClick={() => router.back()} className="p-2">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Sipariş Kabul</h1>
            <p className="text-sm text-muted-foreground">Sipariş #{order.id.slice(0, 8)}</p>
          </div>
        </div>

        {/* Order Info */}
        <Card className="mb-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Package className="h-4 w-4" />
              Sipariş Bilgileri
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Müşteri:</span>
              <span className="text-sm font-medium">{order.customer}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Malzeme:</span>
              <span className="text-sm font-medium">{order.material}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Özellik:</span>
              <span className="text-sm font-medium">
                {order.cm}cm • {order.mikron}μ
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Sipariş Miktarı:</span>
              <span className="text-sm font-medium">
                {order.quantity} {order.unit}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Bobin Sayısı:</span>
              <span className="text-sm font-medium">{order.bobin_sayisi} adet</span>
            </div>
          </CardContent>
        </Card>

        {/* Receive Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Truck className="h-4 w-4" />
              Teslim Alınan Miktar
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="actualWeight">Gerçek Ağırlık ({order.unit})</Label>
              <Input
                id="actualWeight"
                type="number"
                step="0.1"
                value={receiveData.actualWeight}
                onChange={(e) => setReceiveData((prev) => ({ ...prev, actualWeight: e.target.value }))}
                placeholder="Teslim alınan ağırlık"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="actualBobinCount">Gerçek Bobin Sayısı</Label>
              <Input
                id="actualBobinCount"
                type="number"
                value={receiveData.actualBobinCount}
                onChange={(e) => setReceiveData((prev) => ({ ...prev, actualBobinCount: e.target.value }))}
                placeholder="Teslim alınan bobin sayısı"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notlar (Opsiyonel)</Label>
              <Input
                id="notes"
                value={receiveData.notes}
                onChange={(e) => setReceiveData((prev) => ({ ...prev, notes: e.target.value }))}
                placeholder="Teslim alma notları"
              />
            </div>

            <Button onClick={handleReceiveOrder} disabled={isReceiving} className="w-full">
              {isReceiving ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Depoya Alınıyor...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Depoya Al
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
