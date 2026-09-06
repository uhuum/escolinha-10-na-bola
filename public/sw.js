const SW_VERSION = "siga-push-v1"

self.addEventListener("install", () => {
  self.skipWaiting()
})

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const cacheNames = await caches.keys()
      await Promise.all(cacheNames.map((name) => caches.delete(name)))
      await self.clients.claim()
    })(),
  )
})

self.addEventListener("push", (event) => {
  event.waitUntil(
    (async () => {
      try {
        const subscription = await self.registration.pushManager.getSubscription()
        if (!subscription) return

        const response = await fetch("/api/push/pending", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ endpoint: subscription.endpoint }),
        })

        if (!response.ok) return
        const payload = await response.json()
        const notification = payload?.notification
        if (!notification?.title) return

        await self.registration.showNotification(notification.title, {
          body: notification.body || "",
          icon: "/icon-192x192.png",
          badge: "/icon-96x96.png",
          tag: notification.id || SW_VERSION,
          renotify: true,
          vibrate: [250, 120, 250],
          data: {
            href: notification.href || "/",
          },
        })
      } catch (error) {
        console.error("[SIGA] Falha ao exibir push:", error)
      }
    })(),
  )
})

self.addEventListener("notificationclick", (event) => {
  event.notification.close()
  event.waitUntil(
    (async () => {
      const href = event.notification?.data?.href || "/"
      const destination = new URL(href, self.location.origin).href
      const windows = await self.clients.matchAll({ type: "window", includeUncontrolled: true })

      for (const client of windows) {
        if ("navigate" in client) await client.navigate(destination)
        if ("focus" in client) return client.focus()
      }

      if (self.clients.openWindow) return self.clients.openWindow(destination)
    })(),
  )
})
