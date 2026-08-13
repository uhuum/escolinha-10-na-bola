"use client"

import { useAuth } from "@/lib/contexts/auth-context"
import { useCoaches } from "@/lib/hooks/use-coaches"
import { useStudents } from "@/lib/hooks/use-students"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, BookOpen, Calendar, Clock } from "lucide-react"
import { LoadingStudents } from "@/components/loading-students"

export default function TrainerDashboardPage() {
  const { user } = useAuth()
  const { getCoachClasses } = useCoaches()
  const { students, isLoading } = useStudents()

  const coachClasses = user?.id ? getCoachClasses(user.id) : []
  const activeStudents = students.filter((s) => s.isActive)

  const getStudentsForClass = (schedule: string, days: string[]) => {
    return activeStudents.filter((student) => {
      if (student.scheduleConfigs && student.scheduleConfigs.length > 0) {
        return student.scheduleConfigs.some((config) => config.schedule === schedule && days.includes(config.day))
      }
      return student.classSchedule === schedule && student.classDays?.some((day) => days.includes(day))
    })
  }

  const coachStudentIds = new Set<string>()
  coachClasses.forEach((classInfo) => {
    const classStudents = getStudentsForClass(classInfo.schedule, classInfo.days)
    classStudents.forEach((s) => coachStudentIds.add(s.id))
  })
  const totalStudents = coachStudentIds.size
  const classCount = coachClasses.length

  if (isLoading) {
    return <LoadingStudents message="Carregando dashboard..." />
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mb-2 text-balance">
          Olá, {user?.name || "Treinador"}!
        </h1>
        <p className="text-sm sm:text-base lg:text-lg text-muted-foreground">
          Gerencie suas turmas e registre presenças em tempo real
        </p>
      </div>

      <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2">
        <Card className="border-2 hover:border-primary/50 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between pb-2 sm:pb-3 p-4 sm:p-6">
            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">Suas Turmas</CardTitle>
            <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-lg bg-primary/10">
              <BookOpen className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
            </div>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0">
            <div className="text-3xl sm:text-4xl font-bold text-foreground mb-1">{classCount}</div>
            <p className="text-xs sm:text-sm text-muted-foreground">Turma(s) sob sua responsabilidade</p>
          </CardContent>
        </Card>

        <Card className="border-2 hover:border-accent/50 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between pb-2 sm:pb-3 p-4 sm:p-6">
            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">Total de Alunos</CardTitle>
            <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-lg bg-accent/10">
              <Users className="h-4 w-4 sm:h-5 sm:w-5 text-accent" />
            </div>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0">
            <div className="text-3xl sm:text-4xl font-bold text-foreground mb-1">{totalStudents}</div>
            <p className="text-xs sm:text-sm text-muted-foreground">Alunos ativos nas suas turmas</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-2">
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-lg bg-accent/10">
              <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-accent" />
            </div>
            Detalhes das Turmas
          </CardTitle>
          <CardDescription className="text-sm sm:text-base">Horários, dias e quantidade de alunos</CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-0">
          {coachClasses.length === 0 ? (
            <div className="text-center py-8">
              <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-3 opacity-50" />
              <p className="text-sm text-muted-foreground">Nenhuma turma atribuída</p>
              <p className="text-xs text-muted-foreground mt-1">Entre em contato com a administração</p>
            </div>
          ) : (
            <div className="space-y-4">
              {coachClasses.map((classInfo, index) => {
                const classStudents = getStudentsForClass(classInfo.schedule, classInfo.days)
                return (
                  <div
                    key={index}
                    className="p-4 rounded-xl border-2 bg-gradient-to-r from-primary/5 to-accent/5 hover:border-primary/30 transition-colors"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 flex-shrink-0">
                          <Clock className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-bold text-foreground text-lg">{classInfo.schedule}</p>
                          <p className="text-sm text-muted-foreground">{classInfo.days.join(", ")}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className="text-2xl font-bold text-primary">{classStudents.length}</p>
                          <p className="text-xs text-muted-foreground">alunos</p>
                        </div>
                        <span className="text-xs px-3 py-1.5 rounded-full bg-primary/10 text-primary font-medium">
                          {classInfo.days.length} {classInfo.days.length === 1 ? "dia" : "dias"}/semana
                        </span>
                      </div>
                    </div>

                    {classStudents.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-primary/10">
                        <p className="text-xs text-muted-foreground mb-2">Alunos nesta turma:</p>
                        <div className="flex flex-wrap gap-1">
                          {classStudents.slice(0, 5).map((student) => (
                            <span key={student.id} className="text-xs px-2 py-1 rounded bg-card border">
                              {student.name.split(" ")[0]}
                            </span>
                          ))}
                          {classStudents.length > 5 && (
                            <span className="text-xs px-2 py-1 rounded bg-muted text-muted-foreground">
                              +{classStudents.length - 5} mais
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
