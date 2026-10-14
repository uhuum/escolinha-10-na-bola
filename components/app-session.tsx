"use client"

import type { ReactNode } from "react"
import { usePathname } from "next/navigation"
import { AuthProvider } from "@/lib/contexts/auth-context"

export function AppSession({ children }: { children: ReactNode }) {
  const pathname = usePathname()

  // Parents using an enrollment invitation do not need an administrative login.
  if (pathname === "/enroll" || pathname.startsWith("/enroll/")) {
    return <>{children}</>
  }

  return <AuthProvider>{children}</AuthProvider>
}
