import type { WarehouseItem } from "@/types/warehouse"
import { warehouseRepo } from "./warehouse-repo"

export const testWarehouseItems: (Omit<WarehouseItem, "id" | "barcode"> & { barcode?: string })[] = [
  {
    barcode: "WH123456ABC123",
    orderId: "1",
    material: "OPP",
    cm: 70,
    mikron: 25,
    currentWeight: 1000,
    originalWeight: 1000,
    bobinCount: 2,
    status: "Stokta",
    location: "A-1-01",
    receivedDate: "2025-01-15T10:00:00Z",
    lastMovementDate: "2025-01-15T10:00:00Z",
    supplier: "Beş Yıldız",
    notes: "Test barkodu - Uğur siparişi için alınan stok",
  },
  {
    barcode: "WH789012DEF456",
    orderId: "2",
    material: "CPP",
    cm: 55,
    mikron: 27,
    currentWeight: 750,
    originalWeight: 800,
    bobinCount: 1,
    status: "Stokta",
    location: "A-1-02",
    receivedDate: "2025-01-14T14:30:00Z",
    lastMovementDate: "2025-01-16T09:15:00Z",
    supplier: "Ensar",
    notes: "Test barkodu - Kısmi kullanım sonrası kalan stok",
  },
  {
    barcode: "WH345678GHI789",
    material: "OPP",
    cm: 100,
    mikron: 30,
    currentWeight: 500,
    originalWeight: 500,
    bobinCount: 1,
    status: "Rezerve",
    location: "B-2-05",
    receivedDate: "2025-01-16T16:00:00Z",
    lastMovementDate: "2025-01-16T16:00:00Z",
    supplier: "Tugay Plastik",
    notes: "Test barkodu - Acil sipariş için rezerve edildi",
  },
  {
    barcode: "WH901234JKL012",
    material: "CPP",
    cm: 80,
    mikron: 35,
    currentWeight: 25,
    originalWeight: 300,
    bobinCount: 1,
    status: "Stokta",
    location: "C-1-03",
    receivedDate: "2025-01-10T11:20:00Z",
    lastMovementDate: "2025-01-17T13:45:00Z",
    supplier: "Beş Yıldız",
    notes: "Test barkodu - Düşük stok - yenilenmesi gerekiyor",
  },
]

export async function loadTestWarehouseData() {
  try {
    for (const item of testWarehouseItems) {
      await warehouseRepo.addItem(item)
    }
    console.log("Test warehouse data loaded successfully")
  } catch (error) {
    console.error("Error loading test warehouse data:", error)
  }
}
