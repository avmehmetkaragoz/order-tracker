"use client"

import { useState } from "react"
import { ChevronDown, ChevronRight } from "lucide-react"
import type { Order, GroupBy } from "@/types/order"
import { OrderItem } from "@/components/order-item"

interface OrderListProps {
  orders: Order[]
  groupBy: GroupBy
  onMarkDelivered: (orderId: string) => void
  onOrderClick: (orderId: string) => void
  onDelete?: (orderId: string) => void
  selectedOrders?: string[]
  onSelectionChange?: (orderId: string, selected: boolean) => void
  showSelection?: boolean
  onStatusChange?: (orderId: string, newStatus: Order["status"]) => void
  onRequesterChange?: (orderId: string, newRequester: string) => void
  onSupplierChange?: (orderId: string, newSupplier: string) => void
}

export function OrderList({
  orders,
  groupBy,
  onMarkDelivered,
  onOrderClick,
  onDelete,
  selectedOrders = [],
  onSelectionChange,
  showSelection = false,
  onStatusChange,
  onRequesterChange,
  onSupplierChange,
}: OrderListProps) {
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set())

  const toggleSection = (sectionKey: string) => {
    const newCollapsed = new Set(collapsedSections)
    if (newCollapsed.has(sectionKey)) {
      newCollapsed.delete(sectionKey)
    } else {
      newCollapsed.add(sectionKey)
    }
    setCollapsedSections(newCollapsed)
  }

  if (groupBy === "none") {
    return (
      <div className="space-y-3 py-4">
        {orders.map((order) => (
          <OrderItem
            key={order.id}
            order={order}
            onMarkDelivered={onMarkDelivered}
            onOrderClick={onOrderClick}
            onDelete={onDelete}
            isSelected={selectedOrders.includes(order.id)}
            onSelectionChange={onSelectionChange}
            showSelection={showSelection}
            onStatusChange={onStatusChange}
            onRequesterChange={onRequesterChange}
            onSupplierChange={onSupplierChange}
          />
        ))}
      </div>
    )
  }

  // Group orders
  const groupedOrders = orders.reduce(
    (groups, order) => {
      const key = groupBy === "supplier" ? order.supplier : order.requester
      if (!groups[key]) {
        groups[key] = []
      }
      groups[key].push(order)
      return groups
    },
    {} as Record<string, Order[]>,
  )

  // Separate delivered and undelivered
  const undeliveredGroups: Record<string, Order[]> = {}
  const deliveredGroups: Record<string, Order[]> = {}

  Object.entries(groupedOrders).forEach(([key, orders]) => {
    const undelivered = orders.filter((o) => o.status !== "Delivered" && o.status !== "Cancelled")
    const delivered = orders.filter((o) => o.status === "Delivered" || o.status === "Cancelled")

    if (undelivered.length > 0) {
      undeliveredGroups[key] = undelivered
    }
    if (delivered.length > 0) {
      deliveredGroups[key] = delivered
    }
  })

  return (
    <div className="py-4 space-y-6">
      {/* Undelivered Orders */}
      {Object.keys(undeliveredGroups).length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-4 text-orange-500">HENÜZ TESLİM EDİLMEMİŞLER</h2>
          <div className="space-y-3">
            {Object.entries(undeliveredGroups).map(([groupKey, groupOrders]) => {
              const sectionKey = `undelivered-${groupKey}`
              const isCollapsed = collapsedSections.has(sectionKey)

              return (
                <div key={sectionKey}>
                  <div
                    className="flex items-center gap-3 mb-3 cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={() => toggleSection(sectionKey)}
                  >
                    <div className="h-px bg-border flex-1" />
                    <div className="flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-700 text-sm font-medium rounded-full">
                      {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      {groupKey} ({groupOrders.length})
                    </div>
                    <div className="h-px bg-border flex-1" />
                  </div>

                  {!isCollapsed && (
                    <div className="space-y-3">
                      {groupOrders.map((order) => (
                        <OrderItem
                          key={order.id}
                          order={order}
                          onMarkDelivered={onMarkDelivered}
                          onOrderClick={onOrderClick}
                          onDelete={onDelete}
                          isSelected={selectedOrders.includes(order.id)}
                          onSelectionChange={onSelectionChange}
                          showSelection={showSelection}
                          onStatusChange={onStatusChange}
                          onRequesterChange={onRequesterChange}
                          onSupplierChange={onSupplierChange}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Delivered Orders */}
      {Object.keys(deliveredGroups).length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-4 text-green-500">TESLİM EDİLENLER</h2>
          <div className="space-y-3">
            {Object.entries(deliveredGroups).map(([groupKey, groupOrders]) => {
              const sectionKey = `delivered-${groupKey}`
              const isCollapsed = collapsedSections.has(sectionKey)

              return (
                <div key={sectionKey}>
                  <div
                    className="flex items-center gap-3 mb-3 cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={() => toggleSection(sectionKey)}
                  >
                    <div className="h-px bg-border flex-1" />
                    <div className="flex items-center gap-2 px-3 py-1 bg-green-50 text-green-700 text-sm font-medium rounded-full">
                      {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      {groupKey} ({groupOrders.length})
                    </div>
                    <div className="h-px bg-border flex-1" />
                  </div>

                  {!isCollapsed && (
                    <div className="space-y-3">
                      {groupOrders.map((order) => (
                        <OrderItem
                          key={order.id}
                          order={order}
                          onMarkDelivered={onMarkDelivered}
                          onOrderClick={onOrderClick}
                          onDelete={onDelete}
                          isSelected={selectedOrders.includes(order.id)}
                          onSelectionChange={onSelectionChange}
                          showSelection={showSelection}
                          onStatusChange={onStatusChange}
                          onRequesterChange={onRequesterChange}
                          onSupplierChange={onSupplierChange}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
