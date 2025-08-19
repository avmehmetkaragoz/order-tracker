"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { warehouseRepo } from "@/lib/warehouse-repo"
import { settingsRepo } from "@/lib/settings-repo"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { ArrowLeft, Package, Save, QrCode } from "lucide-react"

export default function NewWarehouseItemPage() {
  console.log("[v0] NewWarehouseItemPage component rendering")

  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [form, setForm] = useState({
    material: "",
    cm: "",
    mikron: "",
    currentWeight: "",
    bobinCount: "",
    supplier: "",
    location: "",
    notes: "",
  })

  useEffect(() => {
    console.log("[v0] Component mounted, loading suppliers...")
    try {
      const suppliers = settingsRepo.getSuppliers()
      console.log("[v0] Suppliers loaded:", suppliers)
    } catch (error) {
      console.error("[v0] Error loading suppliers:", error)
    }
  }, [])

  let suppliers = []
  const materials = ["OPP", "CPP", "BOPP", "PET", "PE"]

  try {
    suppliers = settingsRepo.getSuppliers()
    console.log("[v0] Suppliers in render:", suppliers)
  } catch (error) {
    console.error("[v0] Error getting suppliers:", error)
    suppliers = []
  }

  const updateField = (field: string, value: string) => {
    setForm({ ...form, [field]: value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!form.material || !form.cm || !form.mikron || !form.currentWeight) {
      toast({
        title: "Eksik Bilgi",
        description: "Lütfen zorunlu alanları doldurun",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    try {
      const newItem = await warehouseRepo.addItem({
        material: form.material,
        cm: Number.parseInt(form.cm),
        mikron: Number.parseInt(form.mikron),
        currentWeight: Number.parseFloat(form.currentWeight),
        originalWeight: Number.parseFloat(form.currentWeight),
        bobinCount: Number.parseInt(form.bobinCount) || 1,
        status: "Stokta", // Updated status to Turkish
        location: form.location,
        receivedDate: new Date().toISOString(),
        lastMovementDate: new Date().toISOString(),
        supplier: form.supplier || undefined,
        notes: form.notes,
      })

      if (form.supplier && !suppliers.includes(form.supplier)) {
        settingsRepo.addSupplier(form.supplier)
      }

      toast({
        title: "Ürün Eklendi",
        description: `Barkod: ${newItem.barcode}`,
      })

      window.location.href = `/warehouse/${newItem.id}`
    } catch (error) {
      console.error("Error adding warehouse item:", error)
      toast({
        title: "Hata",
        description: "Ürün eklenirken bir hata oluştu",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  console.log("[v0] Rendering form with suppliers:", suppliers.length)

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 max-w-md">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="sm" onClick={() => window.history.back()} className="p-2">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Yeni Ürün Ekle</h1>
            <p className="text-sm text-muted-foreground">Depoya yeni ürün kaydet</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Ürün Bilgileri
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="material">Malzeme *</Label>
                  <Select value={form.material} onValueChange={(value) => updateField("material", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      {materials.map((material) => (
                        <SelectItem key={material} value={material}>
                          {material}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="supplier">Tedarikçi</Label>
                  <Select value={form.supplier} onValueChange={(value) => updateField("supplier", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seçin (opsiyonel)" />
                    </SelectTrigger>
                    <SelectContent>
                      {suppliers.length > 0 ? (
                        suppliers.map((supplier) => (
                          <SelectItem key={supplier} value={supplier}>
                            {supplier}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="no-suppliers" disabled>
                          Tedarikçi bulunamadı
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="cm">Genişlik (cm) *</Label>
                  <Input
                    id="cm"
                    type="number"
                    placeholder="70"
                    value={form.cm}
                    onChange={(e) => updateField("cm", e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="mikron">Kalınlık (μ) *</Label>
                  <Input
                    id="mikron"
                    type="number"
                    placeholder="25"
                    value={form.mikron}
                    onChange={(e) => updateField("mikron", e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="currentWeight">Ağırlık (kg) *</Label>
                  <Input
                    id="currentWeight"
                    type="number"
                    step="0.1"
                    placeholder="1000"
                    value={form.currentWeight}
                    onChange={(e) => updateField("currentWeight", e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="bobinCount">Bobin Sayısı</Label>
                  <Input
                    id="bobinCount"
                    type="number"
                    placeholder="1"
                    value={form.bobinCount}
                    onChange={(e) => updateField("bobinCount", e.target.value)}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="location">Depo Konumu</Label>
                <Input
                  id="location"
                  placeholder="A-1-01"
                  value={form.location}
                  onChange={(e) => updateField("location", e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="notes">Notlar</Label>
                <Textarea
                  id="notes"
                  placeholder="Ek bilgiler..."
                  value={form.notes}
                  onChange={(e) => updateField("notes", e.target.value)}
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Preview */}
          {form.material && form.cm && form.mikron && (
            <Card className="bg-muted/30">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <QrCode className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">Ürün Özeti</span>
                </div>
                <div className="text-sm text-muted-foreground">
                  {form.cm}cm • {form.mikron}μ • {form.material}
                  {form.currentWeight && ` • ${form.currentWeight}kg`}
                  {form.bobinCount && ` • ${form.bobinCount} bobin`}
                </div>
                <div className="text-xs text-muted-foreground mt-1">Barkod otomatik oluşturulacak</div>
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              className="flex-1 bg-transparent"
              onClick={() => window.history.back()}
            >
              İptal
            </Button>
            <Button type="submit" className="flex-1" disabled={isLoading}>
              <Save className="h-4 w-4 mr-2" />
              {isLoading ? "Kaydediliyor..." : "Kaydet"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
