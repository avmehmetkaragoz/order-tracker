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
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { WarehouseItem } from "@/types/warehouse"

export interface ProductEditData {
  currentWeight: number
  bobinCount: number
  location: string
  status: string
  notes: string
}

interface ProductEditDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  item: WarehouseItem
  onConfirm: (editData: ProductEditData) => void
}

export function ProductEditDialog({
  open,
  onOpenChange,
  item,
  onConfirm,
}: ProductEditDialogProps) {
  const [currentWeight, setCurrentWeight] = useState(item.currentWeight?.toString() || "0")
  const [bobinCount, setBobinCount] = useState(item.bobinCount?.toString() || "0")
  const [location, setLocation] = useState(item.location || "Depo")
  const [status, setStatus] = useState<string>(item.status || "Stokta")
  const [notes, setNotes] = useState(item.notes || "")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async () => {
    const weightNum = parseFloat(currentWeight)
    const bobinNum = parseInt(bobinCount)

    if (isNaN(weightNum) || weightNum < 0) {
      alert("Geçerli bir ağırlık değeri giriniz")
      return
    }

    if (isNaN(bobinNum) || bobinNum < 0) {
      alert("Geçerli bir bobin sayısı giriniz")
      return
    }

    if (weightNum > (item.originalWeight || 0)) {
      alert("Mevcut ağırlık orijinal ağırlıktan fazla olamaz")
      return
    }

    setIsSubmitting(true)
    try {
      await onConfirm({
        currentWeight: weightNum,
        bobinCount: bobinNum,
        location,
        status,
        notes,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    // Reset form to original values
    setCurrentWeight(item.currentWeight?.toString() || "0")
    setBobinCount(item.bobinCount?.toString() || "0")
    setLocation(item.location || "Depo")
    setStatus(item.status || "Stokta")
    setNotes(item.notes || "")
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Ürün Bilgilerini Düzenle</DialogTitle>
          <DialogDescription>
            {item.cm}cm • {item.mikron}μ • {item.material}
            <br />
            Barkod: {item.barcode}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="currentWeight" className="text-right">
              Mevcut Ağırlık
            </Label>
            <div className="col-span-3">
              <Input
                id="currentWeight"
                type="number"
                step="0.1"
                min="0"
                max={item.originalWeight || 0}
                value={currentWeight}
                onChange={(e) => setCurrentWeight(e.target.value)}
                placeholder="0"
              />
              <div className="text-xs text-muted-foreground mt-1">
                Maksimum: {item.originalWeight || 0} kg
              </div>
            </div>
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="bobinCount" className="text-right">
              Bobin Sayısı
            </Label>
            <div className="col-span-3">
              <Input
                id="bobinCount"
                type="number"
                min="0"
                value={bobinCount}
                onChange={(e) => setBobinCount(e.target.value)}
                placeholder="0"
              />
            </div>
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="location" className="text-right">
              Konum
            </Label>
            <div className="col-span-3">
              <Input
                id="location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Depo"
              />
            </div>
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="status" className="text-right">
              Durum
            </Label>
            <div className="col-span-3">
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Durum seçin" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Stokta">Stokta</SelectItem>
                  <SelectItem value="Rezerve">Rezerve</SelectItem>
                  <SelectItem value="Stok Yok">Stok Yok</SelectItem>
                  <SelectItem value="Hasarlı">Hasarlı</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-4 items-start gap-4">
            <Label htmlFor="notes" className="text-right pt-2">
              Notlar
            </Label>
            <div className="col-span-3">
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ürün hakkında notlar..."
                rows={3}
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel} disabled={isSubmitting}>
            İptal
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? "Kaydediliyor..." : "Kaydet"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
