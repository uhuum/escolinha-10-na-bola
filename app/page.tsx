"use client"

import { useStudents } from "@/lib/hooks/use-students"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCurrency } from "@/lib/utils/currency"
import { Button } from "@/components/ui/button"
import { Users, DollarSign, AlertCircle, TrendingUp, Calendar, ArrowRight, CheckCircle2 } from "lucide-react"
import Link from "next/link"
import { Progress } from "@/components/ui/progress"
import { AppHeader } from "@/components/app-header"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useState } from "react"
import { getAllMonths, getCurrentMonthName } from "@/lib/utils/date"

export default function DashboardPage() {
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonthName())
  const { getPaymentSummary, filterByPaymentStatus } = useStudents()
  const summary = getPaymentSummary(selectedMonth)

  const months = getAllMonths()

  const pendingStudents = filterByPaymentStatus("Não Pagou", selectedMonth)
  const paidStudents = filterByPaymentStatus("Pago", selectedMonth)

  const collectionRate = summary.totalExpected > 0 ? (summary.totalReceived / summary.totalExpected) * 100 : 0

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <AppHeader />

      <main className="container mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 flex-1">
        <div className="mb-6 lg:mb-8">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mb-2 text-balance">
            Dashboard Financeiro
          </h2>
          <p className="text-sm sm:text-base lg:text-lg text-muted-foreground">Visão geral dos pagamentos e alunos</p>
        </div>

        <div className="mb-4 sm:mb-6 max-w-full sm:max-w-xs">
          <label className="text-xs sm:text-sm font-medium mb-2 block">Selecione o Mês</label>
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="h-10 sm:h-11 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {months.map((month) => (
                <SelectItem key={month} value={month} className="text-sm">
                  {month}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-3 sm:gap-4 lg:gap-6 grid-cols-2 lg:grid-cols-4 mb-6 lg:mb-8">
          <Card className="border-2 hover:border-primary/50 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between pb-2 sm:pb-3 p-3 sm:p-6">
              <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">Total de Alunos</CardTitle>
              <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-lg bg-primary/10">
                <Users className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
              </div>
            </CardHeader>
            <CardContent className="p-3 sm:p-6 pt-0">
              <div className="text-3xl sm:text-4xl font-bold text-foreground mb-1">{summary.totalStudents}</div>
              <p className="text-xs sm:text-sm text-muted-foreground flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-accent" />
                {summary.activeStudents} ativos
              </p>
            </CardContent>
          </Card>

          <Card className="border-2 hover:border-primary/50 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between pb-2 sm:pb-3 p-3 sm:p-6">
              <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">Receita Esperada</CardTitle>
              <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-lg bg-accent/10">
                <DollarSign className="h-4 w-4 sm:h-5 sm:w-5 text-accent" />
              </div>
            </CardHeader>
            <CardContent className="p-3 sm:p-6 pt-0">
              <div className="text-xl sm:text-2xl font-bold text-foreground mb-1">
                {formatCurrency(summary.totalExpected)}
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground truncate">Mês de {selectedMonth}</p>
            </CardContent>
          </Card>

          <Card className="border-2 hover:border-primary/50 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between pb-2 sm:pb-3 p-3 sm:p-6">
              <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">Receita Recebida</CardTitle>
              <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-lg bg-accent/10">
                <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-accent" />
              </div>
            </CardHeader>
            <CardContent className="p-3 sm:p-6 pt-0">
              <div className="text-xl sm:text-2xl font-bold text-foreground mb-1">
                {formatCurrency(summary.totalReceived)}
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground">{collectionRate.toFixed(1)}% do esperado</p>
            </CardContent>
          </Card>

          <Card className="border-2 hover:border-destructive/50 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between pb-2 sm:pb-3 p-3 sm:p-6">
              <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
                Pagamentos Pendentes
              </CardTitle>
              <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-lg bg-destructive/10">
                <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-destructive" />
              </div>
            </CardHeader>
            <CardContent className="p-3 sm:p-6 pt-0">
              <div className="text-3xl sm:text-4xl font-bold text-destructive mb-1">{summary.pendingPayments}</div>
              <p className="text-xs sm:text-sm text-muted-foreground">Alunos com pendência</p>
            </CardContent>
          </Card>
        </div>

        <Card className="mb-8 lg:mb-10 border-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Calendar className="h-5 w-5 text-primary" />
              </div>
              Taxa de Arrecadação - {selectedMonth}
            </CardTitle>
            <CardDescription className="text-base">Progresso de pagamentos do mês selecionado</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-foreground">
                    {paidStudents.length} de {summary.activeStudents - summary.scholarshipStudents} alunos pagaram
                  </span>
                  <span className="text-2xl font-bold text-primary">{collectionRate.toFixed(1)}%</span>
                </div>
                <Progress value={collectionRate} className="h-4" />
              </div>
              <div className="grid grid-cols-3 gap-6 pt-6 border-t">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-1">Pagos</p>
                  <p className="text-3xl font-bold text-accent">{paidStudents.length}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-1">Pendentes</p>
                  <p className="text-3xl font-bold text-destructive">{summary.pendingPayments}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-1">Bolsistas</p>
                  <p className="text-3xl font-bold text-muted-foreground">{summary.scholarshipStudents}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Removed card of Quick Actions, kept only card of Students with Pending Payments */}
        <Card className="border-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-destructive/10">
                <AlertCircle className="h-5 w-5 text-destructive" />
              </div>
              Alunos com Pendência
            </CardTitle>
            <CardDescription className="text-base">
              {pendingStudents.length} alunos precisam de cobrança
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pendingStudents.slice(0, 5).map((student) => (
                <div
                  key={student.id}
                  className="flex items-center justify-between p-4 rounded-xl border bg-muted/30 hover:bg-muted/50 transition-colors"
                >
                  <div>
                    <p className="font-semibold text-foreground">{student.name}</p>
                    <p className="text-sm text-muted-foreground">{student.responsible}</p>
                  </div>
                  <Button asChild size="sm" className="gap-1">
                    <Link href={`/students/${student.id}`}>
                      Ver
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </Button>
                </div>
              ))}
              {pendingStudents.length > 5 && (
                <Button asChild variant="outline" className="w-full mt-4 bg-transparent">
                  <Link href="/payments">Ver todos ({pendingStudents.length})</Link>
                </Button>
              )}
              {pendingStudents.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle2 className="h-12 w-12 mx-auto mb-3 text-accent" />
                  <p>Nenhum pagamento pendente</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
