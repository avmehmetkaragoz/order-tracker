import type { Order, OrderFilters } from "@/types/order"
import { supabase } from "./supabase/client"

class OrdersRepository {
  async list(filters?: OrderFilters): Promise<Order[]> {
    console.log("[v0] OrdersRepository.list called with filters:", filters)

    try {
      let query = supabase.from("orders").select("*")
      console.log("[v0] Base query created")

      if (filters) {
        console.log("[v0] Applying filters:", filters)

        if (filters.search) {
          const searchLower = filters.search.toLowerCase()
          console.log("[v0] Applying search filter:", searchLower)

          if (filters.searchField) {
            // Search in specific field
            switch (filters.searchField) {
              case "requester":
                query = query.ilike("requester", `%${searchLower}%`)
                break
              case "supplier":
                query = query.ilike("supplier", `%${searchLower}%`)
                break
              case "customer":
                query = query.ilike("customer", `%${searchLower}%`)
                break
              case "material":
                query = query.ilike("material", `%${searchLower}%`)
                break
              case "notes":
                query = query.ilike("notes", `%${searchLower}%`)
                break
              case "mikron":
                // Numeric search for mikron field
                const mikronValue = parseFloat(filters.search)
                if (!isNaN(mikronValue)) {
                  query = query.eq("mikron", mikronValue)
                }
                break
              case "cm":
                // Numeric search for cm field
                const cmValue = parseFloat(filters.search)
                if (!isNaN(cmValue)) {
                  query = query.eq("cm", cmValue)
                }
                break
              case "bobinSayisi":
                // Numeric search for bobin_sayisi field
                const bobinValue = parseInt(filters.search)
                if (!isNaN(bobinValue)) {
                  query = query.eq("bobin_sayisi", bobinValue)
                }
                break
              case "quantity":
                // Numeric search for quantity field
                const quantityValue = parseFloat(filters.search)
                if (!isNaN(quantityValue)) {
                  query = query.eq("quantity", quantityValue)
                }
                break
              default:
                break
            }
          } else {
            // Search across multiple fields
            const numericValue = parseFloat(filters.search)
            const intValue = parseInt(filters.search)
            
            let orConditions = [
              `requester.ilike.%${searchLower}%`,
              `supplier.ilike.%${searchLower}%`,
              `customer.ilike.%${searchLower}%`,
              `material.ilike.%${searchLower}%`,
              `notes.ilike.%${searchLower}%`
            ]
            
            // Add numeric field searches if the search term is a valid number
            if (!isNaN(numericValue)) {
              orConditions.push(`mikron.eq.${numericValue}`)
              orConditions.push(`cm.eq.${numericValue}`)
              orConditions.push(`quantity.eq.${numericValue}`)
            }
            
            if (!isNaN(intValue)) {
              orConditions.push(`bobin_sayisi.eq.${intValue}`)
            }
            
            query = query.or(orConditions.join(','))
          }
        }

        if (filters.statuses && filters.statuses.length > 0) {
          console.log("[v0] Applying status filter:", filters.statuses)
          query = query.in("status", filters.statuses)
        }

        if (filters.suppliers && filters.suppliers.length > 0) {
          console.log("[v0] Applying supplier filter:", filters.suppliers)
          query = query.in("supplier", filters.suppliers)
        }

        if (filters.requesters && filters.requesters.length > 0) {
          console.log("[v0] Applying requester filter:", filters.requesters)
          query = query.in("requester", filters.requesters)
        }

        if (filters.hideDelivered !== undefined) {
          if (filters.hideDelivered) {
            console.log("[v0] Applying hideDelivered filter - showing only undelivered")
            query = query.not("status", "in", '("Delivered","Cancelled")')
          } else {
            console.log("[v0] Applying hideDelivered filter - showing only delivered")
            query = query.in("status", ["Delivered", "Cancelled"])
          }
        }

        if (filters.dateRange) {
          console.log("[v0] Applying date range filter:", filters.dateRange)
          query = query.gte("created_at", filters.dateRange.start).lte("created_at", filters.dateRange.end)
        }
      }

      console.log("[v0] About to execute orders query")
      const { data, error } = await query.order("created_at", { ascending: false })

      if (error) {
        console.error("[v0] Orders query error details:", {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
        })
        return []
      }

      console.log("[v0] Orders query successful, returned", data?.length || 0, "orders")
      return data || []
    } catch (err) {
      console.error("[v0] Orders repository exception:", err)
      throw err
    }
  }

  async get(id: string): Promise<Order | null> {
    const { data, error } = await supabase.from("orders").select("*").eq("id", id).single()

    if (error) {
      console.error("Error fetching order:", error)
      return null
    }

    return data
  }

  async create(order: Omit<Order, "id">): Promise<Order> {
    console.log("[v0] OrdersRepository.create called with:", order)
    
    const { data, error } = await supabase.from("orders").insert([order]).select("*").single()

    if (error) {
      console.error("[v0] Supabase error creating order:", {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      })
      console.error("[v0] Order data that caused error:", order)
      throw new Error(`Failed to create order: ${error.message}`)
    }

    console.log("[v0] Order created successfully:", data)
    return data
  }

  async update(id: string, patch: Partial<Order>): Promise<Order | null> {
    console.log("[v0] OrdersRepository.update called with:", { id, patch })
    
    // Auto-set deliveredDate when status changes to Delivered
    if (patch.status === "Delivered" && !patch.delivered_date) {
      patch.delivered_date = new Date().toISOString().split("T")[0]
    }

    const { data, error } = await supabase.from("orders").update(patch).eq("id", id).select().single()

    if (error) {
      console.error("[v0] Supabase error updating order:", {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      })
      console.error("[v0] Update patch that caused error:", patch)
      console.error("[v0] Order ID:", id)
      return null
    }

    console.log("[v0] Order updated successfully:", data)
    return data
  }

  async remove(id: string): Promise<boolean> {
    const { error } = await supabase.from("orders").delete().eq("id", id)

    if (error) {
      console.error("Error deleting order:", error)
      return false
    }

    return true
  }

  async removeBulk(ids: string[]): Promise<number> {
    const { data, error } = await supabase.from("orders").delete().in("id", ids).select("id")

    if (error) {
      console.error("Error bulk deleting orders:", error)
      return 0
    }

    return data?.length || 0
  }

  async exportData(): Promise<string> {
    const orders = await this.list()
    return JSON.stringify(orders, null, 2)
  }

  async importData(jsonData: string): Promise<{ success: boolean; count?: number; error?: string }> {
    try {
      const orders = JSON.parse(jsonData)

      if (!Array.isArray(orders)) {
        return { success: false, error: "Invalid data format" }
      }

      const { data, error } = await supabase.from("orders").insert(orders).select("id")

      if (error) {
        return { success: false, error: error.message }
      }

      return { success: true, count: data?.length || 0 }
    } catch (error) {
      return { success: false, error: "Invalid JSON format" }
    }
  }

  async getSuppliers(): Promise<string[]> {
    const { data, error } = await supabase.from("orders").select("supplier").not("supplier", "is", null)

    if (error) {
      console.error("Error fetching suppliers:", error)
      return []
    }

    const suppliers = [...new Set(data.map((item) => item.supplier))]
    return suppliers.sort()
  }

  async getRequesters(): Promise<string[]> {
    const { data, error } = await supabase.from("orders").select("requester").not("requester", "is", null)

    if (error) {
      console.error("Error fetching requesters:", error)
      return []
    }

    const requesters = [...new Set(data.map((item) => item.requester))]
    return requesters.sort()
  }

}

export const ordersRepo = new OrdersRepository()
