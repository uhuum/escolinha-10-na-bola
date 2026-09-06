"use client"

import { useCallback, useEffect, useState } from "react"

export type PushState = "loading" | "unsupported" | "needs-install" | "blocked" | "disabled" | "enabled" | "error"

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/")
  const rawData = window.atob(base64)
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)))
}

function isIos() {
  return /iphone|ipad|ipod/i.test(window.navigator.userAgent)
}

function isStandalone() {
  const navigatorStandalone = (window.navigator as Navigator & { standalone?: boolean }).standalone
  return window.matchMedia("(display-mode: standalone)").matches || navigatorStandalone === true
}

async function syncSubscription(subscription: PushSubscription) {
  const json = subscription.toJSON()
  const response = await fetch("/api/push/subscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({
      action: "subscribe",
      endpoint: subscription.endpoint,
      keys: json.keys,
    }),
  })
  if (!response.ok) throw new Error("Falha ao registrar este aparelho")
}

export function usePushNotifications() {
  const [state, setState] = useState<PushState>("loading")
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [endpoint, setEndpoint] = useState<string | null>(null)
  const [testing, setTesting] = useState(false)

  const inspect = useCallback(async () => {
    if (typeof window === "undefined") return
    if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) {
      setState("unsupported")
      return
    }

    if (isIos() && !isStandalone()) {
      setState("needs-install")
      return
    }

    if (Notification.permission === "denied") {
      setState("blocked")
      return
    }

    try {
      const registration = await navigator.serviceWorker.register("/sw.js", { scope: "/" })
      const subscription = await registration.pushManager.getSubscription()
      if (subscription) {
        await syncSubscription(subscription)
        setEndpoint(subscription.endpoint)
        setState("enabled")
      } else {
        setEndpoint(null)
        setState("disabled")
      }
    } catch (error) {
      console.error("[SIGA] Erro ao verificar Web Push:", error)
      setErrorMessage("Não foi possível verificar as notificações deste aparelho.")
      setState("error")
    }
  }, [])

  useEffect(() => {
    void inspect()
  }, [inspect])

  const enable = useCallback(async () => {
    setErrorMessage(null)
    if (isIos() && !isStandalone()) {
      setState("needs-install")
      return false
    }

    const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
    if (!publicKey) {
      setErrorMessage("As notificações push ainda não foram configuradas no servidor.")
      setState("error")
      return false
    }

    try {
      const permission = await Notification.requestPermission()
      if (permission !== "granted") {
        setState(permission === "denied" ? "blocked" : "disabled")
        return false
      }

      const registration = await navigator.serviceWorker.register("/sw.js", { scope: "/" })
      await navigator.serviceWorker.ready
      let subscription = await registration.pushManager.getSubscription()
      if (!subscription) {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicKey),
        })
      }
      await syncSubscription(subscription)
      setEndpoint(subscription.endpoint)
      setState("enabled")
      return true
    } catch (error) {
      console.error("[SIGA] Erro ao ativar Web Push:", error)
      setErrorMessage("Não foi possível ativar as notificações neste aparelho.")
      setState("error")
      return false
    }
  }, [])

  const disable = useCallback(async () => {
    try {
      const registration = await navigator.serviceWorker.getRegistration("/")
      const subscription = await registration?.pushManager.getSubscription()
      if (subscription) {
        await fetch("/api/push/subscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ action: "unsubscribe", endpoint: subscription.endpoint }),
        })
        await subscription.unsubscribe()
      }
      setEndpoint(null)
      setState("disabled")
    } catch (error) {
      console.error("[SIGA] Erro ao desativar Web Push:", error)
      setErrorMessage("Não foi possível desativar as notificações.")
      setState("error")
    }
  }, [])

  const test = useCallback(async () => {
    if (!endpoint) return false
    setTesting(true)
    setErrorMessage(null)
    try {
      const response = await fetch("/api/push/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ endpoint }),
      })
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}))
        throw new Error(payload?.error || "Falha no teste de push")
      }
      return true
    } catch (error) {
      console.error("[SIGA] Erro ao testar Web Push:", error)
      setErrorMessage(error instanceof Error ? error.message : "Não foi possível enviar o teste.")
      return false
    } finally {
      setTesting(false)
    }
  }, [endpoint])

  return { state, errorMessage, enable, disable, test, testing, refresh: inspect }
}
