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
import { Package, AlertCircle } from "lucide-react"
import type { WarehouseItem } from "@/types/warehouse"

interface ProductExitDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  item: WarehouseItem
  onConfirm: (exitData: ProductExitData) => void
}

export interface ProductExitData {
  weightExit: number
  bobinExit: number
  exitLocation: string
  operatorName?: string
  reason?: string
  notes?: string
}

const EXIT_LOCATIONS = [
  { value: "matbaa-tamburlu", label: "Matbaa - Tamburlu" },
  { value: "matbaa-bilgili", label: "Matbaa - Bilgili" },
  { value: "kesim", label: "Kesim" },
  { value: "sevkiyat", label: "Sevkiyat" },
]

const EXIT_REASONS = [
  { value: "satis", label: "Satış" },
  { value: "transfer", label: "Transfer" },
  { value: "hasarli", label: "Hasarlı" },
  { value: "uretim", label: "Üretim" },
  { value: "diger", label: "Diğer" },
]

export function ProductExitDialog({ open, onOpenChange, item, onConfirm }: ProductExitDialogProps) {
  const [weightExit, setWeightExit] = useState("")
  const [bobinExit, setBobinExit] = useState("")
  const [exitLocation, setExitLocation] = useState("")
  const [operatorName, setOperatorName] = useState("")
  const [reason, setReason] = useState("")
  const [notes, setNotes] = useState("")
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    const weightValue = parseFloat(weightExit) || 0
    const bobinValue = parseInt(bobinExit) || 0

    // En az bir miktar girilmeli
    if (weightValue <= 0 && bobinValue <= 0) {
      newErrors.amount = "En az bir miktar (kg veya bobin) girilmelidir"
    }

    // Çıkış yeri zorunlu
    if (!exitLocation) {
      newErrors.exitLocation = "Çıkış yeri seçimi zorunludur"
    }

    // Stok kontrolü
    if (weightValue > (item.currentWeight || 0)) {
      newErrors.weight = `Maksimum ${item.currentWeight || 0}kg çıkış yapılabilir`
    }

    if (bobinValue > (item.bobinCount || 0)) {
      newErrors.bobin = `Maksimum ${item.bobinCount || 0} bobin çıkış yapılabilir`
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleConfirm = () => {
    if (!validateForm()) return

    const exitData: ProductExitData = {
      weightExit: parseFloat(weightExit) || 0,
      bobinExit: parseInt(bobinExit) || 0,
      exitLocation,
      operatorName: operatorName.trim() || undefined,
      reason: reason || undefined,
      notes: notes.trim() || undefined,
    }

    onConfirm(exitData)
    handleReset()
  }

  const handleReset = () => {
    setWeightExit("")
    setBobinExit("")
    setExitLocation("")
    setOperatorName("")
    setReason("")
    setNotes("")
    setErrors({})
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
            <Package className="h-5 w-5" />
            Ürün Çıkışı
          </DialogTitle>
          <DialogDescription>
            {item.cm}cm • {item.mikron}μ • {item.material}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Mevcut Stok Bilgisi */}
          <div className="bg-muted/50 p-3 rounded-md">
            <div className="text-sm font-medium mb-1">Mevcut Stok</div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Ağırlık:</span>
                <span className="font-medium ml-1">{item.currentWeight || 0}kg</span>
              </div>
              <div>
                <span className="text-muted-foreground">Bobin:</span>
                <span className="font-medium ml-1">{item.bobinCount || 0} adet</span>
              </div>
            </div>
          </div>

          {/* Çıkış Miktarları */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="weight-exit">Çıkış Ağırlığı (kg)</Label>
              <Input
                id="weight-exit"
                type="number"
                min="0"
                max={item.currentWeight || 0}
                step="0.1"
                value={weightExit}
                onChange={(e) => setWeightExit(e.target.value)}
                placeholder="0"
              />
              {errors.weight && (
                <div className="text-xs text-destructive flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.weight}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="bobin-exit">Çıkış Bobin Sayısı</Label>
              <Input
                id="bobin-exit"
                type="number"
                min="0"
                max={item.bobinCount || 0}
                value={bobinExit}
                onChange={(e) => setBobinExit(e.target.value)}
                placeholder="0"
              />
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

          {/* Çıkış Yeri - Zorunlu */}
          <div className="space-y-2">
            <Label htmlFor="exit-location">Çıkış Yeri *</Label>
            <Select value={exitLocation} onValueChange={setExitLocation}>
              <SelectTrigger>
                <SelectValue placeholder="Çıkış yerini seçin" />
              </SelectTrigger>
              <SelectContent>
                {EXIT_LOCATIONS.map((location) => (
                  <SelectItem key={location.value} value={location.value}>
                    {location.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.exitLocation && (
              <div className="text-xs text-destructive flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {errors.exitLocation}
              </div>
            )}
          </div>

          {/* İşçi Adı - Opsiyonel */}
          <div className="space-y-2">
            <Label htmlFor="operator-name">İşçi Adı</Label>
            <Input
              id="operator-name"
              value={operatorName}
              onChange={(e) => setOperatorName(e.target.value)}
              placeholder="İşçi adı (opsiyonel)"
            />
          </div>

          {/* Çıkış Nedeni - Opsiyonel */}
          <div className="space-y-2">
            <Label htmlFor="reason">Çıkış Nedeni</Label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger>
                <SelectValue placeholder="Neden seçin (opsiyonel)" />
              </SelectTrigger>
              <SelectContent>
                {EXIT_REASONS.map((reasonOption) => (
                  <SelectItem key={reasonOption.value} value={reasonOption.value}>
                    {reasonOption.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Notlar - Opsiyonel */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notlar</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ek notlar (opsiyonel)"
              rows={2}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            İptal
          </Button>
          <Button onClick={handleConfirm}>
            Çıkışı Onayla
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
