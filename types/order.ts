export type OrderStatus = "Requested" | "Ordered" | "Delivered" | "Cancelled" | "Return"

export type Order = {
  id: string
  requester: string
  supplier: string
  customer?: string
  material?: string
  cm?: number
  mikron?: number
  bobin_sayisi?: number
  description?: string
  quantity?: number
  unit?: string
  created_at: string
  ordered_date?: string
  eta_date?: string
  delivered_date?: string
  status: OrderStatus
  notes?: string
  tags?: string[]
  custom_price?: boolean
  price_per_unit?: number
  total_price?: number
  currency?: string
  spec?: string
  warehouse_item_id?: string
  is_in_warehouse?: boolean
  // Gerçek gelen miktarlar (depoya alınırken girilen)
  actual_quantity?: number
  actual_bobin_sayisi?: number
  actual_total_price?: number // Gerçek miktara göre hesaplanan fiyat
}

export type OrderFilters = {
  search?: string
  searchField?: string
  statuses?: OrderStatus[]
  suppliers?: string[]
  requesters?: string[]
  dateRange?: {
    start: string
    end: string
  }
  hideDelivered?: boolean
}

export type GroupBy = "supplier" | "requester" | "none"
export type SortBy = "newest" | "eta" | "supplier" | "requester"

export type SupplierPrice = {
  id: string
  supplier: string
  material: string
  price_per_unit: number
  currency: string
  effective_date: string
  valid_to?: string
  is_active: boolean
  notes?: string
  created_at?: string
  updated_at?: string
}

export type OrderPricing = {
  pricePerKg?: number
  totalPrice?: number
  currency?: string
  priceDate?: string
  customPrice?: number
  customCurrency?: string
  isCustomPrice?: boolean
}
