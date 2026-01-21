"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { useRouter, usePathname } from "next/navigation"
import { SplashRole } from "@/components/splash-role"
import { LogoutSplash } from "@/components/logout-splash"

type UserRole = "admin" | "coach"

interface User {
  id: string
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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showSplashRole, setShowSplashRole] = useState(false)
  const [pendingUser, setPendingUser] = useState<User | null>(null)
  const [showLogoutSplash, setShowLogoutSplash] = useState(false)
  const [logoutUserName, setLogoutUserName] = useState("")
  const router = useRouter()
  const pathname = usePathname()

  // Load user from localStorage on mount
  useEffect(() => {
    const storedUser = localStorage.getItem("user")
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser))
      } catch (error) {
        console.error("[v0] Error parsing stored user:", error)
        localStorage.removeItem("user")
      }
    }
    setIsLoading(false)
  }, [])

  // Redirect logic
  useEffect(() => {
    if (isLoading) return

    const isLoginPage = pathname === "/login"

    if (!user && !isLoginPage) {
      router.push("/login")
      return
    }

    if (user && isLoginPage) {
      if (user.role === "coach") {
        router.push("/trainer/dashboard")
      } else {
        router.push("/")
      }
      return
    }

    if (user?.role === "coach") {
      const allowedPaths = [
        "/trainer/dashboard",
        "/trainer/carometro",
        "/trainer/chamada",
        "/trainer/relatorio",
        "/trainer/birthdays",
        "/students",
        "/carometro",
        "/chamada",
      ]
      const isAllowed = allowedPaths.some((path) => pathname === path || pathname.startsWith("/students/"))

      if (!isAllowed) {
        router.push("/trainer/dashboard")
      }
    }
  }, [user, pathname, router, isLoading])

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      })

      if (!response.ok) {
        console.error("[v0] Login failed:", response.status)
        return false
      }

      const data = await response.json()
      const userData: User = {
        id: data.id,
        username: data.username,
        role: data.role,
        name: data.name,
      }

      setPendingUser(userData)
      setShowSplashRole(true)
      return true
    } catch (error) {
      console.error("[v0] Login error:", error)
      return false
    }
  }

  const handleSplashComplete = () => {
    if (pendingUser) {
      setUser(pendingUser)
      localStorage.setItem("user", JSON.stringify(pendingUser))
      setPendingUser(null)
    }
    setShowSplashRole(false)
  }

  const logout = () => {
    if (user) {
      setLogoutUserName(user.name || user.username)
      setShowLogoutSplash(true)
    } else {
      performLogout()
    }
  }

  const performLogout = () => {
    setUser(null)
    localStorage.removeItem("user")
    setShowLogoutSplash(false)
    router.push("/login")
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    )
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user, isLoading }}>
      {showSplashRole && pendingUser && (
        <SplashRole
          role={pendingUser.role}
          userName={pendingUser.name}
          duration={1500}
          onComplete={handleSplashComplete}
        />
      )}
      {showLogoutSplash && (
        <LogoutSplash isOpen={showLogoutSplash} userName={logoutUserName} onComplete={performLogout} />
      )}
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
