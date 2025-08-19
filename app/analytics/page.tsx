"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { pricingRepo } from "@/lib/pricing-repo"
import { ordersRepo } from "@/lib/orders-repo"
import { settingsRepo } from "@/lib/settings-repo"
import type { SupplierPrice, Order } from "@/types/order"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, TrendingUp, TrendingDown, Euro, BarChart3, Calendar, DollarSign } from "lucide-react"

export default function AnalyticsPage() {
  const router = useRouter()
  const [suppliers, setSuppliers] = useState<string[]>([])
  const [selectedSupplier, setSelectedSupplier] = useState<string>("")
  const [priceHistory, setPriceHistory] = useState<SupplierPrice[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [analytics, setAnalytics] = useState({
    totalSpent: 0,
    averageOrderValue: 0,
    totalOrders: 0,
    ordersWithPricing: 0,
    topSupplierBySpending: "",
    topMaterialBySpending: "",
    priceChanges: 0,
  })

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    const loadPriceHistory = async () => {
      if (selectedSupplier) {
        try {
          const history = await pricingRepo.getPriceHistory(selectedSupplier)
          setPriceHistory(history || [])
        } catch (error) {
          console.error("Error loading price history:", error)
          setPriceHistory([])
        }
      } else {
        setPriceHistory([])
      }
    }
    loadPriceHistory()
  }, [selectedSupplier])

  const loadData = async () => {
    try {
      console.log("[v0] Loading analytics data...")
      
      const supplierList = await settingsRepo.getSuppliers()
      console.log("[v0] Suppliers loaded:", supplierList)
      setSuppliers(supplierList || [])
      if (supplierList && supplierList.length > 0 && !selectedSupplier) {
        setSelectedSupplier(supplierList[0])
      }

      const orderList = await ordersRepo.list()
      console.log("[v0] Orders loaded:", orderList, "Type:", typeof orderList, "IsArray:", Array.isArray(orderList))
      
      if (Array.isArray(orderList)) {
        setOrders(orderList)
        await calculateAnalytics(orderList)
      } else {
        console.error("[v0] Orders is not an array, setting empty array")
        setOrders([])
        await calculateAnalytics([])
      }
    } catch (error) {
      console.error("Error loading analytics data:", error)
      setSuppliers([])
      setOrders([])
      await calculateAnalytics([])
    }
  }

  const calculateAnalytics = async (orderList: Order[] | null | undefined) => {
    console.log("[v0] calculateAnalytics called with:", orderList)
    
    if (!orderList || !Array.isArray(orderList)) {
      console.error("orderList is not a valid array:", orderList)
      setAnalytics({
        totalSpent: 0,
        averageOrderValue: 0,
        totalOrders: 0,
        ordersWithPricing: 0,
        topSupplierBySpending: "",
        topMaterialBySpending: "",
        priceChanges: 0,
      })
      return
    }

    const ordersWithPricing = orderList.filter((order) => 
      (order.actual_total_price && order.actual_total_price > 0) || 
      (order.total_price && order.total_price > 0)
    )
    const totalSpent = ordersWithPricing.reduce((sum, order) => 
      sum + (order.actual_total_price || order.total_price || 0), 0
    )
    const averageOrderValue = ordersWithPricing.length > 0 ? totalSpent / ordersWithPricing.length : 0

    // Calculate spending by supplier (gerçek fiyatları kullan)
    const spendingBySupplier = ordersWithPricing.reduce(
      (acc, order) => {
        const supplier = order.supplier || "Bilinmeyen"
        acc[supplier] = (acc[supplier] || 0) + (order.actual_total_price || order.total_price || 0)
        return acc
      },
      {} as Record<string, number>,
    )

    // Calculate spending by material (gerçek fiyatları kullan)
    const spendingByMaterial = ordersWithPricing.reduce(
      (acc, order) => {
        const material = order.material || "Diğer"
        acc[material] = (acc[material] || 0) + (order.actual_total_price || order.total_price || 0)
        return acc
      },
      {} as Record<string, number>,
    )

    const topSupplierBySpending = Object.entries(spendingBySupplier).sort(([, a], [, b]) => b - a)[0]?.[0] || ""
    const topMaterialBySpending = Object.entries(spendingByMaterial).sort(([, a], [, b]) => b - a)[0]?.[0] || ""

    try {
      const allPrices = await pricingRepo.getPrices() || []
      const priceChanges = Array.isArray(allPrices) ? allPrices.filter((price) => !price.is_active).length : 0
      
      setAnalytics({
        totalSpent,
        averageOrderValue,
        totalOrders: orderList.length,
        ordersWithPricing: ordersWithPricing.length,
        topSupplierBySpending,
        topMaterialBySpending,
        priceChanges,
      })
    } catch (error) {
      console.error("Error calculating analytics:", error)
      setAnalytics({
        totalSpent,
        averageOrderValue,
        totalOrders: orderList.length,
        ordersWithPricing: ordersWithPricing.length,
        topSupplierBySpending,
        topMaterialBySpending,
        priceChanges: 0,
      })
    }
  }

  const formatPrice = (price: number, currency = "EUR") => {
    return `${price.toFixed(2)} ${currency}`
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("tr-TR")
  }

  const getActivePrices = async () => {
    try {
      const prices = await pricingRepo.getPrices()
      return Array.isArray(prices) ? prices.filter((p) => p.is_active) : []
    } catch (error) {
      console.error("Error getting active prices:", error)
      return []
    }
  }

  const getPriceChangeIndicator = (prices: SupplierPrice[], material: string) => {
    const materialPrices = prices
      .filter((p) => p.material === material)
      .sort((a, b) => new Date(b.effective_date).getTime() - new Date(a.effective_date).getTime())

    if (materialPrices.length < 2) return null

    const current = materialPrices[0].price_per_unit
    const previous = materialPrices[1].price_per_unit
    const change = ((current - previous) / previous) * 100

    if (Math.abs(change) < 0.1) return null

    return {
      change: change.toFixed(1),
      isIncrease: change > 0,
    }
  }

  const getRecentOrders = () => {
    if (!Array.isArray(orders)) return []
    
    return orders
      .filter((order) => 
        (order.actual_total_price && order.actual_total_price > 0) || 
        (order.total_price && order.total_price > 0)
      )
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 5)
  }

  const getSpendingByMonth = () => {
    if (!Array.isArray(orders)) return []
    
    const monthlySpending = orders
      .filter((order) => 
        (order.actual_total_price && order.actual_total_price > 0) || 
        (order.total_price && order.total_price > 0)
      )
      .reduce(
        (acc, order) => {
          const month = order.created_at.substring(0, 7) // YYYY-MM
          acc[month] = (acc[month] || 0) + (order.actual_total_price || order.total_price || 0)
          return acc
        },
        {} as Record<string, number>,
      )

    return Object.entries(monthlySpending)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-6) // Last 6 months
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
              <h1 className="text-lg font-semibold">Fiyat Analizi</h1>
              <p className="text-sm text-muted-foreground">Fiyat geçmişi ve harcama analizi</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 max-w-md space-y-6">
        {/* Analytics Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Genel Bakış
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-green-600">{formatPrice(analytics.totalSpent)}</div>
                <div className="text-xs text-muted-foreground">Toplam Harcama</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-primary">{formatPrice(analytics.averageOrderValue)}</div>
                <div className="text-xs text-muted-foreground">Ortalama Sipariş</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-primary">{analytics.ordersWithPricing}</div>
                <div className="text-xs text-muted-foreground">Fiyatlı Sipariş</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-primary">{analytics.priceChanges}</div>
                <div className="text-xs text-muted-foreground">Fiyat Değişimi</div>
              </div>
            </div>

            {analytics.topSupplierBySpending && (
              <div className="mt-4 pt-4 border-t space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">En Çok Harcanan Tedarikçi:</span>
                  <span className="font-medium">{analytics.topSupplierBySpending}</span>
                </div>
                {analytics.topMaterialBySpending && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">En Çok Harcanan Malzeme:</span>
                    <span className="font-medium">{analytics.topMaterialBySpending}</span>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Current Prices */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Euro className="h-5 w-5" />
              Güncel Fiyatlar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground text-center py-4">Fiyat analizi geliştiriliyor...</p>
            </div>
          </CardContent>
        </Card>

        {/* Price History */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Fiyat Geçmişi
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Select value={selectedSupplier} onValueChange={setSelectedSupplier}>
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

            <div className="space-y-2">
              {priceHistory.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  {selectedSupplier ? "Bu tedarikçi için fiyat geçmişi yok" : "Tedarikçi seçin"}
                </p>
              ) : (
                priceHistory.map((price) => (
                  <div key={price.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                    <div>
                      <div className="flex items-center gap-2">
                        <Badge variant={price.is_active ? "default" : "secondary"} className="text-xs">
                          {price.material}
                        </Badge>
                        {price.is_active && (
                          <Badge variant="outline" className="text-xs">
                            Aktif
                          </Badge>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {formatDate(price.effective_date)}
                        {price.valid_to && ` - ${formatDate(price.valid_to)}`}
                      </div>
                      {price.notes && <div className="text-xs text-muted-foreground mt-1">{price.notes}</div>}
                    </div>
                    <div className="text-sm font-semibold">{formatPrice(price.price_per_unit, price.currency)}/kg</div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Monthly Spending */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Aylık Harcama
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {getSpendingByMonth().length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">Henüz harcama verisi yok</p>
              ) : (
                getSpendingByMonth().map(([month, amount]) => (
                  <div key={month} className="flex items-center justify-between p-2 bg-muted/30 rounded">
                    <span className="text-sm">
                      {new Date(month + "-01").toLocaleDateString("tr-TR", { year: "numeric", month: "long" })}
                    </span>
                    <span className="text-sm font-semibold text-green-600">{formatPrice(amount)}</span>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Orders with Pricing */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Son Fiyatlı Siparişler</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {getRecentOrders().length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">Henüz fiyatlı sipariş yok</p>
              ) : (
                getRecentOrders().map((order) => (
                  <div key={order.id} className="flex items-center justify-between p-2 bg-muted/30 rounded">
                    <div>
                      <div className="text-sm font-medium">{order.supplier}</div>
                      <div className="text-xs text-muted-foreground">
                        {order.material} • {formatDate(order.created_at)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold text-green-600">
                        {formatPrice(order.actual_total_price || order.total_price || 0, order.currency || "EUR")}
                      </div>
                      {order.price_per_unit && (
                        <div className="text-xs text-muted-foreground">
                          {formatPrice(order.price_per_unit, order.currency || "EUR")}/kg
                        </div>
                      )}
                      {order.actual_total_price && order.actual_total_price !== order.total_price && (
                        <div className="text-xs text-muted-foreground">
                          Gerçek: {formatPrice(order.actual_total_price, order.currency || "EUR")}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
