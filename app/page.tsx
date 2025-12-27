"use client"

import { useStudents } from "@/lib/hooks/use-students"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCurrency } from "@/lib/utils/currency"
import { Button } from "@/components/ui/button"
import { Users, DollarSign, AlertCircle, TrendingUp, Calendar, ArrowRight, CheckCircle2, Clock } from "lucide-react"
import Link from "next/link"
import { Progress } from "@/components/ui/progress"
import { AppHeader } from "@/components/app-header"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useState, useMemo } from "react"
import { getAllMonths, getCurrentMonthName } from "@/lib/utils/date"
import { LoadingStudents } from "@/components/loading-students"
import type { ClassSchedule, WeekDay } from "@/lib/types"

export default function DashboardPage() {
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonthName())
  const [scheduleFilter, setScheduleFilter] = useState<ClassSchedule | "all">("all")
  const [dayFilter, setDayFilter] = useState<WeekDay | "all">("all")
  const { students, getPaymentSummary, filterByPaymentStatus, isLoading } = useStudents()
  const summary = getPaymentSummary(selectedMonth)

  const months = getAllMonths()

  const pendingStudents = filterByPaymentStatus("Não Pagou", selectedMonth)
  const paidStudents = filterByPaymentStatus("Pago", selectedMonth)

  const collectionRate = summary.totalExpected > 0 ? (summary.totalReceived / summary.totalExpected) * 100 : 0

  const classStats = useMemo(() => {
    const activeStudents = students.filter((s) => s.isActive)

    const schedules: { schedule: ClassSchedule; day: WeekDay; count: number }[] = []

    // Count students per schedule+day combination
    const scheduleMap = new Map<string, number>()

    activeStudents.forEach((student) => {
      if (student.scheduleConfigs && student.scheduleConfigs.length > 0) {
        student.scheduleConfigs.forEach((config) => {
          const key = `${config.schedule}|${config.day}`
          scheduleMap.set(key, (scheduleMap.get(key) || 0) + 1)
        })
      } else if (student.classSchedule && student.classDays) {
        student.classDays.forEach((day) => {
          const key = `${student.classSchedule}|${day}`
          scheduleMap.set(key, (scheduleMap.get(key) || 0) + 1)
        })
      }
    })

    scheduleMap.forEach((count, key) => {
      const [schedule, day] = key.split("|")
      schedules.push({
        schedule: schedule as ClassSchedule,
        day: day as WeekDay,
        count,
      })
    })

    // Sort by schedule then day
    const dayOrder = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta"]
    schedules.sort((a, b) => {
      if (a.schedule !== b.schedule) {
        return a.schedule < b.schedule ? -1 : 1
      }
      return dayOrder.indexOf(a.day) - dayOrder.indexOf(b.day)
    })

    return schedules
  }, [students])

  const filteredClassStats = useMemo(() => {
    return classStats.filter((stat) => {
      const matchesSchedule = scheduleFilter === "all" || stat.schedule === scheduleFilter
      const matchesDay = dayFilter === "all" || stat.day === dayFilter
      return matchesSchedule && matchesDay
    })
  }, [classStats, scheduleFilter, dayFilter])

  const totalFilteredStudents = filteredClassStats.reduce((sum, stat) => sum + stat.count, 0)

  if (isLoading) {
    return <LoadingStudents message="Carregando dashboard..." />
  }

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

        <Card className="mb-6 lg:mb-8 border-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Clock className="h-5 w-5 text-primary" />
              </div>
              Alunos por Turma
            </CardTitle>
            <CardDescription className="text-base">
              Quantidade de alunos em cada horário e dia da semana
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Filtros */}
            <div className="grid gap-4 md:grid-cols-2 mb-6">
              <div className="space-y-2">
                <label className="text-sm font-medium">Horário</label>
                <Select
                  value={scheduleFilter}
                  onValueChange={(value) => setScheduleFilter(value as ClassSchedule | "all")}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os Horários</SelectItem>
                    <SelectItem value="18:00-19:30">Primeiro Horário (18:00 - 19:30)</SelectItem>
                    <SelectItem value="19:30-21:00">Segundo Horário (19:30 - 21:00)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Dia da Semana</label>
                <Select value={dayFilter} onValueChange={(value) => setDayFilter(value as WeekDay | "all")}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os Dias</SelectItem>
                    <SelectItem value="Segunda">Segunda-feira</SelectItem>
                    <SelectItem value="Terça">Terça-feira</SelectItem>
                    <SelectItem value="Quarta">Quarta-feira</SelectItem>
                    <SelectItem value="Quinta">Quinta-feira</SelectItem>
                    <SelectItem value="Sexta">Sexta-feira</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Summary */}
            <div className="p-4 rounded-lg bg-primary/5 border mb-4">
              <p className="text-sm text-muted-foreground">
                Total de matrículas: <span className="font-bold text-foreground text-lg">{totalFilteredStudents}</span>
                {(scheduleFilter !== "all" || dayFilter !== "all") && <span className="ml-2 text-xs">(filtrado)</span>}
              </p>
            </div>

            {/* Class Grid */}
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {filteredClassStats.length > 0 ? (
                filteredClassStats.map((stat, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-4 rounded-lg border-2 bg-card hover:border-primary/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Users className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">{stat.day}</p>
                        <p className="text-sm text-muted-foreground">{stat.schedule}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-primary">{stat.count}</p>
                      <p className="text-xs text-muted-foreground">alunos</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-full text-center py-8 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>Nenhuma turma encontrada com os filtros selecionados</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

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
