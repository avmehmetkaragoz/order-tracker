import type {
  WarehouseItem,
  StockMovement,
  WarehouseFilters,
  WarehouseSummary,
  WarehouseItemStatus,
} from "@/types/warehouse"
import { supabase } from "./supabase/client"
import { QRGenerator } from "./qr-generator"
import { ActivityLogger } from "./activity-logger"

class WarehouseRepository {
  async getItems(filters?: WarehouseFilters): Promise<WarehouseItem[]> {
    

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

    
    const { data, error } = await query.order("created_at", { ascending: false })

    if (error) {
      return []
    }

    
    

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
      originalBobinCount: item.original_coil_count || item.coil_count, // Use original_coil_count from DB
      status: item.status,
      stockType: item.stock_type || 'general', // Map stock_type from DB
      customerName: item.customer_name, // Map customer_name from DB
      location: item.location,
      receivedDate: item.created_at,
      lastMovementDate: item.updated_at,
      supplier: item.supplier,
      notes: item.notes,
      tags: item.tags
    }))

    
    return mappedItems
  }

  async getItemById(id: string): Promise<WarehouseItem | null> {
    
    const { data, error } = await supabase.from("warehouse_items").select("*").eq("id", id).single()

    if (error) {
      return null
    }

    

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
      originalBobinCount: data.original_coil_count || data.coil_count, // Use original_coil_count from DB
      status: data.status,
      stockType: data.stock_type || 'general', // Map stock_type from DB
      customerName: data.customer_name, // Map customer_name from DB
      location: data.location,
      receivedDate: data.created_at, // Using created_at as receivedDate since received_date doesn't exist
      lastMovementDate: data.updated_at,
      supplier: data.supplier,
      notes: data.notes,
      tags: data.tags
    }

    
    return mappedItem
  }

  async getItemByBarcode(barcode: string): Promise<WarehouseItem | null> {
    
    
    if (!barcode || typeof barcode !== 'string' || barcode.trim().length === 0) {
      
      return null
    }

    try {
      let searchBarcode = barcode.trim()
      
      // Check if this is a coil QR code (format: DK250821B16-C01)
      if (searchBarcode.includes('-C') && /^[A-Z0-9]+-C\d+$/i.test(searchBarcode)) {
        const parts = searchBarcode.split('-C')
        if (parts.length === 2) {
          searchBarcode = parts[0] // Extract parent ID (DK250821B16)
          
        }
      }

      // Use enhanced barcode matching strategies
      const matchingItem = await this.findBarcodeWithStrategies(searchBarcode)
      
      if (matchingItem) {
        
        return this.mapDatabaseItemToWarehouseItem(matchingItem)
      }

      
      return null

    } catch (error) {
      return null
    }
  }

  // Helper method to map database item to WarehouseItem
  private mapDatabaseItemToWarehouseItem(data: any): WarehouseItem {
    return {
      id: data.id,
      barcode: data.barcode,
      orderId: data.order_id,
      material: data.material,
      cm: data.cm,
      mikron: data.mikron,
      currentWeight: data.current_weight,
      originalWeight: data.original_weight,
      bobinCount: data.coil_count,
      originalBobinCount: data.original_coil_count || data.coil_count,
      status: data.status,
      stockType: data.stock_type || 'general',
      customerName: data.customer_name,
      location: data.location,
      receivedDate: data.created_at,
      lastMovementDate: data.updated_at,
      supplier: data.supplier,
      notes: data.notes,
      tags: data.tags
    }
  }

  // Helper method to normalize barcodes for better matching
  private normalizeBarcode(barcode: string): string {
    if (!barcode || typeof barcode !== 'string') {
      return ''
    }

    // Remove whitespace and convert to uppercase
    let normalized = barcode.trim().toUpperCase()

    // Remove any non-alphanumeric characters
    normalized = normalized.replace(/[^A-Z0-9]/g, '')

    // Enhanced OCR error correction
    normalized = normalized
      .replace(/[O]/g, '0')     // O -> 0
      .replace(/[I]/g, '1')     // I -> 1
      .replace(/[L]/g, '1')     // L -> 1
      .replace(/[S]/g, '5')     // S -> 5
      .replace(/[Z]/g, '2')     // Z -> 2
      .replace(/[B]/g, '8')     // B -> 8
      .replace(/[G]/g, '6')     // G -> 6
      .replace(/[Q]/g, '0')     // Q -> 0
      .replace(/[D]/g, '0')     // D -> 0 (sometimes confused with 0)

    
    return normalized
  }

  // Enhanced barcode matching with multiple strategies
  private async findBarcodeWithStrategies(searchBarcode: string): Promise<any | null> {
    
    
    // Get all items for manual searching
    const { data: allItems, error } = await supabase
      .from("warehouse_items")
      .select("*")

    if (error) {
      return null
    }

    if (!allItems || allItems.length === 0) {
      
      return null
    }

    

    const originalSearch = searchBarcode.trim().toUpperCase()
    const normalizedSearch = this.normalizeBarcode(searchBarcode)

    // Strategy 1: Exact match (case-insensitive)
    let match = allItems.find(item => {
      const itemBarcode = (item.barcode || '').trim().toUpperCase()
      return itemBarcode === originalSearch
    })

    if (match) {
      
      return match
    }

    // Strategy 2: Normalized exact match
    match = allItems.find(item => {
      const itemBarcode = this.normalizeBarcode(item.barcode || '')
      return itemBarcode === normalizedSearch
    })

    if (match) {
      
      return match
    }

    // Strategy 3: Partial match (contains)
    match = allItems.find(item => {
      const itemBarcode = (item.barcode || '').trim().toUpperCase()
      return itemBarcode.includes(originalSearch) || originalSearch.includes(itemBarcode)
    })

    if (match) {
      
      return match
    }

    // Strategy 4: Fuzzy match (allow 1-2 character differences)
    match = allItems.find(item => {
      const itemBarcode = (item.barcode || '').trim().toUpperCase()
      const distance = this.calculateLevenshteinDistance(itemBarcode, originalSearch)
      return distance <= 2 && Math.abs(itemBarcode.length - originalSearch.length) <= 2
    })

    if (match) {
      return match
    }

    // Strategy 5: Try without WH prefix if present (legacy support)
    if (originalSearch.startsWith('WH') && originalSearch.length > 2) {
      const withoutPrefix = originalSearch.substring(2)
      match = allItems.find(item => {
        const itemBarcode = (item.barcode || '').trim().toUpperCase()
        return itemBarcode.includes(withoutPrefix) || itemBarcode.endsWith(withoutPrefix)
      })

      if (match) {
        
        return match
      }
    }

    // Strategy 6: Try without DK prefix if present (new format support)
    if (originalSearch.startsWith('DK') && originalSearch.length > 2) {
      const withoutPrefix = originalSearch.substring(2)
      match = allItems.find(item => {
        const itemBarcode = (item.barcode || '').trim().toUpperCase()
        return itemBarcode.includes(withoutPrefix) || itemBarcode.endsWith(withoutPrefix)
      })

      if (match) {
        
        return match
      }
    }

    // Strategy 7: Try partial match for new DK format (YYMMDD part)
    if (originalSearch.length >= 6) {
      const datePattern = originalSearch.substring(originalSearch.startsWith('DK') ? 2 : 0, 6)
      if (/^\d{6}$/.test(datePattern)) {
        match = allItems.find(item => {
          const itemBarcode = (item.barcode || '').trim().toUpperCase()
          return itemBarcode.includes(datePattern)
        })

        if (match) {
          
          return match
        }
      }
    }

    
    return null
  }

  // Calculate Levenshtein distance for fuzzy matching
  private calculateLevenshteinDistance(str1: string, str2: string): number {
    const matrix = []
    const len1 = str1.length
    const len2 = str2.length

    for (let i = 0; i <= len2; i++) {
      matrix[i] = [i]
    }

    for (let j = 0; j <= len1; j++) {
      matrix[0][j] = j
    }

    for (let i = 1; i <= len2; i++) {
      for (let j = 1; j <= len1; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1]
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1, // substitution
            matrix[i][j - 1] + 1,     // insertion
            matrix[i - 1][j] + 1      // deletion
          )
        }
      }
    }

    return matrix[len2][len1]
  }

  async getItemsByOrderId(orderId: string): Promise<WarehouseItem[]> {
    const { data, error } = await supabase.from("warehouse_items").select("*").eq("order_id", orderId)

    if (error) {
      return []
    }

    return data || []
  }

  async addItem(item: Omit<WarehouseItem, "id" | "barcode"> & { barcode?: string }): Promise<WarehouseItem> {
    
    
    // Generate new TEXT ID using our new format
    const newId = this.generateBarcode(item.customerName)
    
    // Map TypeScript types to database fields
    const dbItem = {
      id: newId, // Use our generated ID instead of letting DB generate UUID
      order_id: item.orderId,
      material: item.material,
      cm: item.cm,
      mikron: item.mikron,
      current_weight: item.currentWeight,
      original_weight: item.originalWeight,
      coil_count: item.bobinCount,
      original_coil_count: item.bobinCount, // Set original coil count for new items
      status: item.status,
      stock_type: item.stockType || 'general', // Map stock_type to DB
      customer_name: item.customerName, // Map customer_name to DB
      location: item.location || "Depo", // Provide default value
      supplier: item.supplier,
      notes: item.notes,
      barcode: item.barcode || newId, // Use same ID as barcode for consistency
      qr_code: null, // Set QR code field
      code_type: 'qr', // Set code type to QR
      tags: item.tags || null, // Handle tags field
    }

    

    const { data, error } = await supabase.from("warehouse_items").insert([dbItem]).select().single()

    if (error) {
      throw new Error(`Failed to add warehouse item: ${error.message}`)
    }

    

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
      return null
    }

    return data
  }

  async updateItemDetails(
    itemId: string,
    editData: {
      currentWeight: number
      bobinCount: number
      location: string
      status: string
      notes: string
    }
  ): Promise<WarehouseItem | null> {
    
    
    const item = await this.getItemById(itemId)
    if (!item) {
      console.error("[v0] Item not found:", itemId)
      return null
    }

    const oldWeight = item.currentWeight || 0
    const oldBobinCount = item.bobinCount || 0
    const weightDifference = editData.currentWeight - oldWeight
    const bobinDifference = editData.bobinCount - oldBobinCount

    try {
      // Update warehouse item with database field names
      const { data, error } = await supabase.from("warehouse_items").update({
        current_weight: editData.currentWeight,
        coil_count: editData.bobinCount,
        location: editData.location,
        status: editData.status,
        notes: editData.notes,
        updated_at: new Date().toISOString(),
      }).eq("id", itemId).select().single()

      if (error) {
        console.error("[v0] Error updating warehouse item:", error)
        throw new Error(`Failed to update warehouse item: ${error.message}`)
      }

      // Create stock movement if weight or bobin count changed
      if (weightDifference !== 0 || bobinDifference !== 0) {
        let movementNotes = "Ürün bilgileri güncellendi"
        
        if (weightDifference !== 0) {
          movementNotes += ` - Ağırlık: ${oldWeight}kg → ${editData.currentWeight}kg`
        }
        if (bobinDifference !== 0) {
          movementNotes += ` - Bobin: ${oldBobinCount} → ${editData.bobinCount}`
        }

        await this.addStockMovement({
          warehouse_item_id: itemId,
          type: weightDifference > 0 ? "Gelen" : "Çıkan",
          quantity: weightDifference,
          operator: "Sistem",
          notes: movementNotes,
        })
      }

      

      // Return updated item
      return this.getItemById(itemId)
    } catch (error) {
      console.error("[v0] Error in updateItemDetails:", error)
      throw error
    }
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
    
    let query = supabase.from("stock_movements").select("*")

    if (warehouseItemId) {
      query = query.eq("warehouse_item_id", warehouseItemId)
    }

    const { data, error } = await query.order("created_at", { ascending: false })

    if (error) {
      console.error("[v0] Error fetching stock movements:", error)
      return []
    }

    

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

    
    return mappedMovements
  }

  async addStockMovement(movement: {
    warehouse_item_id: string;
    type: string;
    quantity: number;
    operator: string;
    notes?: string;
  }): Promise<any> {
    
    const { data, error } = await supabase.from("stock_movements").insert([movement]).select().single()

    if (error) {
      console.error("[v0] Error adding stock movement:", error)
      throw new Error("Failed to add stock movement")
    }

    
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

  async processProductReturn(
    itemId: string,
    returnData: {
      returnWeight: number
      returnBobinCount: number
      operatorName?: string
      condition: string
      notes?: string
      generateReturnBarcode: boolean
      stockType: 'general' | 'customer'
      customerName?: string
    }
  ): Promise<WarehouseItem | null> {
    
    
    const item = await this.getItemById(itemId)
    if (!item) {
      console.error("[v0] Item not found:", itemId)
      return null
    }

    const currentWeight = item.currentWeight || 0
    const currentBobinCount = item.bobinCount || 0

    const newWeight = currentWeight + returnData.returnWeight
    const newBobinCount = currentBobinCount + returnData.returnBobinCount

    // Determine new status - if any stock returns, it should be "Stokta"
    const status: WarehouseItemStatus = "Stokta"

    // Create detailed notes for the return
    const conditionLabels: Record<string, string> = {
      "kullanilabilir": "Kullanılabilir",
      "hasarli": "Hasarlı", 
      "kontrol-gerekli": "Kontrol Gerekli"
    }

    const conditionLabel = conditionLabels[returnData.condition] || returnData.condition
    let movementNotes = `Ürün dönüş - Depo - ${returnData.returnWeight}kg, ${returnData.returnBobinCount} bobin (${conditionLabel})`
    
    if (returnData.notes) {
      movementNotes += ` - ${returnData.notes}`
    }

    try {
      // Add stock movement for the return
      await this.addStockMovement({
        warehouse_item_id: itemId,
        type: "Gelen", // Return to warehouse is incoming
        quantity: returnData.returnWeight,
        operator: returnData.operatorName || "",
        notes: movementNotes,
      })

      // Prepare notes based on stock type
      let itemNotes = `Dönen ürün (${conditionLabel})`
      if (returnData.stockType === 'customer' && returnData.customerName) {
        itemNotes = `${returnData.customerName} - ${itemNotes}`
      } else {
        itemNotes = `Genel stok - ${itemNotes}`
      }

      // Update warehouse item with new stock type information
      const { data, error } = await supabase.from("warehouse_items").update({
        current_weight: newWeight,
        coil_count: newBobinCount,
        status,
        stock_type: returnData.stockType, // Set the stock type
        customer_name: returnData.stockType === 'customer' ? returnData.customerName : null, // Set customer name if customer stock
        location: "Depo", // Always return to main warehouse
        notes: itemNotes,
        updated_at: new Date().toISOString(),
      }).eq("id", itemId).select().single()

      if (error) {
        console.error("[v0] Error updating warehouse item:", error)
        throw new Error(`Failed to update warehouse item: ${error.message}`)
      }

      

      // Return updated item
      return this.getItemById(itemId)
    } catch (error) {
      console.error("[v0] Error in processProductReturn:", error)
      throw error
    }
  }

  async processProductExit(
    itemId: string,
    exitData: {
      weightExit: number
      bobinExit: number
      exitLocation: string
      operatorName?: string
      reason?: string
      notes?: string
    }
  ): Promise<WarehouseItem | null> {
    
    
    const item = await this.getItemById(itemId)
    if (!item) {
      console.error("[v0] Item not found:", itemId)
      return null
    }

    // Calculate weight per coil for automatic weight calculation
    const currentWeight = item.currentWeight || 0
    const currentBobinCount = item.bobinCount || 0
    const weightPerCoil = currentBobinCount > 0 ? currentWeight / currentBobinCount : 0

    // Calculate total weight to be deducted
    let totalWeightExit = exitData.weightExit || 0
    
    // If only coils are specified (no weight), calculate weight based on coils
    if (exitData.bobinExit > 0 && exitData.weightExit === 0) {
      totalWeightExit = exitData.bobinExit * weightPerCoil
      
    }
    // If both weight and coils are specified, use the specified weight
    // If only weight is specified, use that weight

    const newWeight = Math.max(0, currentWeight - totalWeightExit)
    const newBobinCount = Math.max(0, currentBobinCount - exitData.bobinExit)

    // Determine new status
    const status: WarehouseItemStatus = newWeight === 0 && newBobinCount === 0 ? "Stok Yok" : "Stokta"

    // Create detailed notes
    const exitLocationLabels: Record<string, string> = {
      "matbaa-tamburlu": "Matbaa - Tamburlu",
      "matbaa-bilgili": "Matbaa - Bilgili",
      "kesim": "Kesim",
      "sevkiyat": "Sevkiyat"
    }

    const exitLocationLabel = exitLocationLabels[exitData.exitLocation] || exitData.exitLocation
    let movementNotes = `Çıkış: ${exitLocationLabel}`
    
    if (totalWeightExit > 0) {
      movementNotes += ` - ${totalWeightExit.toFixed(1)}kg`
    }
    if (exitData.bobinExit > 0) {
      movementNotes += ` - ${exitData.bobinExit} bobin`
    }
    if (exitData.reason) {
      const reasonLabels: Record<string, string> = {
        "satis": "Satış",
        "transfer": "Transfer", 
        "hasarli": "Hasarlı",
        "uretim": "Üretim",
        "diger": "Diğer"
      }
      movementNotes += ` (${reasonLabels[exitData.reason] || exitData.reason})`
    }
    if (exitData.notes) {
      movementNotes += ` - ${exitData.notes}`
    }

    try {
      // Add stock movement with detailed information
      await this.addStockMovement({
        warehouse_item_id: itemId,
        type: "Çıkan",
        quantity: -totalWeightExit, // Use calculated total weight (negative for outgoing)
        operator: exitData.operatorName || "",
        notes: movementNotes,
      })

      // Update warehouse item
      const { data, error } = await supabase.from("warehouse_items").update({
        current_weight: newWeight,
        coil_count: newBobinCount,
        status,
        updated_at: new Date().toISOString(),
      }).eq("id", itemId).select().single()

      if (error) {
        console.error("[v0] Error updating warehouse item:", error)
        throw new Error(`Failed to update warehouse item: ${error.message}`)
      }

      // Log activity
      ActivityLogger.warehouseStockOut(itemId, {
        weight_exit: totalWeightExit,
        bobin_exit: exitData.bobinExit,
        exit_location: exitData.exitLocation,
        reason: exitData.reason
      })
      

      // Return updated item
      return this.getItemById(itemId)
    } catch (error) {
      console.error("[v0] Error in processProductExit:", error)
      throw error
    }
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

  async getAvailableStockBySpecs(cm: number, mikron: number, material: string): Promise<WarehouseItem[]> {
    
    
    const { data, error } = await supabase
      .from("warehouse_items")
      .select("*")
      .eq("cm", cm)
      .eq("mikron", mikron)
      .eq("material", material)
      .eq("status", "Stokta")
      .gt("current_weight", 0)
      .order("created_at", { ascending: true }) // FIFO mantığı - eski stok önce kullanılır

    if (error) {
      console.error("[v0] Error fetching available stock by specs:", error)
      return []
    }

    

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
      originalBobinCount: item.original_coil_count || item.coil_count, // Use original_coil_count from DB
      status: item.status,
      stockType: item.stock_type || 'general', // Map stock_type from DB
      customerName: item.customer_name, // Map customer_name from DB
      location: item.location,
      receivedDate: item.created_at,
      lastMovementDate: item.updated_at,
      supplier: item.supplier,
      notes: item.notes,
      tags: item.tags
    }))

    
    return mappedItems
  }

  async getWarehouseSummary(): Promise<WarehouseSummary> {
    

    const items = await this.getItems()
    

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

  private generateBarcode(customerName?: string): string {
    // Use new QR generator format for better ID generation
    return QRGenerator.generateWarehouseId(customerName)
  }

  // Legacy barcode generation for backward compatibility
  private generateLegacyBarcode(): string {
    const timestamp = Date.now().toString()
    const random = Math.random().toString(36).substring(2, 8).toUpperCase()
    return `WH${timestamp.slice(-6)}${random}`
  }
}

export const warehouseRepo = new WarehouseRepository()
