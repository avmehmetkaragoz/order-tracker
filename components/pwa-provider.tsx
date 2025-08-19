"use client"

import type React from "react"

import { useEffect } from "react"
import { registerServiceWorker } from "@/lib/pwa-utils"

interface PWAProviderProps {
  children: React.ReactNode
}

export function PWAProvider({ children }: PWAProviderProps) {
  useEffect(() => {
    // Register service worker
    registerServiceWorker()

    // Add PWA-specific event listeners
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        // App became visible, could sync data here
        console.log("App became visible")
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange)

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange)
    }
  }, [])

  return <>{children}</>
}
