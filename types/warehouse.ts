export type WarehouseItemStatus = "Stokta" | "Rezerve" | "Stok Yok" | "Hasarlı"

export type StockMovementType = "Gelen" | "Çıkan" | "İade" | "Düzeltme" | "Hasarlı"

export type StockType = "general" | "customer"

export type WarehouseItem = {
  id: string
  barcode: string
  orderId?: string // Link to original order
  material: string
  cm: number
  mikron: number
  currentWeight: number // Current weight in kg
  originalWeight: number // Original weight when received
  bobinCount: number // Current coil count
  originalBobinCount?: number // Original coil count when received
  status: WarehouseItemStatus
  stockType: StockType // Whether this is general or customer-specific stock
  customerName?: string // Customer name if this is customer stock
  location?: string // Warehouse location/shelf
  receivedDate: string
  lastMovementDate: string
  supplier: string
  notes?: string
  tags?: string[]
}

export type StockMovement = {
  id: string
  warehouseItemId: string
  barcode: string
  type: StockMovementType
  weightBefore: number
  weightAfter: number
  bobinCountBefore: number
  bobinCountAfter: number
  movementDate: string
  destination?: string // Where it went (e.g., "Matbaa", "Customer")
  operator: string // Who performed the movement
  notes?: string
  orderId?: string // Related order if applicable
}

export type BarcodeData = {
  barcode: string
  warehouseItemId: string
  material: string
  specifications: string // e.g., "70cm • 25μ • OPP"
  weight: number
  bobinCount: number
  generatedDate: string
}

export type WarehouseFilters = {
  search?: string
  materials?: string[]
  suppliers?: string[]
  statuses?: WarehouseItemStatus[]
  weightRange?: {
    min: number
    max: number
  }
  dateRange?: {
    start: string
    end: string
  }
}

export type WarehouseSummary = {
  totalItems: number
  totalWeight: number
  itemsByStatus: Record<WarehouseItemStatus, number>
  itemsByMaterial: Record<string, number>
  lowStockItems: WarehouseItem[]
}
