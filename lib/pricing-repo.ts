import type { SupplierPrice } from "@/types/order"
import { supabase } from "./supabase/client"

class PricingRepository {
  async getPrices(): Promise<SupplierPrice[]> {
    const { data, error } = await supabase.from("pricing").select("*").order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching prices:", error)
      return []
    }

    return data || []
  }

  async addPrice(price: Omit<SupplierPrice, "id">): Promise<SupplierPrice> {
    // Deactivate existing active prices for same supplier/material
    await supabase
      .from("pricing")
      .update({ is_active: false })
      .eq("supplier", price.supplier)
      .eq("material", price.material)
      .eq("is_active", true)

    const { data, error } = await supabase.from("pricing").insert([price]).select().single()

    if (error) {
      console.error("Error adding price:", error)
      throw new Error("Failed to add price")
    }

    return data
  }

  async updatePrice(id: string, updates: Partial<SupplierPrice>): Promise<void> {
    const { error } = await supabase.from("pricing").update(updates).eq("id", id)

    if (error) {
      console.error("Error updating price:", error)
    }

  }

  async deletePrice(id: string): Promise<void> {
    const { error } = await supabase.from("pricing").delete().eq("id", id)

    if (error) {
      console.error("Error deleting price:", error)
    }

  }

  async getActivePrice(supplier: string, material: string): Promise<SupplierPrice | null> {
    
    // Use direct fetch to bypass custom wrapper
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    
    try {
      const url = `${supabaseUrl}/rest/v1/pricing?select=*&supplier=eq.${supplier}&material=eq.${material}&is_active=eq.true`
      const response = await fetch(url, {
        headers: {
          'apikey': supabaseAnonKey,
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (!response.ok) {
        return null
      }
      
      const data = await response.json()
      
      if (Array.isArray(data) && data.length > 0) {
        return data[0] as SupplierPrice
      }
      
      return null
    } catch (error) {
      return null
    }
  }

  async getPriceHistory(supplier: string, material?: string): Promise<SupplierPrice[]> {
    let query = supabase.from("pricing").select("*").eq("supplier", supplier)

    if (material) {
      query = query.eq("material", material)
    }

    const { data, error } = await query.order("effective_date", { ascending: false })

    if (error) {
      console.error("Error fetching price history:", error)
      return []
    }

    return data || []
  }

  async getSupplierPrices(supplier: string): Promise<SupplierPrice[]> {
    const { data, error } = await supabase
      .from("pricing")
      .select("*")
      .eq("supplier", supplier)
      .eq("is_active", true)
      .order("material")

    if (error) {
      console.error("Error fetching supplier prices:", error)
      return []
    }

    return data || []
  }

  async calculateOrderPrice(
    supplier: string,
    material: string,
    quantity: number,
  ): Promise<{ pricePerKg: number; totalPrice: number; currency: string } | null> {
    const activePrice = await this.getActivePrice(supplier, material)

    if (!activePrice) return null

    return {
      pricePerKg: activePrice.price_per_unit,
      totalPrice: activePrice.price_per_unit * quantity,
      currency: activePrice.currency,
    }
  }

  async checkExistingPrice(supplier: string, material: string, effectiveDate: string): Promise<SupplierPrice | null> {
    const { data, error } = await supabase
      .from("pricing")
      .select("*")
      .eq("supplier", supplier)
      .eq("material", material)
      .eq("effective_date", effectiveDate)

    if (error) {
      console.error("Error checking existing price:", error)
      return null
    }

    // Return the first result if any exist, otherwise null
    return data && data.length > 0 ? data[0] : null
  }

  async deleteSupplierPrices(supplier: string): Promise<void> {
    const { error } = await supabase.from("pricing").delete().eq("supplier", supplier)

    if (error) {
      console.error("Error deleting supplier prices:", error)
      throw new Error("Failed to delete supplier prices")
    }

  }
}

export const pricingRepo = new PricingRepository()
