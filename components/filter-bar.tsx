"use client"

import { useState } from "react"
import type { OrderFilters, GroupBy, SortBy, OrderStatus, Order } from "@/types/order"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu"
import { Filter, SortAsc, Users, Building2, List, Eye, EyeOff, Calendar, X } from "lucide-react"
import { Input } from "@/components/ui/input"

interface FilterBarProps {
  filters: OrderFilters
  onFilterChange: (filters: Partial<OrderFilters>) => void
  groupBy: GroupBy
  onGroupByChange: (groupBy: GroupBy) => void
  sortBy: SortBy
  onSortByChange: (sortBy: SortBy) => void
  orders: Order[]
}

const statusLabels: Record<OrderStatus, string> = {
  Requested: "Talep Edildi",
  Ordered: "Sipariş Verildi",
  Return: "İade",
  Delivered: "Teslim Edildi",
  Cancelled: "İptal Edildi",
}

const sortLabels: Record<SortBy, string> = {
  newest: "En Yeni",
  oldest: "En Eski",
  eta: "ETA Tarihi",
  supplier: "Tedarikçi",
  requester: "İstek Sahibi",
}

const groupLabels: Record<GroupBy, string> = {
  supplier: "Tedarikçi",
  requester: "İstek Sahibi",
  none: "Düz Liste",
}

export function FilterBar({
  filters,
  onFilterChange,
  groupBy,
  onGroupByChange,
  sortBy,
  onSortByChange,
  orders,
}: FilterBarProps) {
  const [showFilters, setShowFilters] = useState(false)

  const suppliers = [...new Set(orders.map((o) => o.supplier))].sort()
  const requesters = [...new Set(orders.map((o) => o.requester))].sort()

  const activeFilterCount = [
    filters.statuses?.length || 0,
    filters.suppliers?.length || 0,
    filters.requesters?.length || 0,
    filters.dateRange ? 1 : 0,
  ].reduce((sum, count) => sum + (count > 0 ? 1 : 0), 0)

  const handleStatusToggle = (status: OrderStatus) => {
    const currentStatuses = filters.statuses || []
    const newStatuses = currentStatuses.includes(status)
      ? currentStatuses.filter((s) => s !== status)
      : [...currentStatuses, status]

    onFilterChange({
      statuses: newStatuses.length === 0 ? undefined : newStatuses,
    })
  }

  const handleSupplierToggle = (supplier: string) => {
    const currentSuppliers = filters.suppliers || []
    const newSuppliers = currentSuppliers.includes(supplier)
      ? currentSuppliers.filter((s) => s !== supplier)
      : [...currentSuppliers, supplier]

    onFilterChange({
      suppliers: newSuppliers.length === 0 ? undefined : newSuppliers,
    })
  }

  const handleRequesterToggle = (requester: string) => {
    const currentRequesters = filters.requesters || []
    const newRequesters = currentRequesters.includes(requester)
      ? currentRequesters.filter((r) => r !== requester)
      : [...currentRequesters, requester]

    onFilterChange({
      requesters: newRequesters.length === 0 ? undefined : newRequesters,
    })
  }

  return (
    <div className="space-y-3">
      {/* Quick Actions */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {/* Delivery Status Toggle */}
        <Button
          variant={filters.hideDelivered ? "default" : "outline"}
          size="sm"
          onClick={() => onFilterChange({ hideDelivered: true })}
          className="flex-shrink-0"
        >
          <Eye className="h-4 w-4 mr-1" />
          Teslim Edilmeyenler
        </Button>

        <Button
          variant={!filters.hideDelivered ? "default" : "outline"}
          size="sm"
          onClick={() => onFilterChange({ hideDelivered: false })}
          className="flex-shrink-0"
        >
          <Eye className="h-4 w-4 mr-1" />
          Teslim Edilenler
        </Button>

        {/* Sort Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="flex-shrink-0 bg-transparent">
              <SortAsc className="h-4 w-4 mr-1" />
              {sortBy === "newest" ? "Yeniden Eskiye" : "Eskiden Yeniye"}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuLabel>Sıralama</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuCheckboxItem
              checked={sortBy === "newest"}
              onCheckedChange={() => onSortByChange("newest")}
            >
              Yeniden Eskiye
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={sortBy === "oldest"}
              onCheckedChange={() => onSortByChange("oldest" as SortBy)}
            >
              Eskiden Yeniye
            </DropdownMenuCheckboxItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Status Filter Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="flex-shrink-0 bg-transparent">
              <Filter className="h-4 w-4 mr-1" />
              Durum
              {(filters.statuses?.length || 0) > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 text-xs">
                  {filters.statuses?.length}
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48">
            <DropdownMenuLabel>Sipariş Durumu</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {Object.entries(statusLabels).map(([status, label]) => (
              <DropdownMenuCheckboxItem
                key={status}
                checked={filters.statuses?.includes(status as OrderStatus) || false}
                onCheckedChange={() => handleStatusToggle(status as OrderStatus)}
              >
                {label}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Date Range Filter Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="flex-shrink-0 bg-transparent">
              <Calendar className="h-4 w-4 mr-1" />
              Tarih
              {filters.dateRange && (
                <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 text-xs">
                  1
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-64 p-4">
            <DropdownMenuLabel>Tarih Aralığı</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <div className="space-y-3 mt-3">
              {/* Hızlı Seçim Butonları */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">Hızlı Seçim</label>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const today = new Date()
                      const sevenDaysAgo = new Date(today)
                      sevenDaysAgo.setDate(today.getDate() - 7)
                      onFilterChange({
                        dateRange: {
                          start: sevenDaysAgo.toISOString().split('T')[0],
                          end: today.toISOString().split('T')[0]
                        }
                      })
                    }}
                    className="text-xs h-8"
                  >
                    Son 7 Gün
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const today = new Date()
                      const oneMonthAgo = new Date(today)
                      oneMonthAgo.setMonth(today.getMonth() - 1)
                      onFilterChange({
                        dateRange: {
                          start: oneMonthAgo.toISOString().split('T')[0],
                          end: today.toISOString().split('T')[0]
                        }
                      })
                    }}
                    className="text-xs h-8"
                  >
                    Son 1 Ay
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const today = new Date()
                      const threeMonthsAgo = new Date(today)
                      threeMonthsAgo.setMonth(today.getMonth() - 3)
                      onFilterChange({
                        dateRange: {
                          start: threeMonthsAgo.toISOString().split('T')[0],
                          end: today.toISOString().split('T')[0]
                        }
                      })
                    }}
                    className="text-xs h-8"
                  >
                    Son 3 Ay
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const today = new Date()
                      const oneYearAgo = new Date(today)
                      oneYearAgo.setFullYear(today.getFullYear() - 1)
                      onFilterChange({
                        dateRange: {
                          start: oneYearAgo.toISOString().split('T')[0],
                          end: today.toISOString().split('T')[0]
                        }
                      })
                    }}
                    className="text-xs h-8"
                  >
                    Son 1 Yıl
                  </Button>
                </div>
              </div>
              
              {/* Manuel Tarih Seçimi */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">Manuel Seçim</label>
                <div>
                  <label className="text-xs text-muted-foreground">Başlangıç Tarihi</label>
                  <Input
                    type="date"
                    value={filters.dateRange?.start || ""}
                    onChange={(e) => {
                      const start = e.target.value
                      onFilterChange({
                        dateRange: start ? {
                          start,
                          end: filters.dateRange?.end || start
                        } : undefined
                      })
                    }}
                    className="mt-1 h-8"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Bitiş Tarihi</label>
                  <Input
                    type="date"
                    value={filters.dateRange?.end || ""}
                    onChange={(e) => {
                      const end = e.target.value
                      onFilterChange({
                        dateRange: end ? {
                          start: filters.dateRange?.start || end,
                          end
                        } : undefined
                      })
                    }}
                    className="mt-1 h-8"
                  />
                </div>
              </div>
              {filters.dateRange && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onFilterChange({ dateRange: undefined })}
                  className="w-full"
                >
                  <X className="h-3 w-3 mr-1" />
                  Tarih Filtresini Temizle
                </Button>
              )}
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Active Filters */}
      {(filters.statuses?.length || filters.suppliers?.length || filters.requesters?.length || filters.dateRange) && (
        <div className="flex flex-wrap gap-1">
          {filters.statuses?.map((status) => (
            <Badge key={status} variant="secondary" className="text-xs">
              {statusLabels[status]}
              <button
                onClick={() => handleStatusToggle(status)}
                className="ml-1 hover:bg-muted-foreground/20 rounded-full"
              >
                ×
              </button>
            </Badge>
          ))}
          {filters.suppliers?.map((supplier) => (
            <Badge key={supplier} variant="secondary" className="text-xs">
              {supplier}
              <button
                onClick={() => handleSupplierToggle(supplier)}
                className="ml-1 hover:bg-muted-foreground/20 rounded-full"
              >
                ×
              </button>
            </Badge>
          ))}
          {filters.requesters?.map((requester) => (
            <Badge key={requester} variant="secondary" className="text-xs">
              {requester}
              <button
                onClick={() => handleRequesterToggle(requester)}
                className="ml-1 hover:bg-muted-foreground/20 rounded-full"
              >
                ×
              </button>
            </Badge>
          ))}
          {filters.dateRange && (
            <Badge key="dateRange" variant="secondary" className="text-xs">
              {filters.dateRange.start} - {filters.dateRange.end}
              <button
                onClick={() => onFilterChange({ dateRange: undefined })}
                className="ml-1 hover:bg-muted-foreground/20 rounded-full"
              >
                ×
              </button>
            </Badge>
          )}
        </div>
      )}
    </div>
  )
}
