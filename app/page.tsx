"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { ordersRepo } from "@/lib/orders-repo"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { LoadingSpinner } from "@/components/loading-spinner"
import { KeyboardShortcuts } from "@/components/keyboard-shortcuts"
import { Settings, Plus, BarChart3, Clock, CheckCircle, Warehouse, QrCode, TestTube, Users, LogOut } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function HomePage() {
  const router = useRouter()
  const { toast } = useToast()
  const [isInitialized, setIsInitialized] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    delivered: 0,
    overdue: 0,
  })

  useEffect(() => {
    checkAuth()
    loadStats()
  }, [])

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/check', {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        }
      })
      const data = await response.json()

      if (data.success && data.user) {
        setIsAuthenticated(true)
        setCurrentUser(data.user)
      }
    } catch (error) {
      // Not authenticated, continue as guest
    }
  }

  const handleLogout = async () => {
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST'
      })

      if (response.ok) {
        setIsAuthenticated(false)
        setCurrentUser(null)
        toast({
          title: "Çıkış Yapıldı",
          description: "Başarıyla çıkış yaptınız"
        })
        // Redirect to login with logout flag to prevent auto-login
        router.push('/login?logout=true')
      }
    } catch (error) {
      toast({
        title: "Hata",
        description: "Çıkış yapılırken bir hata oluştu",
        variant: "destructive"
      })
    }
  }

  const loadStats = () => {
    try {
      const ordersData = ordersRepo.list()
      const orders = Array.isArray(ordersData) ? ordersData : []

      const pending = orders.filter((o) => o.status !== "Delivered" && o.status !== "Cancelled")
      const delivered = orders.filter((o) => o.status === "Delivered")
      const overdue = orders.filter((o) => {
        if (!o.etaDate || o.status === "Delivered" || o.status === "Cancelled") return false
        return new Date(o.etaDate) < new Date()
      })

      setStats({
        total: orders.length,
        pending: pending.length,
        delivered: delivered.length,
        overdue: overdue.length,
      })
    } catch (error) {
      // Set default stats if there's an error
      setStats({
        total: 0,
        pending: 0,
        delivered: 0,
        overdue: 0,
      })
    }
    setIsInitialized(true)
  }

  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="text-muted-foreground mt-4">Uygulama başlatılıyor...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <KeyboardShortcuts />

      <div className="container mx-auto px-4 py-8 pt-4 max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-4xl mb-3">📦</div>
          <h1 className="text-3xl font-bold mb-2">Sipariş Takip</h1>
          <p className="text-muted-foreground">
            Tedarikçi siparişlerinizi kolayca yönetin
            {isAuthenticated && currentUser && (
              <span className="block text-xs mt-1">
                Hoş geldiniz, {currentUser.full_name || currentUser.username}
              </span>
            )}
          </p>
        </div>

        {/* Stats Overview */}
        {stats.total > 0 && (
          <div className="grid grid-cols-2 gap-3 mb-6">
            <Card>
              <CardContent className="p-4 text-center">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <BarChart3 className="h-4 w-4 text-primary" />
                  <span className="text-2xl font-bold text-primary">{stats.total}</span>
                </div>
                <div className="text-xs text-muted-foreground">Toplam Sipariş</div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 text-center">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <Clock className="h-4 w-4 text-orange-500" />
                  <span className="text-2xl font-bold text-orange-500">{stats.pending}</span>
                </div>
                <div className="text-xs text-muted-foreground">Bekleyen</div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 text-center">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-2xl font-bold text-green-500">{stats.delivered}</span>
                </div>
                <div className="text-xs text-muted-foreground">Teslim Edildi</div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 text-center">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <Clock className="h-4 w-4 text-red-500" />
                  <span className="text-2xl font-bold text-red-500">{stats.overdue}</span>
                </div>
                <div className="text-xs text-muted-foreground">Gecikmiş</div>
                {stats.overdue > 0 && (
                  <Badge variant="destructive" className="text-xs mt-1">
                    Dikkat!
                  </Badge>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Main Actions */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Hızlı İşlemler</span>
            </CardTitle>
            <CardDescription>
              {stats.total > 0
                ? `Sistemde ${stats.total} sipariş bulunuyor`
                : "Sipariş takibine başlamak için yeni sipariş oluşturun"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              variant="outline"
              className="w-full bg-transparent"
              size="lg"
              onClick={() => (window.location.href = "/orders")}
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              Siparişleri Görüntüle
              <kbd className="ml-auto text-xs bg-muted px-1.5 py-0.5 rounded">H</kbd>
            </Button>
            
            <Button
              variant="outline"
              className="w-full bg-transparent"
              size="lg"
              onClick={() => (window.location.href = "/qr-scanner")}
            >
              <QrCode className="h-4 w-4 mr-2" />
              QR Kod Tarama
              <kbd className="ml-auto text-xs bg-muted px-1.5 py-0.5 rounded">Q</kbd>
            </Button>
          </CardContent>
        </Card>

        {/* Quick Actions Grid */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <Card
            className="cursor-pointer hover:bg-accent/50 transition-colors active:scale-95"
            onClick={() => (window.location.href = "/orders/new")}
          >
            <CardContent className="p-6 text-center">
              <Plus className="h-8 w-8 text-primary mx-auto mb-2" />
              <div className="font-medium">Yeni Sipariş</div>
              <div className="text-xs text-muted-foreground mt-1">Hızlı oluştur</div>
              <kbd className="text-xs bg-muted px-1.5 py-0.5 rounded mt-2 inline-block">N</kbd>
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer hover:bg-accent/50 transition-colors active:scale-95"
            onClick={() => (window.location.href = "/warehouse")}
          >
            <CardContent className="p-6 text-center">
              <Warehouse className="h-8 w-8 text-primary mx-auto mb-2" />
              <div className="font-medium">Depo Yönetimi</div>
              <div className="text-xs text-muted-foreground mt-1">Stok takibi</div>
              <kbd className="text-xs bg-muted px-1.5 py-0.5 rounded mt-2 inline-block">W</kbd>
            </CardContent>
          </Card>
        </div>

        {/* Additional Actions Grid */}
        <div className="grid grid-cols-1 gap-4 mb-8">
          <Card
            className="cursor-pointer hover:bg-accent/50 transition-colors active:scale-95"
            onClick={() => (window.location.href = "/analytics")}
          >
            <CardContent className="p-4 text-center">
              <BarChart3 className="h-6 w-6 text-primary mx-auto mb-2" />
              <div className="font-medium">Fiyat Analizi</div>
              <div className="text-xs text-muted-foreground mt-1">Harcama raporu ve fiyat geçmişi</div>
              <kbd className="text-xs bg-muted px-1.5 py-0.5 rounded mt-2 inline-block">Ctrl+A</kbd>
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer hover:bg-accent/50 transition-colors active:scale-95"
            onClick={() => (window.location.href = "/settings")}
          >
            <CardContent className="p-4 text-center">
              <Settings className="h-6 w-6 text-primary mx-auto mb-2" />
              <div className="font-medium">Ayarlar & Fiyat Yönetimi</div>
              <div className="text-xs text-muted-foreground mt-1">Tedarikçi fiyatları ve veri yönetimi</div>
              <kbd className="text-xs bg-muted px-1.5 py-0.5 rounded mt-2 inline-block">Ctrl+S</kbd>
            </CardContent>
          </Card>


          <Card
            className="cursor-pointer hover:bg-accent/50 transition-colors active:scale-95"
            onClick={() => (window.location.href = "/printer-test")}
          >
            <CardContent className="p-4 text-center">
              <TestTube className="h-6 w-6 text-primary mx-auto mb-2" />
              <div className="font-medium">Yazıcı Test Sayfası</div>
              <div className="text-xs text-muted-foreground mt-1">10cm x 10cm QR etiket testi</div>
              <kbd className="text-xs bg-muted px-1.5 py-0.5 rounded mt-2 inline-block">Ctrl+T</kbd>
            </CardContent>
          </Card>
        </div>

        {/* Keyboard Shortcuts Help */}
        <Card className="bg-muted/30">
          <CardContent className="p-4">
            <div className="text-sm font-medium mb-2">Klavye Kısayolları</div>
            <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
              <div className="flex justify-between">
                <span>Yeni sipariş</span>
                <kbd className="bg-background px-1.5 py-0.5 rounded">N</kbd>
              </div>
              <div className="flex justify-between">
                <span>QR kod tarama</span>
                <kbd className="bg-background px-1.5 py-0.5 rounded">Q</kbd>
              </div>
              <div className="flex justify-between">
                <span>Depo yönetimi</span>
                <kbd className="bg-background px-1.5 py-0.5 rounded">W</kbd>
              </div>
              <div className="flex justify-between">
                <span>Arama</span>
                <kbd className="bg-background px-1.5 py-0.5 rounded">/</kbd>
              </div>
              <div className="flex justify-between">
                <span>Ayarlar</span>
                <kbd className="bg-background px-1.5 py-0.5 rounded">Ctrl+S</kbd>
              </div>
              <div className="flex justify-between">
                <span>Fiyat Analizi</span>
                <kbd className="bg-background px-1.5 py-0.5 rounded">Ctrl+A</kbd>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
