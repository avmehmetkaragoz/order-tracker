export function registerServiceWorker() {
  if (typeof window !== "undefined" && "serviceWorker" in navigator) {
    window.addEventListener("load", async () => {
      try {
        const registration = await navigator.serviceWorker.register("/sw.js")
        console.log("SW registered: ", registration)

        // Listen for updates
        registration.addEventListener("updatefound", () => {
          const newWorker = registration.installing
          if (newWorker) {
            newWorker.addEventListener("statechange", () => {
              if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
                // New content is available, prompt user to refresh
                if (confirm("Yeni sürüm mevcut. Sayfayı yenilemek ister misiniz?")) {
                  window.location.reload()
                }
              }
            })
          }
        })
      } catch (error) {
        console.log("SW registration failed: ", error)
      }
    })
  }
}

export function unregisterServiceWorker() {
  if (typeof window !== "undefined" && "serviceWorker" in navigator) {
    navigator.serviceWorker.ready
      .then((registration) => {
        registration.unregister()
      })
      .catch((error) => {
        console.error(error.message)
      })
  }
}

export function checkPWADisplayMode() {
  if (typeof window === "undefined") return "browser"

  const isStandalone = window.matchMedia("(display-mode: standalone)").matches
  const isIOS = (window.navigator as any).standalone
  const isInWebAppiOS = window.navigator.userAgent.includes("Safari") && isIOS

  if (isStandalone || isInWebAppiOS) {
    return "standalone"
  }

  return "browser"
}

export function isOfflineCapable() {
  return typeof window !== "undefined" && "serviceWorker" in navigator && "localStorage" in window
}
