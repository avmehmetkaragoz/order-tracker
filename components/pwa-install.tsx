"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Download, X } from "lucide-react"

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>
}

export function PWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showInstallPrompt, setShowInstallPrompt] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)
  const [isDismissed, setIsDismissed] = useState(false)

  useEffect(() => {
    // Check if app is already installed
    const checkInstalled = () => {
      if (window.matchMedia("(display-mode: standalone)").matches || (window.navigator as any).standalone) {
        setIsInstalled(true)
        return true
      }
      return false
    }

    // Check if user has previously dismissed the install prompt
    const checkDismissed = () => {
      const dismissed = localStorage.getItem('pwa-install-dismissed')
      const isDismissedValue = dismissed === 'true'
      setIsDismissed(isDismissedValue)
      return isDismissedValue
    }

    // Early exit if already installed or dismissed
    if (checkInstalled() || checkDismissed()) {
      return
    }

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      
      // Only show if not previously dismissed and not installed
      if (!isDismissed && !isInstalled) {
        setShowInstallPrompt(true)
      }
    }

    // Listen for app installed event
    const handleAppInstalled = () => {
      setIsInstalled(true)
      setShowInstallPrompt(false)
      setDeferredPrompt(null)
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt)
    window.addEventListener("appinstalled", handleAppInstalled)

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt)
      window.removeEventListener("appinstalled", handleAppInstalled)
    }
  }, [])

  const handleInstallClick = async () => {
    if (!deferredPrompt) return

    try {
      await deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice

      if (outcome === "accepted") {
        console.log("PWA install accepted")
      } else {
        console.log("PWA install dismissed")
      }

      setDeferredPrompt(null)
      setShowInstallPrompt(false)
    } catch (error) {
      console.error("Error during PWA install:", error)
    }
  }

  const handleDismiss = () => {
    // Save user's dismissal preference to localStorage
    localStorage.setItem('pwa-install-dismissed', 'true')
    setIsDismissed(true)
    setShowInstallPrompt(false)
  }

  // Don't show if already installed, dismissed, or no prompt available
  if (isInstalled || isDismissed || !showInstallPrompt || !deferredPrompt) {
    return null
  }

  return (
    <Card className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-md shadow-lg">
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="text-2xl">📱</div>
            <div>
              <div className="font-medium text-sm">Uygulamayı Yükle</div>
              <div className="text-xs text-muted-foreground">Hızlı erişim için ana ekrana ekle</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" onClick={handleInstallClick}>
              <Download className="h-4 w-4 mr-1" />
              Yükle
            </Button>
            <Button size="sm" variant="ghost" onClick={handleDismiss}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
