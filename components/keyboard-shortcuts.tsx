"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export function KeyboardShortcuts() {
  const router = useRouter()

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Only handle shortcuts when not typing in an input
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement ||
        event.target instanceof HTMLSelectElement
      ) {
        return
      }

      switch (event.key.toLowerCase()) {
        case "n":
          event.preventDefault()
          router.push("/orders/new")
          break
        case "b":
          event.preventDefault()
          router.push("/barcode-scanner")
          break
        case "w":
          event.preventDefault()
          router.push("/warehouse")
          break
        case "/":
          event.preventDefault()
          // Focus search input if on orders page
          const searchInput = document.querySelector('input[placeholder*="ara"]') as HTMLInputElement
          if (searchInput) {
            searchInput.focus()
          } else {
            router.push("/orders")
          }
          break
        case "h":
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault()
            router.push("/")
          }
          break
        case "s":
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault()
            router.push("/settings")
          }
          break
        case "a":
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault()
            router.push("/analytics")
          }
          break
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [router])

  return null
}
