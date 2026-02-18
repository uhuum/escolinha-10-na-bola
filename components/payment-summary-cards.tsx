"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Check, AlertCircle, Users, TrendingUp } from "lucide-react"
import { formatCurrency } from "@/lib/utils/currency"

interface PaymentSummaryCardsProps {
  totalExpected: number
  totalReceived: number
  paidCount: number
  pendingCount: number
  scholarshipCount: number
  totalStudents: number
  month: string
  year: number
}

export function PaymentSummaryCards({
  totalExpected,
  totalReceived,
  paidCount,
  pendingCount,
  scholarshipCount,
  totalStudents,
  month,
  year,
}: PaymentSummaryCardsProps) {
  const paymentPercentage =
    totalStudents - scholarshipCount > 0 ? ((paidCount / (totalStudents - scholarshipCount)) * 100).toFixed(0) : 0

  return (
    <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
      <Card className="border-2 hover:border-green-500/50 transition-colors">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">Pagos</CardTitle>
          <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-lg bg-green-500/10">
            <Check className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-green-600 mb-1">{paidCount}</div>
          <p className="text-xs sm:text-sm text-muted-foreground">{paymentPercentage}% dos pagantes</p>
        </CardContent>
      </Card>

      <Card className="border-2 hover:border-destructive/50 transition-colors">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">Pendentes</CardTitle>
          <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-lg bg-destructive/10">
            <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-destructive" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-destructive mb-1">{pendingCount}</div>
          <p className="text-xs sm:text-sm text-muted-foreground">Aguardando pagamento</p>
        </CardContent>
      </Card>

      <Card className="border-2 hover:border-blue-500/50 transition-colors">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">Bolsistas</CardTitle>
          <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-lg bg-blue-500/10">
            <Users className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-blue-500 mb-1">{scholarshipCount}</div>
          <p className="text-xs sm:text-sm text-muted-foreground">Alunos isentos</p>
        </CardContent>
      </Card>

      <Card className="border-2 hover:border-primary/50 transition-colors">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">Receita</CardTitle>
          <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-lg bg-primary/10">
            <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-xl sm:text-2xl font-bold text-foreground mb-1">{formatCurrency(totalReceived)}</div>
          <p className="text-xs sm:text-sm text-muted-foreground">de {formatCurrency(totalExpected)} esperado</p>
        </CardContent>
      </Card>
    </div>
  )
}
