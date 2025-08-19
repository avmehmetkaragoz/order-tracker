import type { Order } from "@/types/order"

export function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString("tr-TR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })
}

export function isOverdue(order: Order): boolean {
  if (!order.etaDate || order.status === "Delivered" || order.status === "Cancelled") {
    return false
  }

  const today = new Date()
  const eta = new Date(order.etaDate)
  return eta < today
}

export function formatRelativeDate(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))

  if (diffInDays === 0) return "Bugün"
  if (diffInDays === 1) return "Dün"
  if (diffInDays < 7) return `${diffInDays} gün önce`
  if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} hafta önce`
  if (diffInDays < 365) return `${Math.floor(diffInDays / 30)} ay önce`
  return `${Math.floor(diffInDays / 365)} yıl önce`
}
