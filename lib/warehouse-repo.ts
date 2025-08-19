import type {
  WarehouseItem,
  StockMovement,
  WarehouseFilters,
  WarehouseSummary,
  WarehouseItemStatus,
} from "@/types/warehouse"
import { supabase } from "./supabase/client"

class WarehouseRepository {
  async getItems(filters?: WarehouseFilters): Promise<WarehouseItem[]> {
    console.log("[v0] WarehouseRepository.getItems called with filters:", filters)

    let query = supabase.from("warehouse_items").select("*")

    if (filters) {
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase()
        query = query.or(
          `material.ilike.%${searchTerm}%,barcode.ilike.%${searchTerm}%,supplier.ilike.%${searchTerm}%,notes.ilike.%${searchTerm}%`,
        )
      }

      if (filters.materials?.length) {
        query = query.in("material", filters.materials)
      }

      if (filters.suppliers?.length) {
        query = query.in("supplier", filters.suppliers)
      }

      if (filters.statuses?.length) {
        query = query.in("status", filters.statuses)
      }

      if (filters.weightRange) {
        query = query.gte("current_weight", filters.weightRange.min).lte("current_weight", filters.weightRange.max)
      }

      if (filters.dateRange) {
        query = query.gte("created_at", filters.dateRange.start).lte("created_at", filters.dateRange.end)
      }
    }

    console.log("[v0] About to execute warehouse query")
    const { data, error } = await query.order("created_at", { ascending: false })

    if (error) {
      console.error("[v0] Detailed warehouse query error:", error)
      console.error("[v0] Error code:", error.code)
      console.error("[v0] Error message:", error.message)
      console.error("[v0] Error details:", error.details)
      return []
    }

    console.log("[v0] Warehouse query successful, returned", data?.length || 0, "items")
    console.log("[v0] Raw warehouse items data:", data)

    if (!data) return []

    // Map database fields to TypeScript types
    const mappedItems: WarehouseItem[] = data.map(item => ({
      id: item.id,
      barcode: item.barcode,
      orderId: item.order_id,
      material: item.material,
      cm: item.cm,
      mikron: item.mikron,
      currentWeight: item.current_weight,
      originalWeight: item.original_weight,
      bobinCount: item.coil_count,
      status: item.status,
      location: item.location,
      receivedDate: item.created_at,
      lastMovementDate: item.updated_at,
      supplier: item.supplier,
      notes: item.notes,
      tags: item.tags
    }))

    console.log("[v0] Mapped warehouse items:", mappedItems)
    return mappedItems
  }

  async getItemById(id: string): Promise<WarehouseItem | null> {
    console.log("[v0] WarehouseRepository.getItemById called with id:", id)
    const { data, error } = await supabase.from("warehouse_items").select("*").eq("id", id).single()

    if (error) {
      console.error("[v0] Error fetching warehouse item:", error)
      return null
    }

    console.log("[v0] Raw warehouse item data:", data)

    if (!data) return null

    // Map database fields to TypeScript types
    const mappedItem: WarehouseItem = {
      id: data.id,
      barcode: data.barcode,
      orderId: data.order_id,
      material: data.material,
      cm: data.cm,
      mikron: data.mikron,
      currentWeight: data.current_weight,
      originalWeight: data.original_weight,
      bobinCount: data.coil_count,
      status: data.status,
      location: data.location,
      receivedDate: data.created_at, // Using created_at as receivedDate since received_date doesn't exist
      lastMovementDate: data.updated_at,
      supplier: data.supplier,
      notes: data.notes,
      tags: data.tags
    }

    console.log("[v0] Mapped warehouse item:", mappedItem)
    return mappedItem
  }

  async getItemByBarcode(barcode: string): Promise<WarehouseItem | null> {
    const { data, error } = await supabase.from("warehouse_items").select("*").eq("barcode", barcode).single()

    if (error) {
      console.error("Error fetching warehouse item by barcode:", error)
      return null
    }

    return data
  }

  async getItemsByOrderId(orderId: string): Promise<WarehouseItem[]> {
    const { data, error } = await supabase.from("warehouse_items").select("*").eq("order_id", orderId)

    if (error) {
      console.error("Error fetching warehouse items by order ID:", error)
      return []
    }

    return data || []
  }

  async addItem(item: Omit<WarehouseItem, "id" | "barcode">): Promise<WarehouseItem> {
    console.log("[v0] WarehouseRepository.addItem called with:", item)
    
    // Map TypeScript types to database fields
    const dbItem = {
      order_id: item.orderId,
      material: item.material,
      cm: item.cm,
      mikron: item.mikron,
      current_weight: item.currentWeight,
      original_weight: item.originalWeight,
      coil_count: item.bobinCount,
      status: item.status,
      location: item.location || "Genel Depo", // Provide default value
      supplier: item.supplier,
      notes: item.notes,
      barcode: this.generateBarcode(),
    }

    console.log("[v0] Mapped database item:", dbItem)

    const { data, error } = await supabase.from("warehouse_items").insert([dbItem]).select().single()

    if (error) {
      console.error("[v0] Error adding warehouse item:", error)
      console.error("[v0] Error code:", error.code)
      console.error("[v0] Error message:", error.message)
      console.error("[v0] Error details:", error.details)
      console.error("[v0] Error hint:", error.hint)
      throw new Error(`Failed to add warehouse item: ${error.message}`)
    }

    console.log("[v0] Warehouse item added successfully:", data)

    // Create initial stock movement
    await this.addStockMovement({
      warehouse_item_id: data.id,
      type: "Gelen",
      quantity: data.current_weight,
      operator: "Sistem",
      notes: "İlk stok girişi",
    })

    // Return mapped item
    return this.getItemById(data.id) as Promise<WarehouseItem>
  }

  async updateItem(id: string, updates: Partial<WarehouseItem>): Promise<WarehouseItem | null> {
    const { data, error } = await supabase.from("warehouse_items").update(updates).eq("id", id).select().single()

    if (error) {
      console.error("Error updating warehouse item:", error)
      return null
    }

    return data
  }

  async deleteItem(id: string): Promise<boolean> {
    const { error } = await supabase.from("warehouse_items").delete().eq("id", id)

    if (error) {
      console.error("Error deleting warehouse item:", error)
      return false
    }

    return true
  }

  async getStockMovements(warehouseItemId?: string): Promise<StockMovement[]> {
    console.log("[v0] WarehouseRepository.getStockMovements called with warehouseItemId:", warehouseItemId)
    let query = supabase.from("stock_movements").select("*")

    if (warehouseItemId) {
      query = query.eq("warehouse_item_id", warehouseItemId)
    }

    const { data, error } = await query.order("created_at", { ascending: false })

    if (error) {
      console.error("[v0] Error fetching stock movements:", error)
      return []
    }

    console.log("[v0] Raw stock movements data:", data)

    if (!data) return []

    // Map database fields to TypeScript types
    const mappedMovements: StockMovement[] = data.map(movement => ({
      id: movement.id,
      warehouseItemId: movement.warehouse_item_id,
      barcode: movement.barcode || '',
      type: movement.type,
      weightBefore: 0, // We don't have this in current schema
      weightAfter: movement.quantity || 0, // Using quantity as weightAfter for now
      bobinCountBefore: 0, // We don't have this in current schema
      bobinCountAfter: 0, // We don't have this in current schema
      movementDate: movement.created_at,
      destination: movement.destination,
      operator: movement.operator,
      notes: movement.notes,
      orderId: movement.order_id
    }))

    console.log("[v0] Mapped stock movements:", mappedMovements)
    return mappedMovements
  }

  async addStockMovement(movement: {
    warehouse_item_id: string;
    type: string;
    quantity: number;
    operator: string;
    notes?: string;
  }): Promise<any> {
    console.log("[v0] Adding stock movement:", movement)
    const { data, error } = await supabase.from("stock_movements").insert([movement]).select().single()

    if (error) {
      console.error("[v0] Error adding stock movement:", error)
      throw new Error("Failed to add stock movement")
    }

    console.log("[v0] Stock movement added:", data)
    return data
  }

  async processOutgoing(
    itemId: string,
    weightUsed: number,
    bobinCountUsed: number,
    destination: string,
    operator: string,
    notes?: string,
  ): Promise<WarehouseItem | null> {
    const item = await this.getItemById(itemId)
    if (!item) return null

    const newWeight = Math.max(0, item.currentWeight - weightUsed)
    const newBobinCount = Math.max(0, item.bobinCount - bobinCountUsed)

    // Add stock movement
    await this.addStockMovement({
      warehouse_item_id: itemId,
      type: "Çıkan",
      quantity: -weightUsed,
      operator,
      notes: notes || `Çıkış: ${destination}`,
    })

    const status: WarehouseItemStatus = newWeight === 0 ? "Stok Yok" : "Stokta"
    
    // Update using database field names
    const { data, error } = await supabase.from("warehouse_items").update({
      current_weight: newWeight,
      coil_count: newBobinCount,
      status,
    }).eq("id", itemId).select().single()

    if (error) {
      console.error("Error updating warehouse item:", error)
      return null
    }

    // Return mapped item
    return this.getItemById(itemId)
  }

  async processReturn(
    itemId: string,
    weightReturned: number,
    bobinCountReturned: number,
    operator: string,
    notes?: string,
  ): Promise<WarehouseItem | null> {
    const item = await this.getItemById(itemId)
    if (!item) return null

    const newWeight = item.currentWeight + weightReturned
    const newBobinCount = item.bobinCount + bobinCountReturned

    // Add stock movement
    await this.addStockMovement({
      warehouse_item_id: itemId,
      type: "İade",
      quantity: weightReturned,
      operator,
      notes: notes || "İade girişi",
    })

    // Update using database field names
    const { data, error } = await supabase.from("warehouse_items").update({
      current_weight: newWeight,
      coil_count: newBobinCount,
      status: "Stokta",
    }).eq("id", itemId).select().single()

    if (error) {
      console.error("Error updating warehouse item:", error)
      return null
    }

    // Return mapped item
    return this.getItemById(itemId)
  }

  async getWarehouseSummary(): Promise<WarehouseSummary> {
    console.log("[v0] WarehouseRepository.getWarehouseSummary called")

    const items = await this.getItems()
    console.log("[v0] Got", items.length, "items for summary calculation")

    const summary: WarehouseSummary = {
      totalItems: items.length,
      totalWeight: items.reduce((sum, item) => sum + (item.currentWeight || 0), 0),
      itemsByStatus: {
        Stokta: 0,
        Rezerve: 0,
        "Stok Yok": 0,
        Hasarlı: 0,
      },
      itemsByMaterial: {},
      lowStockItems: items.filter((item) => (item.currentWeight || 0) < 50),
    }

    items.forEach((item) => {
      summary.itemsByStatus[item.status as keyof typeof summary.itemsByStatus]++
      summary.itemsByMaterial[item.material] = (summary.itemsByMaterial[item.material] || 0) + 1
    })

    return summary
  }

  private generateBarcode(): string {
    const timestamp = Date.now().toString()
    const random = Math.random().toString(36).substring(2, 8).toUpperCase()
    return `WH${timestamp.slice(-6)}${random}`
  }
}

export const warehouseRepo = new WarehouseRepository()
