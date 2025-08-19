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
import { Filter, SortAsc, Users, Building2, List, Eye, EyeOff } from "lucide-react"

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
  "In Production": "Üretimde",
  Shipped: "Sevk Edildi",
  Delivered: "Teslim Edildi",
  Cancelled: "İptal Edildi",
}

const sortLabels: Record<SortBy, string> = {
  newest: "En Yeni",
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
        <Button
          variant={filters.hideDelivered ? "default" : "outline"}
          size="sm"
          onClick={() => onFilterChange({ hideDelivered: !filters.hideDelivered })}
          className="flex-shrink-0"
        >
          {filters.hideDelivered ? <EyeOff className="h-4 w-4 mr-1" /> : <Eye className="h-4 w-4 mr-1" />}
          Teslim Edilmemişler
        </Button>

        {/* Sort Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="flex-shrink-0 bg-transparent">
              <SortAsc className="h-4 w-4 mr-1" />
              {sortLabels[sortBy]}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuLabel>Sıralama</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {Object.entries(sortLabels).map(([key, label]) => (
              <DropdownMenuCheckboxItem
                key={key}
                checked={sortBy === key}
                onCheckedChange={() => onSortByChange(key as SortBy)}
              >
                {label}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Group By Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="flex-shrink-0 bg-transparent">
              {groupBy === "supplier" && <Building2 className="h-4 w-4 mr-1" />}
              {groupBy === "requester" && <Users className="h-4 w-4 mr-1" />}
              {groupBy === "none" && <List className="h-4 w-4 mr-1" />}
              {groupLabels[groupBy]}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuLabel>Gruplama</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {Object.entries(groupLabels).map(([key, label]) => (
              <DropdownMenuCheckboxItem
                key={key}
                checked={groupBy === key}
                onCheckedChange={() => onGroupByChange(key as GroupBy)}
              >
                {label}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Filters Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="flex-shrink-0 bg-transparent">
              <Filter className="h-4 w-4 mr-1" />
              Filtreler
              {activeFilterCount > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 text-xs">
                  {activeFilterCount}
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            <DropdownMenuLabel>Durum</DropdownMenuLabel>
            {Object.entries(statusLabels).map(([status, label]) => (
              <DropdownMenuCheckboxItem
                key={status}
                checked={filters.statuses?.includes(status as OrderStatus) || false}
                onCheckedChange={() => handleStatusToggle(status as OrderStatus)}
              >
                {label}
              </DropdownMenuCheckboxItem>
            ))}

            <DropdownMenuSeparator />
            <DropdownMenuLabel>Tedarikçi</DropdownMenuLabel>
            {suppliers.map((supplier) => (
              <DropdownMenuCheckboxItem
                key={supplier}
                checked={filters.suppliers?.includes(supplier) || false}
                onCheckedChange={() => handleSupplierToggle(supplier)}
              >
                {supplier}
              </DropdownMenuCheckboxItem>
            ))}

            <DropdownMenuSeparator />
            <DropdownMenuLabel>İstek Sahibi</DropdownMenuLabel>
            {requesters.map((requester) => (
              <DropdownMenuCheckboxItem
                key={requester}
                checked={filters.requesters?.includes(requester) || false}
                onCheckedChange={() => handleRequesterToggle(requester)}
              >
                {requester}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Active Filters */}
      {(filters.statuses?.length || filters.suppliers?.length || filters.requesters?.length) && (
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
        </div>
      )}
    </div>
  )
}
