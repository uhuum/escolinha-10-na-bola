"use client"

import type { ReactNode } from "react"
import { usePathname } from "next/navigation"
import { AuthProvider } from "@/lib/contexts/auth-context"
import { PWARegister } from "@/components/pwa-register"
import { PushForegroundAlerts } from "@/components/push-foreground-alerts"

export function AppSession({ children }: { children: ReactNode }) {
  const pathname = usePathname()

  // Parents using an enrollment invitation do not need an administrative login.
  if (pathname === "/enroll" || pathname.startsWith("/enroll/") || pathname === "/matricula-digital" || pathname.startsWith("/matricula-digital/")) {
    return <>{children}</>
  }

  return <AuthProvider><PWARegister /><PushForegroundAlerts />{children}</AuthProvider>
}
