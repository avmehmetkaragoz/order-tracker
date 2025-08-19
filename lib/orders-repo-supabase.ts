import { supabase } from "./supabase/client"
import type { Database } from "./supabase/client"
import type { Order, OrderStatus } from "../types/order"

type OrderRow = Database["public"]["Tables"]["orders"]["Row"]
type OrderInsert = Database["public"]["Tables"]["orders"]["Insert"]
type OrderUpdate = Database["public"]["Tables"]["orders"]["Update"]

// Convert database row to Order type
function rowToOrder(row: OrderRow): Order {
  return {
    id: row.id,
    requester: row.requester,
    supplier: row.supplier,
    customer: row.customer || "",
    material: row.material,
    cm: row.cm || undefined,
    mikron: row.mikron || undefined,
    bobinSayisi: row.bobin_sayisi || undefined,
    description: row.description || "",
    quantity: row.quantity,
    unit: row.unit,
    customPrice: row.custom_price,
    pricePerUnit: row.price_per_unit || undefined,
    currency: row.currency as "EUR" | "USD" | "TRY",
    totalPrice: row.total_price || undefined,
    status: row.status as OrderStatus,
    orderedDate: row.ordered_date || undefined,
    etaDate: row.eta_date || undefined,
    deliveredDate: row.delivered_date || undefined,
    notes: row.notes || "",
    tags: row.tags || [],
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  }
}

// Convert Order to database insert
function orderToInsert(order: Omit<Order, "id" | "createdAt" | "updatedAt">): OrderInsert {
  return {
    requester: order.requester,
    supplier: order.supplier,
    customer: order.customer || null,
    material: order.material,
    cm: order.cm || null,
    mikron: order.mikron || null,
    bobin_sayisi: order.bobinSayisi || null,
    description: order.description || null,
    quantity: order.quantity,
    unit: order.unit,
    custom_price: order.customPrice,
    price_per_unit: order.pricePerUnit || null,
    currency: order.currency,
    total_price: order.totalPrice || null,
    status: order.status,
    ordered_date: order.orderedDate || null,
    eta_date: order.etaDate || null,
    delivered_date: order.deliveredDate || null,
    notes: order.notes || null,
    tags: order.tags || null,
  }
}

export const ordersRepo = {
  async getAll(): Promise<Order[]> {
    const { data, error } = await supabase.from("orders").select("*").order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching orders:", error)
      return []
    }

    return data.map(rowToOrder)
  },

  async get(id: string): Promise<Order | null> {
    const { data, error } = await supabase.from("orders").select("*").eq("id", id).single()

    if (error) {
      console.error("Error fetching order:", error)
      return null
    }

    return rowToOrder(data)
  },

  async create(order: Omit<Order, "id" | "createdAt" | "updatedAt">): Promise<Order> {
    const { data, error } = await supabase.from("orders").insert(orderToInsert(order)).select().single()

    if (error) {
      console.error("Error creating order:", error)
      throw new Error("Failed to create order")
    }

    return rowToOrder(data)
  },

  async update(id: string, updates: Partial<Order>): Promise<Order> {
    const updateData: OrderUpdate = {}

    if (updates.requester !== undefined) updateData.requester = updates.requester
    if (updates.supplier !== undefined) updateData.supplier = updates.supplier
    if (updates.customer !== undefined) updateData.customer = updates.customer || null
    if (updates.material !== undefined) updateData.material = updates.material
    if (updates.cm !== undefined) updateData.cm = updates.cm || null
    if (updates.mikron !== undefined) updateData.mikron = updates.mikron || null
    if (updates.bobinSayisi !== undefined) updateData.bobin_sayisi = updates.bobinSayisi || null
    if (updates.description !== undefined) updateData.description = updates.description || null
    if (updates.quantity !== undefined) updateData.quantity = updates.quantity
    if (updates.unit !== undefined) updateData.unit = updates.unit
    if (updates.customPrice !== undefined) updateData.custom_price = updates.customPrice
    if (updates.pricePerUnit !== undefined) updateData.price_per_unit = updates.pricePerUnit || null
    if (updates.currency !== undefined) updateData.currency = updates.currency
    if (updates.totalPrice !== undefined) updateData.total_price = updates.totalPrice || null
    if (updates.status !== undefined) updateData.status = updates.status
    if (updates.orderedDate !== undefined) updateData.ordered_date = updates.orderedDate || null
    if (updates.etaDate !== undefined) updateData.eta_date = updates.etaDate || null
    if (updates.deliveredDate !== undefined) updateData.delivered_date = updates.deliveredDate || null
    if (updates.notes !== undefined) updateData.notes = updates.notes || null
    if (updates.tags !== undefined) updateData.tags = updates.tags || null

    const { data, error } = await supabase.from("orders").update(updateData).eq("id", id).select().single()

    if (error) {
      console.error("Error updating order:", error)
      throw new Error("Failed to update order")
    }

    return rowToOrder(data)
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from("orders").delete().eq("id", id)

    if (error) {
      console.error("Error deleting order:", error)
      throw new Error("Failed to delete order")
    }
  },

  async deleteMultiple(ids: string[]): Promise<void> {
    const { error } = await supabase.from("orders").delete().in("id", ids)

    if (error) {
      console.error("Error deleting orders:", error)
      throw new Error("Failed to delete orders")
    }
  },
}
