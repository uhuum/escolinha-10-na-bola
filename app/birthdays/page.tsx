"use client"

import { useStudents } from "@/lib/hooks/use-students"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Cake, Calendar } from "lucide-react"
import { AppHeader } from "@/components/app-header"
import { useState, useMemo, useEffect } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getDayOfMonthLocal, getMonthFromDateLocal, getAgeLocal } from "@/lib/utils/date-timezone"
import { useAuth } from "@/lib/contexts/auth-context"
import { useRouter } from "next/navigation"
import { LoadingStudents } from "@/components/loading-students"

export default function AdminBirthdaysPage() {
  const { user, isLoading: authLoading } = useAuth()
  const router = useRouter()
  const [hasAccess, setHasAccess] = useState(false)
  const { students, isLoading: studentsLoading } = useStudents()
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null)

  const months = [
    "Janeiro",
    "Fevereiro",
    "Março",
    "Abril",
    "Maio",
    "Junho",
    "Julho",
    "Agosto",
    "Setembro",
    "Outubro",
    "Novembro",
    "Dezembro",
  ]

  const currentMonth = new Date().getMonth()
  const currentMonthName = months[currentMonth]

  const birthdaysByMonth = useMemo(() => {
    const grouped: Record<string, typeof students> = {}

    months.forEach((month) => {
      grouped[month] = []
    })

    students.forEach((student) => {
      if (student.birthDate && typeof student.birthDate === "string" && student.birthDate.trim().length > 0) {
        try {
          const monthIndex = getMonthFromDateLocal(student.birthDate)
          const monthName = months[monthIndex]
          if (monthName) {
            grouped[monthName].push(student)
          }
        } catch (error) {
          console.error(`Invalid date for student ${student.name}:`, error)
        }
      }
    })

    Object.keys(grouped).forEach((month) => {
      grouped[month].sort((a, b) => {
        const dateA = getDayOfMonthLocal(a.birthDate || "")
        const dateB = getDayOfMonthLocal(b.birthDate || "")
        return dateA - dateB
      })
    })

    return grouped
  }, [students])

  const displayMonth = selectedMonth || currentMonthName
  const birthdaysThisMonth = birthdaysByMonth[displayMonth] || []

  useEffect(() => {
    if (!authLoading) {
      if (user?.role !== "admin") {
        router.push(user?.role === "coach" ? "/trainer/dashboard" : "/login")
      } else {
        setHasAccess(true)
      }
    }
  }, [user, authLoading, router])

  if (authLoading || !hasAccess || studentsLoading) {
    return <LoadingStudents message="Carregando aniversariantes..." />
  }

  if (!students || students.length === 0) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <AppHeader />
        <main className="flex-1 container mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6">
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 sm:py-16">
              <Cake className="h-16 w-16 sm:h-20 sm:w-20 text-muted-foreground mb-4 opacity-50" />
              <p className="text-lg sm:text-xl font-semibold text-foreground">Nenhum aluno cadastrado</p>
            </CardContent>
          </Card>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <AppHeader />

      <main className="flex-1 container mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        <div className="mb-6 lg:mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Calendar className="h-8 w-8 sm:h-10 sm:w-10 text-primary" />
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground text-balance">Aniversariantes</h1>
          </div>
          <p className="text-sm sm:text-base lg:text-lg text-muted-foreground px-11">
            Confira os alunos que fazem aniversário neste mês
          </p>
        </div>

        <div className="mb-6 sm:mb-8 max-w-full sm:max-w-xs">
          <label className="text-xs sm:text-sm font-medium mb-2 block">Selecione o Mês</label>
          <Select value={selectedMonth || ""} onValueChange={(value) => setSelectedMonth(value || null)}>
            <SelectTrigger className="h-10 sm:h-11 text-sm border-2">
              <SelectValue placeholder={currentMonthName} />
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

        {birthdaysThisMonth.length > 0 ? (
          <div className="grid gap-4 lg:gap-6">
            <Card className="border-2 hover:border-primary/50 transition-colors bg-gradient-to-br from-primary/5 to-accent/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl sm:text-2xl text-primary">
                  <Cake className="h-6 w-6 sm:h-7 sm:w-7 text-accent" />
                  {birthdaysThisMonth.length} {birthdaysThisMonth.length === 1 ? "Aniversariante" : "Aniversariantes"}{" "}
                  em {displayMonth}
                </CardTitle>
                <CardDescription className="text-base">
                  Lista de alunos com data de nascimento neste mês
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 sm:space-y-4">
                  {birthdaysThisMonth.map((student) => (
                    <div
                      key={student.id}
                      className="flex items-center justify-between p-3 sm:p-4 rounded-lg border-2 border-accent/20 bg-gradient-to-r from-accent/5 to-transparent hover:border-accent/40 hover:bg-accent/10 transition-all"
                    >
                      <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                        <Avatar className="h-10 w-10 sm:h-12 sm:w-12 flex-shrink-0">
                          {student.photo ? (
                            <AvatarImage src={student.photo || "/placeholder.svg"} alt={student.name} />
                          ) : null}
                          <AvatarFallback className="bg-primary text-primary-foreground font-bold text-xs sm:text-sm">
                            {student.name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-foreground text-sm sm:text-base truncate">{student.name}</p>
                          <p className="text-xs sm:text-sm text-muted-foreground">
                            {getDayOfMonthLocal(student.birthDate)} de {displayMonth} • {getAgeLocal(student.birthDate)}{" "}
                            anos
                          </p>
                        </div>
                      </div>
                      <Badge className="ml-2 flex-shrink-0 bg-accent text-accent-foreground text-xs sm:text-sm">
                        Dia {getDayOfMonthLocal(student.birthDate)}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <Card className="border-2">
            <CardContent className="flex flex-col items-center justify-center py-12 sm:py-16">
              <Cake className="h-16 w-16 sm:h-20 sm:w-20 text-muted-foreground mb-4 opacity-50" />
              <p className="text-lg sm:text-xl font-semibold text-foreground mb-2">Nenhum aniversariante</p>
              <p className="text-sm sm:text-base text-muted-foreground text-center">
                Não há alunos fazendo aniversário em {displayMonth}
              </p>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}
