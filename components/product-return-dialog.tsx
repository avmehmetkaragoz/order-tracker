"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { RotateCcw, AlertCircle, Info } from "lucide-react"
import type { WarehouseItem } from "@/types/warehouse"

interface ProductReturnDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  item: WarehouseItem
  onConfirm: (returnData: ProductReturnData) => void
}

export interface ProductReturnData {
  returnWeight: number
  returnBobinCount: number
  operatorName?: string
  condition: string
  notes?: string
  generateReturnBarcode: boolean
  stockType: 'general' | 'customer'
  customerName?: string
}

const PRODUCT_CONDITIONS = [
  { value: "kullanilabilir", label: "Kullanılabilir" },
  { value: "hasarli", label: "Hasarlı" },
  { value: "kontrol-gerekli", label: "Kontrol Gerekli" },
]

export function ProductReturnDialog({ open, onOpenChange, item, onConfirm }: ProductReturnDialogProps) {
  const [returnWeight, setReturnWeight] = useState("")
  const [returnBobinCount, setReturnBobinCount] = useState("")
  const [operatorName, setOperatorName] = useState("")
  const [condition, setCondition] = useState("")
  const [notes, setNotes] = useState("")
  const [generateReturnBarcode, setGenerateReturnBarcode] = useState(true)
  const [stockType, setStockType] = useState<'general' | 'customer'>('general')
  const [customerName, setCustomerName] = useState("")
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isWeightCalculated, setIsWeightCalculated] = useState(false)

  // Orijinal bobin sayısını hesapla (validasyon ile aynı mantık)
  const calculateOriginalBobinCount = () => {
    let originalBobinCount = item.originalBobinCount || 0
    
    console.log("[DEBUG] calculateOriginalBobinCount:", {
      itemOriginalBobinCount: item.originalBobinCount,
      currentWeight: item.currentWeight,
      originalWeight: item.originalWeight,
      bobinCount: item.bobinCount
    })
    
    // Migration henüz yapılmadığı için originalBobinCount null geliyor
    // Bu durumda gerçek orijinal değerleri kullanarak hesapla
    if (!originalBobinCount) {
      const originalWeight = item.originalWeight || 0
      const currentBobinCount = item.bobinCount || 0
      
      // Eğer mevcut stok 0 ise ve orijinal ağırlık varsa, orijinal bobin sayısını hesapla
      if (item.currentWeight === 0 && originalWeight > 0 && currentBobinCount > 0) {
        // Orijinal ağırlık / mevcut bobin sayısı = bobin başına ağırlık
        // Sonra orijinal ağırlık / bobin başına ağırlık = orijinal bobin sayısı
        // Ama bu durumda mevcut bobin sayısı zaten orijinal bobin sayısı olmalı
        originalBobinCount = currentBobinCount
        console.log("[DEBUG] Using current bobin count as original (stock depleted):", originalBobinCount)
      } else if (originalWeight > 0 && currentBobinCount > 0) {
        // Normal durum: mevcut bobin sayısını kullan
        originalBobinCount = currentBobinCount
        console.log("[DEBUG] Using current bobin count as original:", originalBobinCount)
      } else {
        // Fallback: ortalama ağırlıkla hesapla
        const averageCoilWeight = 102.4 // 512kg / 5 bobin = 102.4kg/bobin (daha gerçekçi)
        originalBobinCount = Math.round((originalWeight || 0) / averageCoilWeight)
        console.log("[DEBUG] Calculated from original weight with realistic ratio:", originalBobinCount)
      }
    }
    
    console.log("[DEBUG] Final originalBobinCount:", originalBobinCount)
    return originalBobinCount
  }

  const originalBobinCount = calculateOriginalBobinCount()

  // Bobin başına ağırlık hesapla
  const calculateWeightPerCoil = () => {
    const originalWeight = item.originalWeight || 0
    const originalCoils = originalBobinCount
    
    if (originalWeight > 0 && originalCoils > 0) {
      return originalWeight / originalCoils
    }
    
    // Fallback: ortalama bobin ağırlığı
    return 90 // kg
  }

  const weightPerCoil = calculateWeightPerCoil()

  // Bobin sayısı değiştiğinde ağırlığı otomatik hesapla
  const handleBobinCountChange = (value: string) => {
    setReturnBobinCount(value)
    
    const bobinValue = parseInt(value) || 0
    
    // Eğer ağırlık boş veya hesaplanmışsa, otomatik hesapla
    if (bobinValue > 0 && (!returnWeight || isWeightCalculated)) {
      const calculatedWeight = bobinValue * weightPerCoil
      setReturnWeight(calculatedWeight.toFixed(1))
      setIsWeightCalculated(true)
    } else if (bobinValue === 0) {
      // Bobin sayısı sıfırlandığında ağırlığı da sıfırla (eğer hesaplanmışsa)
      if (isWeightCalculated) {
        setReturnWeight("")
        setIsWeightCalculated(false)
      }
    }
  }

  // Ağırlık manuel değiştirildiğinde hesaplama flagini kaldır
  const handleWeightChange = (value: string) => {
    setReturnWeight(value)
    setIsWeightCalculated(false)
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    const weightValue = parseFloat(returnWeight) || 0
    const bobinValue = parseInt(returnBobinCount) || 0

    // En az bir miktar girilmeli
    if (weightValue <= 0 && bobinValue <= 0) {
      newErrors.amount = "En az bir miktar (kg veya bobin) girilmelidir"
    }

    // Ürün durumu zorunlu
    if (!condition) {
      newErrors.condition = "Ürün durumu seçimi zorunludur"
    }

    // Negatif değer kontrolü
    if (weightValue < 0) {
      newErrors.weight = "Ağırlık negatif olamaz"
    }

    if (bobinValue < 0) {
      newErrors.bobin = "Bobin sayısı negatif olamaz"
    }

    // Orijinal değerlerden fazla olamaz kontrolü
    const originalWeight = item.originalWeight || 0
    
    // Component seviyesindeki originalBobinCount'u kullan (tekrar hesaplama)
    const validationOriginalBobinCount = originalBobinCount

    console.log("[DEBUG] Return validation:", {
      originalWeight,
      validationOriginalBobinCount,
      currentWeight: item.currentWeight,
      currentBobinCount: item.bobinCount,
      itemOriginalBobinCount: item.originalBobinCount
    })

    if (weightValue > originalWeight) {
      newErrors.weight = `Dönen ağırlık orijinal ağırlıktan (${originalWeight}kg) fazla olamaz`
    }

    if (bobinValue > validationOriginalBobinCount) {
      newErrors.bobin = `Dönen bobin sayısı orijinal bobin sayısından (${validationOriginalBobinCount} adet) fazla olamaz`
    }

    // Not: Mevcut stok kontrolü kaldırıldı çünkü dönüş yapılan ürün daha önce çıkarılmış olabilir
    // Sadece orijinal değerlerle karşılaştırma yapılır

    // Müşteri stoku seçildiğinde müşteri adı zorunlu
    if (stockType === 'customer' && (!customerName || customerName.trim() === '')) {
      newErrors.customerName = "Müşteri stoku için müşteri adı zorunludur"
    }

    // Mantıklı oran kontrolü - eğer hem ağırlık hem bobin girilmişse
    // NOT: Bu kontrol sadece bilgilendirici - form gönderimini engellemez
    let warningMessage = ""
    if (weightValue > 0 && bobinValue > 0) {
      const weightPerCoil = weightValue / bobinValue
      const originalWeightPerCoil = originalWeight > 0 && originalBobinCount > 0 ? originalWeight / originalBobinCount : 0
      
      // Sadece çok aşırı durumlar için uyarı ver (örn: 10 kat fark)
      // Kısmi dönüşlerde bobin başına ağırlık değişebilir
      if (originalWeightPerCoil > 0) {
        const ratio = weightPerCoil / originalWeightPerCoil
        // Çok daha esnek limitler: 10 kat fazla veya 10 kat az
        if (ratio > 10 || ratio < 0.1) {
          warningMessage = `Bobin başına ağırlık oranı çok aşırı (${weightPerCoil.toFixed(1)}kg/bobin vs orijinal ${originalWeightPerCoil.toFixed(1)}kg/bobin). Lütfen kontrol edin.`
        }
      }
    }

    setErrors(newErrors)
    
    // Uyarı mesajını ayrı state'te sakla (form gönderimini engellemez)
    if (warningMessage) {
      setErrors(prev => ({ ...prev, ratio: warningMessage }))
    }
    
    // Sadece gerçek hataları kontrol et (ratio uyarısını hariç tut)
    const realErrors = Object.keys(newErrors).filter(key => key !== 'ratio')
    return realErrors.length === 0
  }

  const handleConfirm = () => {
    if (!validateForm()) return

    const returnData: ProductReturnData = {
      returnWeight: parseFloat(returnWeight) || 0,
      returnBobinCount: parseInt(returnBobinCount) || 0,
      operatorName: operatorName.trim() || undefined,
      condition,
      notes: notes.trim() || undefined,
      generateReturnBarcode,
      stockType,
      customerName: stockType === 'customer' ? customerName.trim() || undefined : undefined,
    }

    onConfirm(returnData)
    handleReset()
  }

  const handleReset = () => {
    setReturnWeight("")
    setReturnBobinCount("")
    setOperatorName("")
    setCondition("")
    setNotes("")
    setGenerateReturnBarcode(true)
    setStockType('general')
    setCustomerName("")
    setErrors({})
    setIsWeightCalculated(false)
  }

  const handleCancel = () => {
    handleReset()
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RotateCcw className="h-5 w-5" />
            Ürün Dönüş
          </DialogTitle>
          <DialogDescription>
            Kullanılmayan ürünün depoya dönüşü
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Bilgi Kutusu */}
          <div className="bg-blue-50 dark:bg-blue-950/20 p-3 rounded-md border border-blue-200 dark:border-blue-800">
            <div className="flex items-start gap-2">
              <Info className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-blue-700 dark:text-blue-300">
                <p className="font-medium mb-1">Ürün Özellikleri</p>
                <p>{item.cm}cm • {item.mikron}μ • {item.material}</p>
                <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="font-medium">Mevcut:</span> {item.currentWeight || 0}kg
                  </div>
                  <div>
                    <span className="font-medium">Bobin:</span> {item.bobinCount || 0} adet
                  </div>
                  <div>
                    <span className="font-medium">Orijinal:</span> {item.originalWeight || 0}kg
                  </div>
                  <div>
                    <span className="font-medium">Orijinal Bobin:</span> {originalBobinCount} adet
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Dönüş Miktarları */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="return-weight">Dönen Ağırlık (kg)</Label>
              <Input
                id="return-weight"
                type="number"
                min="0"
                step="0.1"
                value={returnWeight}
                onChange={(e) => handleWeightChange(e.target.value)}
                placeholder="0"
                className={isWeightCalculated ? "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800" : ""}
              />
              {isWeightCalculated && (
                <div className="text-xs text-green-600 dark:text-green-400">
                  Otomatik hesaplandı: {parseInt(returnBobinCount) || 0} bobin × {weightPerCoil.toFixed(1)}kg/bobin
                </div>
              )}
              {errors.weight && (
                <div className="text-xs text-destructive flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.weight}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="return-bobin">Dönen Bobin Sayısı</Label>
              <Input
                id="return-bobin"
                type="number"
                min="0"
                value={returnBobinCount}
                onChange={(e) => handleBobinCountChange(e.target.value)}
                placeholder="0"
              />
              {parseInt(returnBobinCount) > 0 && weightPerCoil > 0 && (
                <div className="text-xs text-muted-foreground">
                  Bobin başına ~{weightPerCoil.toFixed(1)}kg
                </div>
              )}
              {errors.bobin && (
                <div className="text-xs text-destructive flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.bobin}
                </div>
              )}
            </div>
          </div>

          {errors.amount && (
            <div className="text-xs text-destructive flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              {errors.amount}
            </div>
          )}

          {errors.ratio && (
            <div className="text-xs text-yellow-600 dark:text-yellow-400 flex items-center gap-1 bg-yellow-50 dark:bg-yellow-950/20 p-2 rounded border border-yellow-200 dark:border-yellow-800">
              <AlertCircle className="h-3 w-3" />
              <div>
                <div className="font-medium">Uyarı:</div>
                <div>{errors.ratio}</div>
                <div className="mt-1 text-xs">Bu normal olabilir - kısmi dönüşlerde ağırlık oranı değişebilir.</div>
              </div>
            </div>
          )}

          {/* Ürün Durumu - Zorunlu */}
          <div className="space-y-2">
            <Label htmlFor="condition">Ürün Durumu *</Label>
            <Select value={condition} onValueChange={setCondition}>
              <SelectTrigger>
                <SelectValue placeholder="Ürün durumunu seçin" />
              </SelectTrigger>
              <SelectContent>
                {PRODUCT_CONDITIONS.map((conditionOption) => (
                  <SelectItem key={conditionOption.value} value={conditionOption.value}>
                    {conditionOption.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.condition && (
              <div className="text-xs text-destructive flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {errors.condition}
              </div>
            )}
          </div>

          {/* Stok Türü Seçimi */}
          <div className="space-y-2">
            <Label htmlFor="stock-type">Stok Türü *</Label>
            <Select value={stockType} onValueChange={(value: 'general' | 'customer') => setStockType(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Stok türünü seçin" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="general">
                  <div className="flex flex-col">
                    <span>Genel Stok</span>
                    <span className="text-xs text-muted-foreground">Herkesin kullanabileceği stok</span>
                  </div>
                </SelectItem>
                <SelectItem value="customer">
                  <div className="flex flex-col">
                    <span>Müşteri Stoku</span>
                    <span className="text-xs text-muted-foreground">Belirli müşteriye ait stok</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            {errors.stockType && (
              <div className="text-xs text-destructive flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {errors.stockType}
              </div>
            )}
          </div>

          {/* Müşteri Adı - Sadece müşteri stoku seçildiğinde */}
          {stockType === 'customer' && (
            <div className="space-y-2">
              <Label htmlFor="customer-name">Müşteri Adı *</Label>
              <Input
                id="customer-name"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Müşteri adını girin"
              />
              {errors.customerName && (
                <div className="text-xs text-destructive flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.customerName}
                </div>
              )}
              <div className="text-xs text-muted-foreground">
                Bu stok sadece belirtilen müşteri için kullanılabilir olacak
              </div>
            </div>
          )}

          {/* Teslim Alan İşçi - Opsiyonel */}
          <div className="space-y-2">
            <Label htmlFor="operator-name">Teslim Alan İşçi</Label>
            <Input
              id="operator-name"
              value={operatorName}
              onChange={(e) => setOperatorName(e.target.value)}
              placeholder="İşçi adı (opsiyonel)"
            />
          </div>

          {/* Ek Notlar - Opsiyonel */}
          <div className="space-y-2">
            <Label htmlFor="notes">Ek Notlar</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ek notlar (opsiyonel)"
              rows={2}
            />
          </div>

          {/* Yeni QR Kod Oluştur */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="generate-qrcode"
              checked={generateReturnBarcode}
              onCheckedChange={(checked) => setGenerateReturnBarcode(checked as boolean)}
            />
            <Label htmlFor="generate-qrcode" className="text-sm">
              Dönen ürün için yeni QR kod oluştur
            </Label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            İptal
          </Button>
          <Button onClick={handleConfirm}>
            Dönüşü Onayla
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
