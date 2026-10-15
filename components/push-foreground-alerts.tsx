"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { useAuth } from "@/lib/contexts/auth-context"

type IncomingPush = {
  id?: string
  event_key?: string
  title: string
  body?: string
  href?: string
  sent_at?: string
}

function safePath(value: string | undefined) {
  try {
    const url = new URL(value || "/", window.location.origin)
    return url.origin === window.location.origin ? url.pathname + url.search : "/"
  } catch {
    return "/"
  }
}

export function PushForegroundAlerts() {
  const { user } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!user) return
    const seen = new Set<string>()
    let cursor = new Date().toISOString()
    let active = true
    let busy = false

    const announce = (notification: IncomingPush) => {
      if (document.visibilityState !== "visible") return
      if (!notification?.title || typeof notification.title !== "string") return
      const key = String(notification.id || notification.event_key || "")
      if (key && seen.has(key)) return
      if (key.startsWith("system-update-")) {
        // Deduplicate even across reloads, multiple tabs and repeated subscriptions.
        const storeKey = `siga:system-update:last:${user.id}`
        try {
          const stored = JSON.parse(window.localStorage.getItem(storeKey) || "null") as { id?: string; at?: number } | null
          if (stored?.id === key || (stored?.at && Date.now() - stored.at < 10 * 60 * 1000)) return
          window.localStorage.setItem(storeKey, JSON.stringify({ id: key, at: Date.now() }))
        } catch { /* localStorage may be unavailable */ }
      }
      if (key) seen.add(key)
      toast(notification.title, {
        id: key ? `push-${key}` : undefined,
        description: notification.body || "Abra o SIGA para conferir.",
        duration: 9000,
        action: { label: "Abrir", onClick: () => router.push(safePath(notification.href)) },
      })
    }

    const onPush = (event: MessageEvent) => {
      const value = event.data as { type?: string; notification?: IncomingPush } | null
      if (value?.type === "SIGA_PUSH_RECEIVED" && value.notification) announce(value.notification)
    }

    const refresh = async () => {
      if (!active || busy || document.visibilityState !== "visible") return
      busy = true
      try {
        const response = await fetch(`/api/push/recent?since=${encodeURIComponent(cursor)}`, {
          cache: "no-store", credentials: "include",
        })
        if (!response.ok) return
        const result = await response.json() as { notifications?: IncomingPush[] }
        const incoming = (result.notifications || []).slice().sort((a,b) => Date.parse(a.sent_at || "") - Date.parse(b.sent_at || ""))
        for (const item of incoming) {
          if (item.sent_at && item.sent_at > cursor) cursor = item.sent_at
          announce(item)
        }
      } catch {
        // Keep the local bell available when network connectivity is intermittent.
      } finally {
        busy = false
      }
    }

    if ("serviceWorker" in navigator) navigator.serviceWorker.addEventListener("message", onPush)
    const interval = window.setInterval(() => void refresh(), 20_000)
    const onResume = () => { void refresh() }
    document.addEventListener("visibilitychange", onResume)
    window.addEventListener("online", onResume)
    return () => {
      active = false
      window.clearInterval(interval)
      document.removeEventListener("visibilitychange", onResume)
      window.removeEventListener("online", onResume)
      if ("serviceWorker" in navigator) navigator.serviceWorker.removeEventListener("message", onPush)
    }
  }, [router, user?.id])

  return null
}
