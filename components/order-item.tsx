"use client"

import type React from "react"
import { useState, useEffect } from "react"

import type { Order } from "@/types/order"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Separator } from "@/components/ui/separator"
import {
  Check,
  MessageSquare,
  AlertTriangle,
  Trash2,
  Euro,
  ChevronDown,
  Copy,
  Edit3,
  Calendar,
  Truck,
} from "lucide-react"
import { formatDate, isOverdue } from "@/lib/date-utils"
import { useToast } from "@/hooks/use-toast"
import { settingsRepo } from "@/lib/settings-repo"

interface OrderItemProps {
  order: Order | null
  onMarkDelivered: (orderId: string) => void
  onOrderClick: (orderId: string) => void
  onDelete?: (orderId: string) => void
  isSelected?: boolean
  onSelectionChange?: (orderId: string, selected: boolean) => void
  showSelection?: boolean
  onStatusChange?: (orderId: string, newStatus: Order["status"]) => void // Added status change callback
  onRequesterChange?: (orderId: string, newRequester: string) => void // Added requester change callback
  onSupplierChange?: (orderId: string, newSupplier: string) => void // Added supplier change callback
}

const statusColors = {
  Requested: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  Ordered: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  Return: "bg-purple-500/10 text-purple-500 border-purple-500/20",
  Delivered: "bg-green-500/10 text-green-500 border-green-500/20",
  Cancelled: "bg-red-500/10 text-red-500 border-red-500/20",
}

const statusLabels = {
  Requested: "Talep Edildi",
  Ordered: "Sipariş Verildi",
  Return: "İade",
  Delivered: "Teslim Edildi",
  Cancelled: "İptal Edildi",
}

export function OrderItem({
  order,
  onMarkDelivered,
  onOrderClick,
  onDelete,
  isSelected = false,
  onSelectionChange,
  showSelection = false,
  onStatusChange, // Added status change prop
  onRequesterChange, // Added requester change prop
  onSupplierChange, // Added supplier change prop
}: OrderItemProps) {
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false) // Added dropdown state
  const [isRequesterDropdownOpen, setIsRequesterDropdownOpen] = useState(false) // Added dropdown state for requester
  const [isSupplierDropdownOpen, setIsSupplierDropdownOpen] = useState(false) // Added dropdown state for supplier
  const [requesters, setRequesters] = useState<string[]>([])
  const [suppliers, setSuppliers] = useState<string[]>([])
  const { toast } = useToast() // Added toast hook for copy feedback

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const [requestersData, suppliersData] = await Promise.all([
          settingsRepo.getRequesters(),
          settingsRepo.getSuppliers(),
        ])
        setRequesters(requestersData || [])
        setSuppliers(suppliersData || [])
      } catch (error) {
        console.error("Error loading settings:", error)
        setRequesters([])
        setSuppliers([])
      }
    }
    loadSettings()
  }, [])

  if (!order) {
    return null
  }

  const canMarkDelivered =
    order.status !== "Delivered" && order.status !== "Cancelled"
  const overdue = isOverdue(order)

  const handleMarkDelivered = (e: React.MouseEvent) => {
    e.stopPropagation()
    onMarkDelivered(order.id)
  }

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (onDelete) {
      onDelete(order.id)
    }
  }

  const handleSelectionChange = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (onSelectionChange) {
      onSelectionChange(order.id, !isSelected)
    }
  }

  const getSpecsAndQuantity = () => {
    const parts = []
    if (order.cm) parts.push(`${order.cm}cm`)
    if (order.mikron) parts.push(`${order.mikron}μ`)
    if (order.material) parts.push(order.material.toUpperCase())
    
    // Karşılaştırmalı miktar gösterimi
    if (order.quantity && order.unit) {
      if (order.actual_quantity && order.actual_quantity !== order.quantity) {
        parts.push(`${order.quantity}/${order.actual_quantity}${order.unit}`)
      } else {
        parts.push(`${order.quantity}${order.unit}`)
      }
    }
    
    // Karşılaştırmalı bobin sayısı gösterimi
    if (order.bobin_sayisi) {
      if (order.actual_bobin_sayisi && order.actual_bobin_sayisi !== order.bobin_sayisi) {
        parts.push(`${order.bobin_sayisi}/${order.actual_bobin_sayisi} bobin`)
      } else {
        parts.push(`${order.bobin_sayisi} bobin`)
      }
    }
    
    return parts.join(" • ")
  }

  const getPricingDisplay = () => {
    if (!order.total_price && !order.actual_total_price) return null

    return (
      <div className="flex items-center gap-2">
        <Euro className="h-3 w-3 text-green-600" />
        <div className="flex items-center gap-1 text-xs">
          {order.price_per_unit && (
            <>
              <span className="text-muted-foreground">
                {`${order.price_per_unit.toFixed(2)} ${order.currency || "EUR"}`}/kg
              </span>
              <span className="text-muted-foreground">•</span>
            </>
          )}
          
          {/* Karşılaştırmalı fiyat gösterimi */}
          {order.actual_total_price && order.actual_total_price !== order.total_price ? (
            <div className="flex items-center gap-1">
              <span className="text-muted-foreground line-through">
                {`${order.total_price?.toFixed(2) || '0.00'} ${order.currency || "EUR"}`}
              </span>
              <span className="text-muted-foreground">→</span>
              <span className="font-semibold text-green-700 dark:text-green-400">
                {`${order.actual_total_price.toFixed(2)} ${order.currency || "EUR"}`}
              </span>
            </div>
          ) : (
            <span className="font-semibold text-green-700 dark:text-green-400">
              {`${(order.actual_total_price || order.total_price || 0).toFixed(2)} ${order.currency || "EUR"}`}
            </span>
          )}
        </div>
      </div>
    )
  }

  const handleStatusChange = (newStatus: Order["status"]) => {
    if (onStatusChange) {
      onStatusChange(order.id, newStatus)
    }
    setIsStatusDropdownOpen(false)
  }

  const handleRequesterChange = (newRequester: string) => {
    if (onRequesterChange) {
      onRequesterChange(order.id, newRequester)
    }
    setIsRequesterDropdownOpen(false)
  }

  const handleSupplierChange = (newSupplier: string) => {
    if (onSupplierChange) {
      onSupplierChange(order.id, newSupplier)
    }
    setIsSupplierDropdownOpen(false)
  }

  const handleCardClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement

    // Prevent navigation if clicking on interactive elements
    if (
      target.closest("button") ||
      target.closest('[role="menuitem"]') ||
      target.closest("[data-radix-collection-item]") ||
      target.closest('input[type="checkbox"]') ||
      target.hasAttribute("data-prevent-click")
    ) {
      return
    }

    // Navigate to order details
    onOrderClick(order.id)
  }

  const handleCopySpecs = async (e: React.MouseEvent) => {
    e.stopPropagation()
    const specsText = getSpecsAndQuantity()
    if (specsText) {
      try {
        await navigator.clipboard.writeText(specsText)
        toast({
          description: `"${specsText}" kopyalandı`,
          duration: 2000,
        })
      } catch (err) {
        console.error("Failed to copy:", err)
        toast({
          description: "Kopyalama başarısız",
          variant: "destructive",
          duration: 2000,
        })
      }
    }
  }

  return (
    <Card
      className={`cursor-pointer hover:bg-accent/50 transition-colors border-l-4 ${getStatusBorderColor(order)} active:bg-accent/70`}
      onClick={handleCardClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          {showSelection && (
            <div className="flex-shrink-0 pt-1">
              <Checkbox
                checked={isSelected}
                onCheckedChange={() => handleSelectionChange}
                onClick={handleSelectionChange}
                data-prevent-click="true"
              />
            </div>
          )}

          <div className="flex-1 min-w-0 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Calendar className="h-3 w-3 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground font-medium">{formatDate(order.created_at)}</span>
                </div>
                {order.delivered_date && (
                  <div className="flex items-center gap-1">
                    <Check className="h-3 w-3 text-green-600" />
                    <span className="text-xs text-muted-foreground">Teslim:</span>
                    <span className="text-xs font-medium text-green-600">{formatDate(order.delivered_date)}</span>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-1">
                {onDelete && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 w-6 p-0 text-red-500 hover:text-red-600 hover:bg-red-50"
                    onClick={handleDelete}
                    title="Siparişi sil"
                    data-prevent-click="true"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                )}
                {canMarkDelivered && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 w-6 p-0 text-green-600 hover:bg-green-50"
                    onClick={handleMarkDelivered}
                    title="Teslim edildi olarak işaretle"
                    data-prevent-click="true"
                  >
                    <Check className="h-3 w-3" />
                  </Button>
                )}
              </div>
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm min-w-0">
                <DropdownMenu open={isRequesterDropdownOpen} onOpenChange={setIsRequesterDropdownOpen}>
                  <DropdownMenuTrigger asChild>
                    <button
                      className="text-primary hover:bg-accent/30 rounded px-2 py-1 transition-colors flex items-center gap-1 font-medium"
                      data-prevent-click="true"
                    >
                      {order.requester}
                      <Edit3 className="h-3 w-3 opacity-50" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-40">
                    {requesters.map((requester) => (
                      <DropdownMenuItem
                        key={requester}
                        onClick={() => handleRequesterChange(requester)}
                        className={order.requester === requester ? "bg-accent" : ""}
                      >
                        {requester}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>

                <span className="text-muted-foreground">→</span>

                <DropdownMenu open={isSupplierDropdownOpen} onOpenChange={setIsSupplierDropdownOpen}>
                  <DropdownMenuTrigger asChild>
                    <button
                      className="font-semibold text-foreground hover:bg-accent/30 rounded px-2 py-1 transition-colors flex items-center gap-1"
                      data-prevent-click="true"
                    >
                      {order.supplier}
                      <Edit3 className="h-3 w-3 opacity-50" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-40">
                    {suppliers.map((supplier) => (
                      <DropdownMenuItem
                        key={supplier}
                        onClick={() => handleSupplierChange(supplier)}
                        className={order.supplier === supplier ? "bg-accent" : ""}
                      >
                        {supplier}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>

                {order.customer && (
                  <>
                    <span className="text-muted-foreground">•</span>
                    <span className="text-blue-600 font-medium">{order.customer}</span>
                  </>
                )}
              </div>
              {overdue && <AlertTriangle className="h-4 w-4 text-red-500 flex-shrink-0" />}
            </div>

            <Separator />

            {getSpecsAndQuantity() && (
              <div className="flex items-center justify-between">
                <div
                  className="flex items-center gap-2 text-sm font-medium cursor-pointer hover:bg-accent/30 rounded px-2 py-1 transition-colors flex-1"
                  onClick={handleCopySpecs}
                  title="Kopyalamak için tıklayın"
                  data-prevent-click="true"
                >
                  <span className="text-foreground">{getSpecsAndQuantity()}</span>
                  <Copy className="h-3 w-3 opacity-50" />
                </div>
              </div>
            )}


            <Separator />

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <DropdownMenu open={isStatusDropdownOpen} onOpenChange={setIsStatusDropdownOpen}>
                  <DropdownMenuTrigger asChild>
                    <button
                      className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-medium transition-colors hover:opacity-80 ${statusColors[order.status] || statusColors.Requested}`}
                      data-prevent-click="true"
                    >
                      {statusLabels[order.status] || order.status}
                      <ChevronDown className="h-3 w-3" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-40">
                    {Object.entries(statusLabels).map(([status, label]) => (
                      <DropdownMenuItem
                        key={status}
                        onClick={() => handleStatusChange(status as Order["status"])}
                        className={order.status === status ? "bg-accent" : ""}
                      >
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${getStatusDotColor(status as Order["status"])}`} />
                          {label}
                        </div>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="flex items-center gap-2">
                {order.notes && (
                  <div className="flex items-center gap-1">
                    <MessageSquare className="h-3 w-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">Not</span>
                  </div>
                )}

                {order.tags?.map((tag) => (
                  <Badge key={tag} variant="outline" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

const getStatusBorderColor = (order: Order | null) => {
  if (!order) return "border-l-gray-500"

  switch (order.status) {
    case "Requested":
      return "border-l-blue-500"
    case "Ordered":
      return "border-l-yellow-500"
    case "Return":
      return "border-l-purple-500"
    case "Delivered":
      return "border-l-green-500"
    case "Cancelled":
      return "border-l-red-500"
    default:
      return "border-l-gray-500"
  }
}

const getStatusDotColor = (status: Order["status"]) => {
  switch (status) {
    case "Requested":
      return "bg-blue-500"
    case "Ordered":
      return "bg-yellow-500"
    case "Return":
      return "bg-purple-500"
    case "Delivered":
      return "bg-green-500"
    case "Cancelled":
      return "bg-red-500"
    default:
      return "bg-gray-500"
  }
}
