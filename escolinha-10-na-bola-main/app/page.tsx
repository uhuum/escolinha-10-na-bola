"use client"

import { useStudents } from "@/lib/hooks/use-students"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCurrency } from "@/lib/utils/currency"
import { Button } from "@/components/ui/button"
import {
  Users,
  DollarSign,
  AlertCircle,
  TrendingUp,
  Calendar,
  ArrowRight,
  CheckCircle2,
  Clock,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import Link from "next/link"
import { Progress } from "@/components/ui/progress"
import { AppHeader } from "@/components/app-header"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useState, useMemo } from "react"
import {
  getAllMonths,
  getCurrentMonthName,
  getCurrentYear,
  getAvailableYears,
  getMonthNumberFromName,
  getCurrentMonthNumber,
  getMonthNameFromNumber,
} from "@/lib/utils/date"
import { LoadingStudents } from "@/components/loading-students"
import type { ClassSchedule, WeekDay } from "@/lib/types"
import { BASE_YEAR, BASE_MONTH } from "@/lib/utils/payment"
import { PWAInstallPrompt } from "@/components/pwa-install-prompt"

export default function DashboardPage() {
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const currentMonth = getCurrentMonthNumber()
    const currentYear = getCurrentYear()
    if (currentYear < BASE_YEAR || (currentYear === BASE_YEAR && currentMonth < BASE_MONTH)) {
      return getMonthNameFromNumber(BASE_MONTH)
    }
    return getCurrentMonthName()
  })
  const [selectedYear, setSelectedYear] = useState(() => {
    const currentYear = getCurrentYear()
    if (currentYear < BASE_YEAR) return BASE_YEAR
    return currentYear
  })
  const [scheduleFilter, setScheduleFilter] = useState<ClassSchedule | "all">("all")
  const [dayFilter, setDayFilter] = useState<WeekDay | "all">("all")
  const { students, getPaymentSummary, filterByPaymentStatus, isLoading } = useStudents()
  const summary = getPaymentSummary(selectedMonth, selectedYear)

  const months = getAllMonths()
  const years = getAvailableYears()
  const selectedMonthNumber = getMonthNumberFromName(selectedMonth)

  const handlePreviousMonth = () => {
    const currentIndex = months.indexOf(selectedMonth)
    if (selectedYear === BASE_YEAR && selectedMonthNumber <= BASE_MONTH) return

    if (currentIndex > 0) {
      setSelectedMonth(months[currentIndex - 1])
    } else {
      setSelectedMonth(months[11])
      setSelectedYear(selectedYear - 1)
    }
  }

  const handleNextMonth = () => {
    const currentIndex = months.indexOf(selectedMonth)
    if (currentIndex < 11) {
      setSelectedMonth(months[currentIndex + 1])
    } else {
      setSelectedMonth(months[0])
      setSelectedYear(selectedYear + 1)
    }
  }

  const pendingStudents = filterByPaymentStatus("Não Pagou", selectedMonth, selectedYear)
  const paidStudents = filterByPaymentStatus("Pago", selectedMonth, selectedYear)

  const collectionRate = summary.totalExpected > 0 ? (summary.totalReceived / summary.totalExpected) * 100 : 0

  const classStats = useMemo(() => {
    const activeStudents = students.filter((s) => s.isActive)

    const schedules: { schedule: ClassSchedule; day: WeekDay; count: number }[] = []

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
        <div className="mb-4 sm:mb-6 lg:mb-8">
          <h2 className="text-xl sm:text-2xl lg:text-4xl font-bold text-foreground mb-1 sm:mb-2 text-balance">
            Dashboard Financeiro
          </h2>
          <p className="text-xs sm:text-sm lg:text-lg text-muted-foreground">Visão geral dos pagamentos e alunos</p>
        </div>

        <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row gap-2 sm:gap-4 max-w-full sm:max-w-md">
          <div className="flex-1">
            <label className="text-xs sm:text-sm font-medium mb-1 sm:mb-2 block">Ano</label>
            <Select value={selectedYear.toString()} onValueChange={(v) => setSelectedYear(Number.parseInt(v, 10))}>
              <SelectTrigger className="h-9 sm:h-10 text-xs sm:text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {years
                  .filter((y) => y >= BASE_YEAR)
                  .map((year) => (
                    <SelectItem key={year} value={year.toString()} className="text-sm">
                      {year}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex-1">
            <label className="text-xs sm:text-sm font-medium mb-1 sm:mb-2 block">Mês</label>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon"
                className="h-9 w-9 sm:h-10 sm:w-10 shrink-0 bg-transparent"
                onClick={handlePreviousMonth}
                title="Mês anterior"
                disabled={selectedYear === BASE_YEAR && selectedMonthNumber <= BASE_MONTH}
              >
                <ChevronLeft className="h-3 w-3 sm:h-4 sm:w-4" />
              </Button>
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger className="h-9 sm:h-10 text-xs sm:text-sm flex-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {months.map((month, index) => {
                    const monthNum = index + 1
                    if (selectedYear === BASE_YEAR && monthNum < BASE_MONTH) return null
                    return (
                      <SelectItem key={month} value={month} className="text-sm">
                        {month}
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="icon"
                className="h-9 w-9 sm:h-10 sm:w-10 shrink-0 bg-transparent"
                onClick={handleNextMonth}
                title="Próximo mês"
              >
                <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4" />
              </Button>
            </div>
          </div>
        </div>

        <div className="grid gap-2 sm:gap-3 lg:gap-6 grid-cols-2 lg:grid-cols-4 mb-4 sm:mb-6 lg:mb-8">
          <Card className="border-2 hover:border-primary/50 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between pb-1 sm:pb-2 p-2 sm:p-3 lg:p-6">
              <CardTitle className="text-[10px] sm:text-xs lg:text-sm font-medium text-muted-foreground">
                Total de Alunos
              </CardTitle>
              <div className="flex h-6 w-6 sm:h-8 sm:w-8 lg:h-10 lg:w-10 items-center justify-center rounded-lg bg-primary/10">
                <Users className="h-3 w-3 sm:h-4 sm:w-4 lg:h-5 lg:w-5 text-primary" />
              </div>
            </CardHeader>
            <CardContent className="p-2 sm:p-3 lg:p-6 pt-0">
              <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mb-0.5 sm:mb-1">
                {summary.totalStudents}
              </div>
              <p className="text-[10px] sm:text-xs lg:text-sm text-muted-foreground flex items-center gap-1">
                <CheckCircle2 className="h-2.5 w-2.5 sm:h-3 sm:w-3 lg:h-3.5 lg:w-3.5 text-accent" />
                {summary.activeStudents} ativos
              </p>
            </CardContent>
          </Card>

          <Card className="border-2 hover:border-primary/50 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between pb-1 sm:pb-2 p-2 sm:p-3 lg:p-6">
              <CardTitle className="text-[10px] sm:text-xs lg:text-sm font-medium text-muted-foreground">
                Receita Esperada
              </CardTitle>
              <div className="flex h-6 w-6 sm:h-8 sm:w-8 lg:h-10 lg:w-10 items-center justify-center rounded-lg bg-accent/10">
                <DollarSign className="h-3 w-3 sm:h-4 sm:w-4 lg:h-5 lg:w-5 text-accent" />
              </div>
            </CardHeader>
            <CardContent className="p-2 sm:p-3 lg:p-6 pt-0">
              <div className="text-lg sm:text-xl lg:text-2xl font-bold text-foreground mb-0.5 sm:mb-1">
                {formatCurrency(summary.totalExpected)}
              </div>
              <p className="text-[10px] sm:text-xs lg:text-sm text-muted-foreground truncate">
                {selectedMonth}/{selectedYear}
              </p>
            </CardContent>
          </Card>

          <Card className="border-2 hover:border-primary/50 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between pb-1 sm:pb-2 p-2 sm:p-3 lg:p-6">
              <CardTitle className="text-[10px] sm:text-xs lg:text-sm font-medium text-muted-foreground">
                Receita Recebida
              </CardTitle>
              <div className="flex h-6 w-6 sm:h-8 sm:w-8 lg:h-10 lg:w-10 items-center justify-center rounded-lg bg-accent/10">
                <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 lg:h-5 lg:w-5 text-accent" />
              </div>
            </CardHeader>
            <CardContent className="p-2 sm:p-3 lg:p-6 pt-0">
              <div className="text-lg sm:text-xl lg:text-2xl font-bold text-foreground mb-0.5 sm:mb-1">
                {formatCurrency(summary.totalReceived)}
              </div>
              <p className="text-[10px] sm:text-xs lg:text-sm text-muted-foreground">
                {collectionRate.toFixed(1)}% do esperado
              </p>
            </CardContent>
          </Card>

          <Card className="border-2 hover:border-destructive/50 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between pb-1 sm:pb-2 p-2 sm:p-3 lg:p-6">
              <CardTitle className="text-[10px] sm:text-xs lg:text-sm font-medium text-muted-foreground">
                Pendentes
              </CardTitle>
              <div className="flex h-6 w-6 sm:h-8 sm:w-8 lg:h-10 lg:w-10 items-center justify-center rounded-lg bg-destructive/10">
                <AlertCircle className="h-3 w-3 sm:h-4 sm:w-4 lg:h-5 lg:w-5 text-destructive" />
              </div>
            </CardHeader>
            <CardContent className="p-2 sm:p-3 lg:p-6 pt-0">
              <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-destructive mb-0.5 sm:mb-1">
                {summary.pendingPayments}
              </div>
              <p className="text-[10px] sm:text-xs lg:text-sm text-muted-foreground">Alunos com pendência</p>
            </CardContent>
          </Card>
        </div>

        <Card className="mb-4 sm:mb-6 lg:mb-8 border-2">
          <CardHeader className="p-3 sm:p-4 lg:p-6">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg lg:text-xl">
              <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-lg bg-primary/10">
                <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
              </div>
              Alunos por Turma
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm lg:text-base">
              Quantidade de alunos em cada horário e dia da semana
            </CardDescription>
          </CardHeader>
          <CardContent className="p-3 sm:p-4 lg:p-6 pt-0">
            <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 mb-4 sm:mb-6">
              <div className="space-y-1 sm:space-y-2">
                <label className="text-xs sm:text-sm font-medium">Horário</label>
                <Select
                  value={scheduleFilter}
                  onValueChange={(value) => setScheduleFilter(value as ClassSchedule | "all")}
                >
                  <SelectTrigger className="h-9 sm:h-10 text-xs sm:text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os Horários</SelectItem>
                    <SelectItem value="18:00-19:30">Primeiro (18:00 - 19:30)</SelectItem>
                    <SelectItem value="19:30-21:00">Segundo (19:30 - 21:00)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1 sm:space-y-2">
                <label className="text-xs sm:text-sm font-medium">Dia da Semana</label>
                <Select value={dayFilter} onValueChange={(value) => setDayFilter(value as WeekDay | "all")}>
                  <SelectTrigger className="h-9 sm:h-10 text-xs sm:text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os Dias</SelectItem>
                    <SelectItem value="Segunda">Segunda</SelectItem>
                    <SelectItem value="Terça">Terça</SelectItem>
                    <SelectItem value="Quarta">Quarta</SelectItem>
                    <SelectItem value="Quinta">Quinta</SelectItem>
                    <SelectItem value="Sexta">Sexta</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>



            <div className="grid gap-2 sm:gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {filteredClassStats.length > 0 ? (
                filteredClassStats.map((stat, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 sm:p-4 rounded-lg border-2 bg-card hover:border-primary/50 transition-colors"
                  >
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Users className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold text-foreground text-sm sm:text-base">{stat.day}</p>
                        <p className="text-xs sm:text-sm text-muted-foreground">{stat.schedule}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xl sm:text-2xl font-bold text-primary">{stat.count}</p>
                      <p className="text-[10px] sm:text-xs text-muted-foreground">alunos</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-full text-center py-6 sm:py-8 text-muted-foreground">
                  <Users className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-2 sm:mb-3 opacity-50" />
                  <p className="text-xs sm:text-sm">Nenhuma turma encontrada com os filtros selecionados</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="mb-4 sm:mb-6 lg:mb-10 border-2">
          <CardHeader className="p-3 sm:p-4 lg:p-6">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg lg:text-xl">
              <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-lg bg-primary/10">
                <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
              </div>
              Taxa de Arrecadação - {selectedMonth}/{selectedYear}
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm lg:text-base">
              Progresso de pagamentos do mês selecionado
            </CardDescription>
          </CardHeader>
          <CardContent className="p-3 sm:p-4 lg:p-6 pt-0">
            <div className="space-y-4 sm:space-y-6">
              <div>
                <div className="flex items-center justify-between mb-2 sm:mb-3">
                  <span className="text-xs sm:text-sm font-medium text-foreground">
                    {paidStudents.length} de {summary.activeStudents - summary.scholarshipStudents} alunos pagaram
                  </span>
                  <span className="text-xl sm:text-2xl font-bold text-primary">{collectionRate.toFixed(1)}%</span>
                </div>
                <Progress value={collectionRate} className="h-3 sm:h-4" />
              </div>
              <div className="grid grid-cols-3 gap-3 sm:gap-6 pt-4 sm:pt-6 border-t">
                <div className="text-center">
                  <p className="text-[10px] sm:text-xs lg:text-sm text-muted-foreground mb-0.5 sm:mb-1">Pagos</p>
                  <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-accent">{paidStudents.length}</p>
                </div>
                <div className="text-center">
                  <p className="text-[10px] sm:text-xs lg:text-sm text-muted-foreground mb-0.5 sm:mb-1">Pendentes</p>
                  <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-destructive">
                    {summary.pendingPayments}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-[10px] sm:text-xs lg:text-sm text-muted-foreground mb-0.5 sm:mb-1">Bolsistas</p>
                  <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-muted-foreground">
                    {summary.scholarshipStudents}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2">
          <CardHeader className="p-3 sm:p-4 lg:p-6">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg lg:text-xl">
              <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-lg bg-destructive/10">
                <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-destructive" />
              </div>
              Alunos Pendentes - {selectedMonth}/{selectedYear}
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm lg:text-base">
              Lista de alunos que ainda não efetuaram o pagamento
            </CardDescription>
          </CardHeader>
          <CardContent className="p-3 sm:p-4 lg:p-6 pt-0">
            {pendingStudents.length === 0 ? (
              <div className="text-center py-8 sm:py-12 text-muted-foreground">
                <CheckCircle2 className="h-12 w-12 sm:h-16 sm:w-16 mx-auto mb-3 sm:mb-4 text-accent" />
                <p className="text-base sm:text-lg font-medium">Todos os pagamentos em dia!</p>
                <p className="text-xs sm:text-sm">Não há alunos com pagamentos pendentes.</p>
              </div>
            ) : (
              <div className="space-y-2 sm:space-y-3">
                {pendingStudents.slice(0, 5).map((student) => (
                  <Link key={student.id} href={`/students/${student.id}`} className="block">
                    <div className="flex items-center justify-between p-3 sm:p-4 rounded-lg border-2 hover:border-primary/50 transition-colors bg-card">
                      <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                        <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-destructive/10 flex items-center justify-center flex-shrink-0">
                          <AlertCircle className="h-5 w-5 sm:h-6 sm:w-6 text-destructive" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-foreground text-sm sm:text-base truncate">{student.name}</p>
                          <p className="text-xs sm:text-sm text-muted-foreground truncate">{student.responsible}</p>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0 ml-2">
                        <p className="font-bold text-destructive text-sm sm:text-base">
                          {formatCurrency(student.monthlyValue)}
                        </p>
                        <p className="text-[10px] sm:text-xs text-muted-foreground">Pendente</p>
                      </div>
                    </div>
                  </Link>
                ))}
                {pendingStudents.length > 5 && (
                  <Link href="/payments">
                    <Button variant="outline" className="w-full gap-2 bg-transparent h-9 sm:h-10 text-xs sm:text-sm">
                      Ver todos os {pendingStudents.length} pendentes
                      <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4" />
                    </Button>
                  </Link>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      <PWAInstallPrompt />
    </div>
  )
}
