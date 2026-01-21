"use client"

import { useEffect, useCallback } from "react"

type DataUpdateMessage = {
  type: "data-update"
  timestamp: number
}

const CHANNEL_NAME = "siga-data-sync"

export function useRealtimeSync(onDataUpdate: () => void) {
  const notifyOtherTabs = useCallback(() => {
    if (typeof window === "undefined") return

    try {
      const channel = new BroadcastChannel(CHANNEL_NAME)
      const message: DataUpdateMessage = {
        type: "data-update",
        timestamp: Date.now(),
      }
      channel.postMessage(message)
      channel.close()
    } catch (error) {
      console.log("[v0] BroadcastChannel not supported or error:", error)
    }
  }, [])

  useEffect(() => {
    if (typeof window === "undefined") return

    let channel: BroadcastChannel | null = null

    try {
      channel = new BroadcastChannel(CHANNEL_NAME)

      channel.onmessage = (event) => {
        const message = event.data as DataUpdateMessage
        if (message.type === "data-update") {
          console.log("[v0] Received data update notification from another tab")
          onDataUpdate()
        }
      }
    } catch (error) {
      console.log("[v0] BroadcastChannel not supported")
    }

    return () => {
      if (channel) {
        channel.close()
      }
    }
  }, [onDataUpdate])

  return { notifyOtherTabs }
}
