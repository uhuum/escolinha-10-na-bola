const SW_VERSION = "siga-push-v4"

self.addEventListener("install", () => {
  self.skipWaiting()
})

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const cacheNames = await caches.keys()
    await Promise.all(cacheNames.map(name => caches.delete(name)))
    await self.clients.claim()
  })())
})

function safeDestination(href) {
  try {
    const target = new URL(href || "/", self.location.origin)
    if (target.origin === self.location.origin) return target.href
  } catch { /* Invalid link */ }
  return self.location.origin + "/"
}

async function showPush(notification) {
  const options = {
    body: notification.body || "Abra o SIGA para conferir as atualizações.",
    icon: "/icon-192x192.png",
    badge: "/icon-96x96.png",
    tag: notification.id?.startsWith("system-update-") ? "siga-system-update" : (notification.id || undefined),
    renotify: false,
    data: { href: safeDestination(notification.href) },
  }
  try {
    await self.registration.showNotification(notification.title || "SIGA — Novo aviso", options)
  } catch (error) {
    // iOS and some Android browsers may reject extra notification options.
    console.warn("[SIGA] Notificação simplificada:", error)
    await self.registration.showNotification(notification.title || "SIGA — Novo aviso", {
      body: options.body, data: options.data,
    })
  }
}

async function fetchLegacyPending() {
  const subscription = await self.registration.pushManager.getSubscription()
  if (!subscription) return null
  const response = await fetch("/api/push/pending", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    cache: "no-store",
    body: JSON.stringify({ endpoint: subscription.endpoint }),
  })
  if (!response.ok) return null
  const result = await response.json()
  return result?.notification?.title ? result.notification : null
}

self.addEventListener("push", event => {
  event.waitUntil((async () => {
    let notification = null

    // New: encrypted Web Push payload can be shown while the app is closed,
    // even if the Supabase session has expired or awaits MFA.
    if (event.data) {
      try {
        const message = event.data.json()
        if (message && typeof message.title === "string" && message.title.length > 0) {
          notification = message
        }
      } catch (error) {
        console.warn("[SIGA] Conteúdo push inválido:", error)
      }
    }

    // Temporary backward compatibility for already-in-flight empty pushes.
    if (!notification) {
      try {
        notification = await fetchLegacyPending()
      } catch (error) {
        console.warn("[SIGA] Consulta legada indisponível:", error)
      }
    }

    // Never silently drop a received push only because its session expired.
    if (!notification) {
      notification = {
        title: "SIGA — Você tem um novo aviso",
        body: "Abra o aplicativo para conferir. Pode ser necessário entrar novamente.",
        href: "/",
      }
    }
    // One visible alert per event: show inside an open SIGA window, otherwise
    // leave it to the operating system (including lock-screen notifications).
    const windows = await self.clients.matchAll({ type: "window", includeUncontrolled: true })
    const foreground = windows.find(client => {
      try {
        const path = new URL(client.url).pathname
        return client.visibilityState === "visible" &&
          !path.startsWith("/login") && !path.startsWith("/enroll") &&
          !path.startsWith("/matricula-digital")
      } catch { return false }
    })
    if (foreground) {
      foreground.postMessage({ type: "SIGA_PUSH_RECEIVED", notification })
    } else {
      await showPush(notification)
    }
  })())
})

self.addEventListener("notificationclick", event => {
  event.notification.close()
  event.waitUntil((async () => {
    const destination = safeDestination(event.notification?.data?.href)
    const windows = await self.clients.matchAll({ type: "window", includeUncontrolled: true })
    for (const client of windows) {
      if (!client.url.startsWith(self.location.origin)) continue
      if ("navigate" in client) await client.navigate(destination)
      if ("focus" in client) return client.focus()
    }
    if (self.clients.openWindow) return self.clients.openWindow(destination)
  })())
})
