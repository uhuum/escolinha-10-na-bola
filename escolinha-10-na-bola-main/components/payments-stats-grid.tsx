"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCurrency } from "@/lib/utils/currency"
import { Check, AlertCircle, CalendarIcon, Users, DollarSign, UserX } from "lucide-react"

interface PaymentsStatsGridProps {
  paidCount: number
  openCount: number
  pendingCount: number
  scholarshipCount: number
  archivedCount: number
  totalReceived: number
  totalExpected: number
  onPendingClick?: () => void
}

export function PaymentsStatsGrid({
  paidCount,
  openCount,
  pendingCount,
  scholarshipCount,
  archivedCount,
  totalReceived,
  totalExpected,
  onPendingClick,
}: PaymentsStatsGridProps) {
  return (
    <div className="grid gap-2 sm:gap-3 lg:gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 mb-4 sm:mb-6 lg:mb-8">
      {/* Pagos */}
      <Card className="border-2 hover:border-accent/50 transition-colors">
        <CardHeader className="flex flex-row items-center justify-between pb-1 sm:pb-2 p-2 sm:p-3 lg:p-4">
          <CardTitle className="text-[9px] sm:text-[10px] lg:text-xs font-medium text-muted-foreground">
            Pagos
          </CardTitle>
          <div className="flex h-5 w-5 sm:h-6 sm:w-6 lg:h-8 lg:w-8 items-center justify-center rounded-lg bg-accent/10">
            <Check className="h-2.5 w-2.5 sm:h-3 sm:w-3 lg:h-4 lg:w-4 text-accent" />
          </div>
        </CardHeader>
        <CardContent className="p-2 sm:p-3 lg:p-4 pt-0">
          <div className="text-lg sm:text-xl lg:text-2xl font-bold text-accent">{paidCount}</div>
          <p className="text-[8px] sm:text-[9px] lg:text-[10px] text-muted-foreground truncate">100% dos pagantes</p>
        </CardContent>
      </Card>

      {/* Em Aberto */}
      <Card className="border-2 hover:border-amber-500/50 transition-colors">
        <CardHeader className="flex flex-row items-center justify-between pb-1 sm:pb-2 p-2 sm:p-3 lg:p-4">
          <CardTitle className="text-[9px] sm:text-[10px] lg:text-xs font-medium text-muted-foreground">
            Em Aberto
          </CardTitle>
          <div className="flex h-5 w-5 sm:h-6 sm:w-6 lg:h-8 lg:w-8 items-center justify-center rounded-lg bg-amber-500/10">
            <CalendarIcon className="h-2.5 w-2.5 sm:h-3 sm:w-3 lg:h-4 lg:w-4 text-amber-500" />
          </div>
        </CardHeader>
        <CardContent className="p-2 sm:p-3 lg:p-4 pt-0">
          <div className="text-lg sm:text-xl lg:text-2xl font-bold text-amber-500">{openCount}</div>
          <p className="text-[8px] sm:text-[9px] lg:text-[10px] text-muted-foreground truncate">
            Aguardando (dia 1-10)
          </p>
        </CardContent>
      </Card>

      {/* Pendentes */}
      <Card className="border-2 hover:border-destructive/50 transition-colors cursor-pointer" onClick={onPendingClick}>
        <CardHeader className="flex flex-row items-center justify-between pb-1 sm:pb-2 p-2 sm:p-3 lg:p-4">
          <CardTitle className="text-[9px] sm:text-[10px] lg:text-xs font-medium text-muted-foreground">
            Pendentes
          </CardTitle>
          <div className="flex h-5 w-5 sm:h-6 sm:w-6 lg:h-8 lg:w-8 items-center justify-center rounded-lg bg-destructive/10">
            <AlertCircle className="h-2.5 w-2.5 sm:h-3 sm:w-3 lg:h-4 lg:w-4 text-destructive" />
          </div>
        </CardHeader>
        <CardContent className="p-2 sm:p-3 lg:p-4 pt-0">
          <div className="text-lg sm:text-xl lg:text-2xl font-bold text-destructive">{pendingCount}</div>
          <p className="text-[8px] sm:text-[9px] lg:text-[10px] text-muted-foreground truncate">Clique para cobrar</p>
        </CardContent>
      </Card>

      {/* Bolsistas */}
      <Card className="border-2 hover:border-blue-500/50 transition-colors">
        <CardHeader className="flex flex-row items-center justify-between pb-1 sm:pb-2 p-2 sm:p-3 lg:p-4">
          <CardTitle className="text-[9px] sm:text-[10px] lg:text-xs font-medium text-muted-foreground">
            Bolsistas
          </CardTitle>
          <div className="flex h-5 w-5 sm:h-6 sm:w-6 lg:h-8 lg:w-8 items-center justify-center rounded-lg bg-blue-500/10">
            <Users className="h-2.5 w-2.5 sm:h-3 sm:w-3 lg:h-4 lg:w-4 text-blue-500" />
          </div>
        </CardHeader>
        <CardContent className="p-2 sm:p-3 lg:p-4 pt-0">
          <div className="text-lg sm:text-xl lg:text-2xl font-bold text-blue-500">{scholarshipCount}</div>
          <p className="text-[8px] sm:text-[9px] lg:text-[10px] text-muted-foreground truncate">Alunos com bolsa</p>
        </CardContent>
      </Card>

      {/* Afastados */}
      <Card className="border-2 hover:border-gray-500/50 transition-colors">
        <CardHeader className="flex flex-row items-center justify-between pb-1 sm:pb-2 p-2 sm:p-3 lg:p-4">
          <CardTitle className="text-[9px] sm:text-[10px] lg:text-xs font-medium text-muted-foreground">
            Afastados
          </CardTitle>
          <div className="flex h-5 w-5 sm:h-6 sm:w-6 lg:h-8 lg:w-8 items-center justify-center rounded-lg bg-gray-500/10">
            <UserX className="h-2.5 w-2.5 sm:h-3 sm:w-3 lg:h-4 lg:w-4 text-gray-500" />
          </div>
        </CardHeader>
        <CardContent className="p-2 sm:p-3 lg:p-4 pt-0">
          <div className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-500">{archivedCount}</div>
          <p className="text-[8px] sm:text-[9px] lg:text-[10px] text-muted-foreground truncate">Alunos arquivados</p>
        </CardContent>
      </Card>

      {/* Receita */}
      <Card className="border-2 hover:border-primary/50 transition-colors col-span-2 sm:col-span-1 lg:col-span-2">
        <CardHeader className="flex flex-row items-center justify-between pb-1 sm:pb-2 p-2 sm:p-3 lg:p-4">
          <CardTitle className="text-[9px] sm:text-[10px] lg:text-xs font-medium text-muted-foreground">
            Receita
          </CardTitle>
          <div className="flex h-5 w-5 sm:h-6 sm:w-6 lg:h-8 lg:w-8 items-center justify-center rounded-lg bg-primary/10">
            <DollarSign className="h-2.5 w-2.5 sm:h-3 sm:w-3 lg:h-4 lg:w-4 text-primary" />
          </div>
        </CardHeader>
        <CardContent className="p-2 sm:p-3 lg:p-4 pt-0">
          <div className="text-base sm:text-lg lg:text-xl font-bold text-foreground">
            {formatCurrency(totalReceived)}
          </div>
          <p className="text-[8px] sm:text-[9px] lg:text-[10px] text-muted-foreground truncate">
            de {formatCurrency(totalExpected)}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
