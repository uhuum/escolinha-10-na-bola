"use client"

import { useEffect } from "react"

export function PWARegister() {
  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((registration) => {
          console.log("[PWA] Service Worker registrado com sucesso:", registration.scope)
        })
        .catch((error) => {
          console.log("[PWA] Falha ao registrar Service Worker:", error)
        })
    }
  }, [])

  return null
}
