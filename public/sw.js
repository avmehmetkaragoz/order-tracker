const CACHE_NAME = "siparis-takip-v1"
const STATIC_CACHE = "siparis-takip-static-v1"

// Files to cache for offline functionality
const STATIC_FILES = [
  "/",
  "/orders",
  "/orders/new",
  "/settings",
  "/manifest.json",
  // Add other static assets as needed
]

// Install event - cache static files
self.addEventListener("install", (event) => {
  console.log("[SW] Installing service worker")

  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => {
        console.log("[SW] Caching static files")
        return cache.addAll(STATIC_FILES)
      })
      .then(() => {
        console.log("[SW] Static files cached successfully")
        return self.skipWaiting()
      })
      .catch((error) => {
        console.error("[SW] Failed to cache static files:", error)
      }),
  )
})

// Activate event - clean up old caches
self.addEventListener("activate", (event) => {
  console.log("[SW] Activating service worker")

  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE && cacheName !== CACHE_NAME) {
              console.log("[SW] Deleting old cache:", cacheName)
              return caches.delete(cacheName)
            }
          }),
        )
      })
      .then(() => {
        console.log("[SW] Service worker activated")
        return self.clients.claim()
      }),
  )
})

// Fetch event - serve from cache when offline
self.addEventListener("fetch", (event) => {
  const { request } = event

  // Skip non-GET requests
  if (request.method !== "GET") {
    return
  }

  // Skip external requests
  if (!request.url.startsWith(self.location.origin)) {
    return
  }

  event.respondWith(
    // Network first strategy for authenticated routes
    fetch(request, { redirect: 'follow' })
      .then((response) => {
        // Don't cache redirects or non-successful responses
        if (!response || response.status !== 200 || response.type !== "basic" || response.redirected) {
          return response
        }

        // Clone the response for caching
        const responseToCache = response.clone()

        caches.open(CACHE_NAME).then((cache) => {
          console.log("[SW] Caching new resource:", request.url)
          cache.put(request, responseToCache)
        })

        return response
      })
      .catch((error) => {
        console.log("[SW] Network request failed, trying cache:", error)
        
        // Try to serve from cache
        return caches.match(request).then((cachedResponse) => {
          if (cachedResponse) {
            console.log("[SW] Serving from cache:", request.url)
            return cachedResponse
          }

          // For navigation requests, return a basic offline page
          if (request.destination === "document") {
            return caches.match("/")
          }

          // For other requests, just fail
          throw error
        })
      })
  )
})

// Background sync for offline actions (future enhancement)
self.addEventListener("sync", (event) => {
  console.log("[SW] Background sync triggered:", event.tag)

  if (event.tag === "order-sync") {
    event.waitUntil(
      // Here you could sync offline changes when connection is restored
      console.log("[SW] Syncing offline orders..."),
    )
  }
})

// Push notifications (future enhancement)
self.addEventListener("push", (event) => {
  console.log("[SW] Push notification received")

  const options = {
    body: event.data ? event.data.text() : "Yeni bildirim",
    icon: "/icon-192x192.png",
    badge: "/icon-192x192.png",
    vibrate: [200, 100, 200],
    data: {
      url: "/",
    },
  }

  event.waitUntil(self.registration.showNotification("Sipariş Takip", options))
})

// Handle notification clicks
self.addEventListener("notificationclick", (event) => {
  console.log("[SW] Notification clicked")

  event.notification.close()

  event.waitUntil(clients.openWindow(event.notification.data.url || "/"))
})
