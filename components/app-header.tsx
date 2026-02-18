"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  LayoutDashboard,
  Users,
  DollarSign,
  Camera,
  LogOut,
  ClipboardCheck,
  CalendarCheck,
  BookOpen,
  Menu,
  Cake,
  FileText,
} from "lucide-react"
import { cn } from "@/lib/utils"
import Image from "next/image"
import { useAuth } from "@/lib/contexts/auth-context"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { useState } from "react"

export function AppHeader() {
  const pathname = usePathname()
  const { user, logout } = useAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const allNavItems = [
    { href: "/", label: "Dashboard", icon: LayoutDashboard, roles: ["admin"] },
    { href: "/students", label: "Alunos", icon: Users, roles: ["admin", "coach"] },
    { href: "/payments", label: "Pagamentos", icon: DollarSign, roles: ["admin"] },
    { href: "/presencas", label: "Presenças", icon: CalendarCheck, roles: ["admin"] },
    { href: "/birthdays", label: "Aniversariantes", icon: Cake, roles: ["admin"] },
    { href: "/carometro", label: "Carômetro", icon: Camera, roles: ["admin", "coach"] },
    { href: "/trainer/dashboard", label: "Painel", icon: LayoutDashboard, roles: ["coach"] },
    { href: "/trainer/carometro", label: "Carômetro", icon: BookOpen, roles: ["coach"] },
    { href: "/trainer/chamada", label: "Chamada", icon: ClipboardCheck, roles: ["coach"] },
    { href: "/trainer/relatorio", label: "Relatório", icon: FileText, roles: ["coach"] },
    { href: "/trainer/birthdays", label: "Aniversariantes", icon: Cake, roles: ["coach"] },
  ]

  const navItems = allNavItems.filter((item) => user && item.roles.includes(user.role))

  const isTrainerRoute = pathname.startsWith("/trainer")
  const displayNavItems = isTrainerRoute
    ? navItems.filter((item) => item.href.startsWith("/trainer"))
    : navItems.filter((item) => !item.href.startsWith("/trainer"))

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-[#0a1628] text-white shadow-lg">
      <div className="container mx-auto px-3 sm:px-4 lg:px-8">
        <div className="flex h-20 sm:h-24 items-center justify-between gap-2">
          <Link href="/" className="flex items-center gap-2 sm:gap-4 transition-opacity hover:opacity-80 flex-shrink-0">
            <div className="relative h-16 w-16 sm:h-20 sm:w-20 flex-shrink-0">
              <Image src="/logo-ceap.png" alt="Logo CEAP" fill className="object-contain" priority />
            </div>
            <div className="hidden min-[380px]:block">
              <h1 className="text-xl sm:text-3xl font-bold leading-none text-white">SIGA</h1>
              <p className="text-sm sm:text-base text-blue-200/80">Gestão de Alunos</p>
            </div>
          </Link>

          <div className="flex items-center gap-1 sm:gap-2">
            <nav className="hidden lg:flex items-center gap-1">
              {displayNavItems.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href
                return (
                  <Button
                    key={item.href}
                    asChild
                    variant={isActive ? "default" : "ghost"}
                    size="sm"
                    className={cn(
                      "gap-2 text-xs",
                      isActive
                        ? "bg-white text-[#0a1628] hover:bg-white/90 shadow-sm"
                        : "text-white/90 hover:text-white hover:bg-white/10",
                    )}
                  >
                    <Link href={item.href}>
                      <Icon className="h-3.5 w-3.5" />
                      <span className="hidden xl:inline">{item.label}</span>
                    </Link>
                  </Button>
                )
              })}
            </nav>

            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild className="lg:hidden">
                <Button variant="ghost" size="sm" className="h-9 w-9 px-0 text-white hover:bg-white/10">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[280px] sm:w-[320px] bg-[#0a1628] text-white border-white/10">
                <SheetHeader className="mb-6">
                  <SheetTitle className="flex items-center gap-3 text-white">
                    <div className="relative h-10 w-10">
                      <Image src="/logo-ceap.png" alt="Logo CEAP" fill className="object-contain" />
                    </div>
                    <div>
                      <div className="text-lg font-bold">SIGA</div>
                      <div className="text-xs text-blue-200/80 font-normal">Sistema de Gestão</div>
                    </div>
                  </SheetTitle>
                </SheetHeader>
                <nav className="flex flex-col gap-2">
                  {displayNavItems.map((item) => {
                    const Icon = item.icon
                    const isActive = pathname === item.href
                    return (
                      <Button
                        key={item.href}
                        asChild
                        variant={isActive ? "default" : "ghost"}
                        size="lg"
                        className={cn(
                          "justify-start gap-3 text-base",
                          isActive
                            ? "bg-white text-[#0a1628] hover:bg-white/90 shadow-sm"
                            : "text-white/90 hover:text-white hover:bg-white/10",
                        )}
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <Link href={item.href}>
                          <Icon className="h-5 w-5" />
                          <span>{item.label}</span>
                        </Link>
                      </Button>
                    )
                  })}
                </nav>
              </SheetContent>
            </Sheet>

            {user && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 sm:h-9 sm:w-9 rounded-full p-0 hover:bg-white/10">
                    <Avatar className="h-8 w-8 sm:h-9 sm:w-9 border-2 border-white/20">
                      <AvatarFallback className="bg-white text-[#0a1628] text-xs sm:text-sm font-bold">
                        {user.username.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{user.name || user.username}</p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user.role === "admin" ? "Administrativo" : "Treinador"}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={logout} className="text-destructive cursor-pointer">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Sair</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
