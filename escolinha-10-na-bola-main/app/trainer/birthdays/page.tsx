"use client"

import { useStudents } from "@/lib/hooks/use-students"
import { useAuth } from "@/lib/contexts/auth-context"
import { useCoaches } from "@/lib/hooks/use-coaches"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Cake, Calendar } from "lucide-react"
import { useState, useMemo } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getDayOfMonthLocal, getMonthFromDateLocal, getAgeLocal } from "@/lib/utils/date-timezone"
import { LoadingStudents } from "@/components/loading-students"

export default function TrainerBirthdaysPage() {
  const { user } = useAuth()
  const { getCoachClasses } = useCoaches()
  const { students, isLoading } = useStudents()
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null)

  const coachClasses = user?.id ? getCoachClasses(user.id) : []

  const coachStudents = useMemo(() => {
    return students.filter((student) => student.isActive)
  }, [students])

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
    const grouped: Record<string, typeof coachStudents> = {}

    months.forEach((month) => {
      grouped[month] = []
    })

    coachStudents.forEach((student) => {
      if (student.birthDate && typeof student.birthDate === "string" && student.birthDate.trim().length > 0) {
        try {
          const monthIndex = getMonthFromDateLocal(student.birthDate)
          const monthName = months[monthIndex]
          if (monthName) {
            grouped[monthName].push(student)
          }
        } catch {
          // Skip students with invalid dates
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
  }, [coachStudents])

  const displayMonth = selectedMonth || currentMonthName
  const birthdaysThisMonth = birthdaysByMonth[displayMonth] || []

  if (isLoading) {
    return <LoadingStudents message="Carregando aniversariantes..." />
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      <div>
        <div className="flex items-center gap-3 mb-2">
          <Calendar className="h-8 w-8 sm:h-10 sm:w-10 text-primary" />
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground text-balance">Aniversariantes</h1>
        </div>
        <p className="text-sm sm:text-base lg:text-lg text-muted-foreground px-11">Aniversários dos alunos da escola</p>
      </div>

      <div className="max-w-full sm:max-w-xs">
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
        <Card className="border-2 hover:border-primary/50 transition-colors bg-gradient-to-br from-primary/5 to-accent/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl sm:text-2xl text-primary">
              <Cake className="h-6 w-6 sm:h-7 sm:w-7 text-accent" />
              {birthdaysThisMonth.length} {birthdaysThisMonth.length === 1 ? "Aniversariante" : "Aniversariantes"} em{" "}
              {displayMonth}
            </CardTitle>
            <CardDescription className="text-base">Alunos com aniversário neste mês</CardDescription>
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
    </div>
  )
}
