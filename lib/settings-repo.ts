import { supabase } from "./supabase/client"

class SettingsRepository {
  async getSuppliers(): Promise<string[]> {
    
    const { data, error } = await supabase.from("settings").select("value").eq("key", "suppliers")

    
    if (error || !data || data.length === 0) {
      
      return []
    }

    const suppliers = data[0]?.value || []
    
    return suppliers
  }

  async saveSuppliers(suppliers: string[]): Promise<void> {
    
    const { error } = await supabase.from("settings").upsert(
      {
        key: "suppliers",
        value: suppliers,
      },
      {
        onConflict: "key",
      },
    )

    if (error) {
      console.error("[v0] Error saving suppliers:", error)
      throw error
    }
    
  }

  async addSupplier(supplier: string): Promise<void> {
    
    const suppliers = await this.getSuppliers()
    
    if (!suppliers.includes(supplier)) {
      suppliers.push(supplier)
      suppliers.sort()
      
      await this.saveSuppliers(suppliers)
    } else {
      
    }
  }

  async removeSupplier(supplier: string): Promise<void> {
    
    const suppliers = await this.getSuppliers()
    
    const filtered = suppliers.filter((s) => s !== supplier)
    
    await this.saveSuppliers(filtered)
  }

  async getRequesters(): Promise<string[]> {
    const { data, error } = await supabase.from("settings").select("value").eq("key", "requesters")

    if (error || !data || data.length === 0) {
      return []
    }

    return data[0]?.value || []
  }

  async saveRequesters(requesters: string[]): Promise<void> {
    const { error } = await supabase.from("settings").upsert(
      {
        key: "requesters",
        value: requesters,
      },
      {
        onConflict: "key",
      },
    )

    if (error) {
      console.error("Error saving requesters:", error)
      throw error
    }
  }

  async addRequester(requester: string): Promise<void> {
    const requesters = await this.getRequesters()
    if (!requesters.includes(requester)) {
      requesters.push(requester)
      requesters.sort()
      await this.saveRequesters(requesters)
    }
  }

  async removeRequester(requester: string): Promise<void> {
    const requesters = await this.getRequesters()
    const filtered = requesters.filter((r) => r !== requester)
    await this.saveRequesters(filtered)
  }

  async getCustomers(): Promise<string[]> {
    const { data, error } = await supabase.from("settings").select("value").eq("key", "customers")

    if (error || !data || data.length === 0) {
      return []
    }

    return data[0]?.value || []
  }

  async saveCustomers(customers: string[]): Promise<void> {
    const { error } = await supabase.from("settings").upsert(
      {
        key: "customers",
        value: customers,
      },
      {
        onConflict: "key",
      },
    )

    if (error) {
      console.error("Error saving customers:", error)
      throw error
    }
  }

  async addCustomer(customer: string): Promise<void> {
    const customers = await this.getCustomers()
    if (!customers.includes(customer)) {
      customers.push(customer)
      customers.sort()
      await this.saveCustomers(customers)
    }
  }

  async removeCustomer(customer: string): Promise<void> {
    const customers = await this.getCustomers()
    const filtered = customers.filter((c) => c !== customer)
    await this.saveCustomers(filtered)
  }
}

export const settingsRepo = new SettingsRepository()
