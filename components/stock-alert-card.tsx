"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Info, CheckCircle, AlertTriangle } from "lucide-react"

interface StockAlertCardProps {
  requiredAmount: number
  availableStock: number
  specifications: string
  onOptimize: (optimizedAmount: number) => void
  stockItems?: Array<{
    id: string
    weight: number
    barcode: string
    supplier: string
  }>
}

export function StockAlertCard({ 
  requiredAmount, 
  availableStock, 
  specifications, 
  onOptimize,
  stockItems = []
}: StockAlertCardProps) {
  const needsNewOrder = Math.max(0, requiredAmount - availableStock)
  const canFullySupply = availableStock >= requiredAmount
  const savingsPercentage = Math.min((availableStock / requiredAmount) * 100, 100)

  if (availableStock <= 0) {
    return null
  }

  return (
    <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950/20 dark:border-blue-800">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
              Mevcut Stok Bulundu!
            </h4>
            
            <p className="text-sm text-blue-700 dark:text-blue-300 mb-3">
              <span className="font-medium">{specifications}</span> özelliklerinde{" "}
              <span className="font-bold">{availableStock}kg</span> mevcut stok var.
            </p>

            {/* Stok Detayları */}
            {stockItems.length > 0 && (
              <div className="mb-3 p-2 bg-white dark:bg-blue-900/30 rounded border border-blue-200 dark:border-blue-700">
                <div className="text-xs text-blue-600 dark:text-blue-400 font-medium mb-1">
                  Mevcut Stok Detayları:
                </div>
                <div className="space-y-1">
                  {stockItems.slice(0, 3).map((item) => (
                    <div key={item.id} className="text-xs text-blue-700 dark:text-blue-300 flex justify-between">
                      <span>{item.barcode} • {item.supplier}</span>
                      <span className="font-medium">{item.weight}kg</span>
                    </div>
                  ))}
                  {stockItems.length > 3 && (
                    <div className="text-xs text-blue-600 dark:text-blue-400">
                      +{stockItems.length - 3} adet daha...
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Hesaplama Sonucu */}
            <div className="mb-3 p-3 bg-white dark:bg-blue-900/30 rounded border border-blue-200 dark:border-blue-700">
              {canFullySupply ? (
                <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
                  <CheckCircle className="h-4 w-4" />
                  <span className="text-sm font-medium">
                    Tüm ihtiyaç mevcut stoktan karşılanabilir!
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-orange-700 dark:text-orange-400 mb-2">
                  <AlertTriangle className="h-4 w-4" />
                  <span className="text-sm font-medium">Kısmi stok mevcut</span>
                </div>
              )}
              
              <div className="text-sm space-y-1">
                <div className="flex justify-between">
                  <span className="text-green-600 dark:text-green-400">✓ Mevcut stok:</span>
                  <span className="font-medium">{availableStock}kg</span>
                </div>
                {needsNewOrder > 0 && (
                  <div className="flex justify-between">
                    <span className="text-orange-600 dark:text-orange-400">+ Yeni sipariş:</span>
                    <span className="font-medium">{needsNewOrder}kg</span>
                  </div>
                )}
                <div className="flex justify-between border-t pt-1 mt-1">
                  <span className="font-medium">= Toplam:</span>
                  <span className="font-bold">{requiredAmount}kg</span>
                </div>
                {savingsPercentage > 0 && (
                  <div className="flex justify-between text-blue-600 dark:text-blue-400">
                    <span>💰 Tasarruf:</span>
                    <span className="font-medium">%{savingsPercentage.toFixed(0)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Optimizasyon Butonu */}
            <Button 
              size="sm" 
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              onClick={() => onOptimize(needsNewOrder)}
            >
              {canFullySupply 
                ? "✓ Mevcut Stoktan Karşıla (0kg sipariş)" 
                : `🎯 Siparişi Optimize Et (${needsNewOrder}kg)`
              }
            </Button>

            {/* Bilgi Notu */}
            <p className="text-xs text-blue-600 dark:text-blue-400 mt-2 text-center">
              Mevcut stok FIFO mantığıyla (eski stok önce) kullanılacaktır
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
