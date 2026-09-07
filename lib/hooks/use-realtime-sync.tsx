"use client"

import { useEffect, useCallback, useRef } from "react"
import { getBrowserClient } from "@/lib/supabase/client"

type DataUpdateMessage = {
  type: "data-update"
  timestamp: number
  source?: string
}

type RealtimeSyncOptions = {
  /** Public tables whose database changes should refresh this screen. */
  tables?: string[]
  /** Small debounce prevents a batch write from causing many identical reloads. */
  debounceMs?: number
  /** Refresh when a sleeping/offline device becomes active again. */
  resyncOnResume?: boolean
}

const CHANNEL_NAME = "siga-data-sync"

export function useRealtimeSync(
  onDataUpdate: () => void | Promise<void>,
  options: RealtimeSyncOptions = {},
) {
  const { tables = [], debounceMs = 350, resyncOnResume = true } = options
  const callbackRef = useRef(onDataUpdate)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastResumeSyncRef = useRef(0)
  const tablesKey = tables.join(",")

  useEffect(() => {
    callbackRef.current = onDataUpdate
  }, [onDataUpdate])

  const scheduleSync = useCallback((delay = debounceMs) => {
    if (typeof window === "undefined") return
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      timerRef.current = null
      void callbackRef.current()
    }, delay)
  }, [debounceMs])

  const notifyOtherTabs = useCallback(() => {
    if (typeof window === "undefined") return

    try {
      const channel = new BroadcastChannel(CHANNEL_NAME)
      const message: DataUpdateMessage = {
        type: "data-update",
        timestamp: Date.now(),
        source: "local-write",
      }
      channel.postMessage(message)
      channel.close()
    } catch (error) {
      console.info("[SIGA] BroadcastChannel indisponível:", error)
    }
  }, [])

  useEffect(() => {
    if (typeof window === "undefined") return

    let broadcast: BroadcastChannel | null = null
    const supabase = getBrowserClient()
    const realtimeChannels: ReturnType<typeof supabase.channel>[] = []

    try {
      broadcast = new BroadcastChannel(CHANNEL_NAME)
      broadcast.onmessage = (event) => {
        const message = event.data as DataUpdateMessage
        if (message?.type === "data-update") scheduleSync()
      }
    } catch {
      // Realtime below still synchronizes different devices even when this API
      // is unavailable in an older browser.
    }

    // One lightweight Realtime channel per table. The payload is only a signal;
    // each screen reloads only the dataset/range it already needs.
    for (const table of tables) {
      const channel = supabase
        .channel(`siga-sync-${table}-${Math.random().toString(36).slice(2)}`)
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table },
          () => scheduleSync(),
        )
        .subscribe((status) => {
          // When a websocket reconnects after sleep/network loss, reconcile with
          // the database because events may have happened while this device was offline.
          if (status === "SUBSCRIBED") scheduleSync(100)
        })

      realtimeChannels.push(channel)
    }

    const syncAfterResume = () => {
      if (!resyncOnResume || !navigator.onLine) return
      const now = Date.now()
      if (now - lastResumeSyncRef.current < 1200) return
      lastResumeSyncRef.current = now
      scheduleSync(100)
    }

    const handleVisibility = () => {
      if (document.visibilityState === "visible") syncAfterResume()
    }

    window.addEventListener("online", syncAfterResume)
    window.addEventListener("pageshow", syncAfterResume)
    document.addEventListener("visibilitychange", handleVisibility)

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
      broadcast?.close()
      window.removeEventListener("online", syncAfterResume)
      window.removeEventListener("pageshow", syncAfterResume)
      document.removeEventListener("visibilitychange", handleVisibility)
      for (const channel of realtimeChannels) void supabase.removeChannel(channel)
    }
  }, [tablesKey, scheduleSync, resyncOnResume])

  return { notifyOtherTabs, requestSync: scheduleSync }
}
