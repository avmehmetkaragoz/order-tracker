import { supabase } from "./supabase/client"

class SettingsRepository {
  async getSuppliers(): Promise<string[]> {
    console.log("[v0] SettingsRepository.getSuppliers called")
    const { data, error } = await supabase.from("settings").select("value").eq("key", "suppliers")

    console.log("[v0] getSuppliers query result:", { data, error })
    if (error || !data || data.length === 0) {
      console.log("[v0] getSuppliers returning empty array")
      return []
    }

    const suppliers = data[0]?.value || []
    console.log("[v0] getSuppliers returning:", suppliers)
    return suppliers
  }

  async saveSuppliers(suppliers: string[]): Promise<void> {
    console.log("[v0] SettingsRepository.saveSuppliers called with:", suppliers)
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
    console.log("[v0] saveSuppliers completed successfully")
  }

  async addSupplier(supplier: string): Promise<void> {
    console.log("[v0] SettingsRepository.addSupplier called with:", supplier)
    const suppliers = await this.getSuppliers()
    console.log("[v0] Current suppliers before add:", suppliers)
    if (!suppliers.includes(supplier)) {
      suppliers.push(supplier)
      suppliers.sort()
      console.log("[v0] New suppliers list:", suppliers)
      await this.saveSuppliers(suppliers)
    } else {
      console.log("[v0] Supplier already exists, skipping add")
    }
  }

  async removeSupplier(supplier: string): Promise<void> {
    console.log("[v0] SettingsRepository.removeSupplier called with:", supplier)
    const suppliers = await this.getSuppliers()
    console.log("[v0] Current suppliers before remove:", suppliers)
    const filtered = suppliers.filter((s) => s !== supplier)
    console.log("[v0] Filtered suppliers list:", filtered)
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
