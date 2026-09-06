"use client"

import Link from "next/link"
import { Camera, Users, DollarSign, LayoutDashboard, ClipboardCheck, FileText } from "lucide-react"
import Image from "next/image"
import { useAuth } from "@/lib/contexts/auth-context"

export function AppFooter() {
  const { user } = useAuth()
  if (!user) return null

  const coach = user.role === "coach"
  const links = coach
    ? [
        { href: "/trainer/dashboard", label: "Painel", icon: LayoutDashboard },
        { href: "/trainer/chamada", label: "Chamada", icon: ClipboardCheck },
        { href: "/trainer/relatorio", label: "Relatório", icon: FileText },
      ]
    : [
        { href: "/", label: "Dashboard", icon: LayoutDashboard },
        { href: "/students", label: "Alunos", icon: Users },
        { href: "/payments", label: "Pagamentos", icon: DollarSign },
      ]

  const quickHref = coach ? "/trainer/carometro" : "/carometro"

  return (
    <footer className="border-t bg-card mt-auto">
      <div className="container mx-auto px-4 lg:px-8 py-8">
        <div className="grid gap-8 md:grid-cols-3">
          <div className="flex items-start gap-3">
            <div className="relative h-12 w-12 flex-shrink-0">
              <Image src="/logo.png" alt="Logo" fill className="object-contain" />
            </div>
            <div>
              <h3 className="font-bold text-foreground mb-1">SIGA</h3>
              <p className="text-sm text-muted-foreground">Sistema Integrado de Gestão de Alunos</p>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-foreground mb-3">Navegação</h4>
            <ul className="space-y-2">
              {links.map((item) => {
                const Icon = item.icon
                return (
                  <li key={item.href}>
                    <Link href={item.href} className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2">
                      <Icon className="h-3.5 w-3.5" />
                      {item.label}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-foreground mb-3">Acesso Rápido</h4>
            <Link href={quickHref} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-sm font-medium">
              <Camera className="h-4 w-4" />
              Ir para Carômetro
            </Link>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t text-center text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} SIGA. Todos os direitos reservados.</p>
        </div>
      </div>
    </footer>
  )
}
