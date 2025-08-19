import { ordersRepo } from "./orders-repo"
import { warehouseRepo } from "./warehouse-repo"
import type { Order } from "@/types/order"
import type { WarehouseItem } from "@/types/warehouse"

export class OrderWarehouseIntegration {
  // Convert delivered order to warehouse item
  static async receiveOrderInWarehouse(
    orderId: string,
    warehouseData: {
      actualWeight: number
      actualBobinCount: number
      location?: string
      notes?: string
    },
  ): Promise<{ success: boolean; warehouseItem?: WarehouseItem; error?: string }> {
    try {
      const order = await ordersRepo.get(orderId)
      if (!order) {
        return { success: false, error: "Sipariş bulunamadı" }
      }

      if (order.status !== "Delivered") {
        return { success: false, error: "Sadece teslim edilmiş siparişler depoya alınabilir" }
      }

      const existingWarehouseItem = await warehouseRepo
        .getItems()
        .then((items) => items.find((item) => item.orderId === orderId))

      if (existingWarehouseItem) {
        return { success: false, error: "Bu sipariş zaten depoda kayıtlı" }
      }

      // Calculate actual total price based on actual quantity
      let actualTotalPrice = order.total_price
      if (order.price_per_unit && warehouseData.actualWeight) {
        actualTotalPrice = order.price_per_unit * warehouseData.actualWeight
      }

      // Update order with actual quantities and calculated price
      await ordersRepo.update(orderId, {
        actual_quantity: warehouseData.actualWeight,
        actual_bobin_sayisi: warehouseData.actualBobinCount,
        actual_total_price: actualTotalPrice,
        is_in_warehouse: true,
      })

      // Create warehouse item from order
      const warehouseItem = await warehouseRepo.addItem({
        orderId: order.id,
        material: order.material || "Belirtilmemiş",
        cm: order.cm || 0,
        mikron: order.mikron || 0,
        currentWeight: warehouseData.actualWeight,
        originalWeight: warehouseData.actualWeight,
        bobinCount: warehouseData.actualBobinCount,
        status: "Stokta",
        location: warehouseData.location,
        receivedDate: new Date().toISOString(),
        lastMovementDate: new Date().toISOString(),
        supplier: order.supplier,
        notes: warehouseData.notes || `Depoya alındı - Sipariş ${order.id.slice(0, 8)}...`,
      })

      return { success: true, warehouseItem }
    } catch (error) {
      console.error("Error receiving order in warehouse:", error)
      return { success: false, error: "Depoya alma işlemi sırasında hata oluştu" }
    }
  }

  // Get warehouse status for an order
  static async getOrderWarehouseStatus(orderId: string): Promise<{
    isInWarehouse: boolean
    warehouseItem?: WarehouseItem
    canReceive: boolean
  }> {
    const order = await ordersRepo.get(orderId)
    if (!order) {
      return { isInWarehouse: false, canReceive: false }
    }

    const warehouseItems = await warehouseRepo.getItems()
    const warehouseItem = warehouseItems.find((item) => item.orderId === orderId)

    return {
      isInWarehouse: !!warehouseItem,
      warehouseItem: warehouseItem || undefined,
      canReceive: order.status === "Delivered" && !warehouseItem,
    }
  }

  // Get all orders that can be received in warehouse
  static async getReceivableOrders(): Promise<Order[]> {
    try {
      const orders = await ordersRepo.list()
    const warehouseItems = await warehouseRepo.getItems()
    const ordersInWarehouse = new Set(warehouseItems.map((item) => item.orderId))

      return orders
        .filter((order) => order.status === "Delivered" && !ordersInWarehouse.has(order.id))
        .sort(
          (a, b) =>
            new Date(b.delivered_date || b.created_at).getTime() - new Date(a.delivered_date || a.created_at).getTime(),
        )
    } catch (error) {
      console.error("Error fetching receivable orders:", error)
      return []
    }
  }

  // Get warehouse items linked to orders
  static async getOrderLinkedItems(): Promise<Array<{ order: Order; warehouseItem: WarehouseItem }>> {
    try {
      const orders = await ordersRepo.list()
      const warehouseItems = await warehouseRepo.getItems()
      const linkedItems: Array<{ order: Order; warehouseItem: WarehouseItem }> = []

      for (const warehouseItem of warehouseItems) {
        const order = orders.find((o) => o.id === warehouseItem.orderId)
        if (order) {
          linkedItems.push({ order, warehouseItem })
        }
      }

      return linkedItems
    } catch (error) {
      console.error("Error fetching order linked items:", error)
      return []
    }
  }

  // Process outgoing stock for order fulfillment
  static async processOrderFulfillment(
    warehouseItemId: string,
    fulfillmentData: {
      weightUsed: number
      bobinCountUsed: number
      customerOrder?: string
      destination: string
      operator: string
      notes?: string
    },
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const updatedItem = await warehouseRepo.processOutgoing(
        warehouseItemId,
        fulfillmentData.weightUsed,
        fulfillmentData.bobinCountUsed,
        fulfillmentData.destination,
        fulfillmentData.operator,
        fulfillmentData.notes,
      )

      if (!updatedItem) {
        return { success: false, error: "Depo ürünü bulunamadı" }
      }

      return { success: true }
    } catch (error) {
      console.error("Error processing order fulfillment:", error)
      return { success: false, error: "Sipariş karşılama işlemi sırasında hata oluştu" }
    }
  }

  // Get stock availability for new orders
  static async getStockAvailability(
    material: string,
    cm: number,
    mikron: number,
  ): Promise<{
    availableItems: WarehouseItem[]
    totalWeight: number
    canFulfill: (requiredWeight: number) => boolean
  }> {
    const allItems = await warehouseRepo.getItems()
    const availableItems = allItems.filter(
      (item) =>
        item.material === material &&
        item.cm === cm &&
        item.mikron === mikron &&
        item.status === "Stokta" &&
        item.currentWeight > 0,
    )

    const totalWeight = availableItems.reduce((sum, item) => sum + item.currentWeight, 0)

    return {
      availableItems,
      totalWeight,
      canFulfill: (requiredWeight: number) => totalWeight >= requiredWeight,
    }
  }

  // Generate warehouse summary for orders
  static async getOrderWarehouseSummary(): Promise<{
    totalOrdersInWarehouse: number
    pendingReceival: number
    totalWarehouseValue: number
    lowStockOrders: Array<{ order: Order; warehouseItem: WarehouseItem }>
  }> {
    try {
      const allOrders = await ordersRepo.list()
      const warehouseItems = await warehouseRepo.getItems()
      const ordersInWarehouse = new Set(warehouseItems.map((item) => item.orderId))

      const totalOrdersInWarehouse = ordersInWarehouse.size
      const pendingReceival = allOrders.filter(
        (order) => order.status === "Delivered" && !ordersInWarehouse.has(order.id),
      )

      const linkedItems = await this.getOrderLinkedItems()
      const lowStockItems = linkedItems.filter(({ warehouseItem }) => warehouseItem.currentWeight < 50)

      const totalWarehouseValue = linkedItems.reduce((total, { order }) => {
        return total + (order.total_price || 0)
      }, 0)

      return {
        totalOrdersInWarehouse,
        pendingReceival: pendingReceival.length,
        totalWarehouseValue,
        lowStockOrders: lowStockItems,
      }
    } catch (error) {
      console.error("Error generating warehouse summary:", error)
      return {
        totalOrdersInWarehouse: 0,
        pendingReceival: 0,
        totalWarehouseValue: 0,
        lowStockOrders: [],
      }
    }
  }
}
