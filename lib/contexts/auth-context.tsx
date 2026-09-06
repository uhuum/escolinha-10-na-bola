"use client"

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react"
import { usePathname, useRouter } from "next/navigation"
import { SplashRole } from "@/components/splash-role"
import { LogoutSplash } from "@/components/logout-splash"
import { getBrowserClient } from "@/lib/supabase/client"
import { canRoleAccessPath, homeForRole } from "@/lib/auth/route-policy"

type UserRole = "admin" | "coach"

interface User {
  id: string
  authId?: string
  username: string
  role: UserRole
  name: string
}

interface AuthContextType {
  user: User | null
  login: (username: string, password: string) => Promise<boolean>
  logout: () => void
  isAuthenticated: boolean
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

function mapSupabaseUser(authUser: any): User | null {
  if (!authUser) return null

  const username = String(authUser.user_metadata?.username || authUser.app_metadata?.username || "")
  const role = authUser.app_metadata?.role as UserRole | undefined
  if (!username || (role !== "admin" && role !== "coach")) return null

  return {
    id: String(authUser.user_metadata?.legacy_user_id || authUser.app_metadata?.legacy_user_id || authUser.id),
    authId: authUser.id,
    username,
    role,
    name: String(authUser.user_metadata?.name || username),
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showSplashRole, setShowSplashRole] = useState(false)
  const [pendingUser, setPendingUser] = useState<User | null>(null)
  const [showLogoutSplash, setShowLogoutSplash] = useState(false)
  const [logoutUserName, setLogoutUserName] = useState("")
  const router = useRouter()
  const pathname = usePathname()
  const supabase = useMemo(() => getBrowserClient(), [])

  // Supabase Auth is now the only source of truth for the session.
  useEffect(() => {
    let active = true

    const loadAuthenticatedUser = async () => {
      try {
        const { data, error } = await supabase.auth.getUser()
        if (!active) return
        setUser(error ? null : mapSupabaseUser(data.user))
      } catch (error) {
        console.error("[SIGA] Erro ao validar sessão:", error)
        if (active) setUser(null)
      } finally {
        if (active) setIsLoading(false)
      }
    }

    loadAuthenticatedUser()

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) return
      setUser(mapSupabaseUser(session?.user))
      setIsLoading(false)
    })

    return () => {
      active = false
      listener.subscription.unsubscribe()
    }
  }, [supabase])

  useEffect(() => {
    if (isLoading) return

    if (!user) {
      if (pathname !== "/login") router.replace("/login")
      return
    }

    if (pathname === "/login") {
      router.replace(homeForRole(user.role))
      return
    }

    if (!canRoleAccessPath(user.role, pathname)) {
      router.replace(homeForRole(user.role))
    }
  }, [user, pathname, router, isLoading])

  // Browser Back/Forward can restore a page from memory (bfcache) without a
  // normal server navigation. Revalidate the real Supabase session whenever
  // a page is restored so an old Admin DOM can never remain visible after a
  // Coach login (and vice-versa).
  useEffect(() => {
    const validateRestoredPage = async () => {
      try {
        const { data, error } = await supabase.auth.getUser()
        const freshUser = error ? null : mapSupabaseUser(data.user)
        setUser(freshUser)

        if (!freshUser) {
          if (window.location.pathname !== "/login") window.location.replace("/login")
          return
        }

        const currentPath = window.location.pathname
        if (currentPath === "/login" || !canRoleAccessPath(freshUser.role, currentPath)) {
          window.location.replace(homeForRole(freshUser.role))
        }
      } catch (error) {
        console.error("[SIGA] Erro ao revalidar rota restaurada:", error)
        window.location.replace("/login")
      }
    }

    const onPageShow = (event: PageTransitionEvent) => {
      if (event.persisted) void validateRestoredPage()
    }

    window.addEventListener("pageshow", onPageShow)
    return () => window.removeEventListener("pageshow", onPageShow)
  }, [supabase])

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({ username, password }),
      })

      if (!response.ok) return false

      const userData = (await response.json()) as User
      setUser(userData)
      setPendingUser(userData)
      setShowSplashRole(true)

      const destination = homeForRole(userData.role)
      router.replace(destination)
      return true
    } catch (error) {
      console.error("[SIGA] Erro no login:", error)
      return false
    }
  }

  const handleSplashComplete = () => {
    setPendingUser(null)
    setShowSplashRole(false)
  }

  const performLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST", cache: "no-store" })
      await supabase.auth.signOut({ scope: "local" })
    } catch (error) {
      console.error("[SIGA] Erro ao encerrar sessão:", error)
    } finally {
      setUser(null)
      setShowLogoutSplash(false)
      router.replace("/login")
    }
  }

  const logout = () => {
    if (user) {
      setLogoutUserName(user.name || user.username)
      setShowLogoutSplash(true)
    } else {
      void performLogout()
    }
  }

  const routeIsAllowed = user
    ? pathname === "/login" || canRoleAccessPath(user.role, pathname)
    : pathname === "/login"

  if (isLoading || !routeIsAllowed) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Validando acesso...</p>
        </div>
      </div>
    )
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user, isLoading }}>
      {showSplashRole && pendingUser && (
        <SplashRole role={pendingUser.role} userName={pendingUser.name} duration={900} onComplete={handleSplashComplete} />
      )}
      {showLogoutSplash && (
        <LogoutSplash
          isOpen={showLogoutSplash}
          userName={logoutUserName}
          onComplete={() => void performLogout()}
        />
      )}
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) throw new Error("useAuth must be used within an AuthProvider")
  return context
}
