"use client"

import { useAuth } from "@/lib/contexts/auth-context"
import { useCoaches } from "@/lib/hooks/use-coaches"
import { useStudents } from "@/lib/hooks/use-students"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, BookOpen, Calendar, Clock } from "lucide-react"
import { LoadingStudents } from "@/components/loading-students"

export default function TrainerDashboardPage() {
  const { user } = useAuth()
  const { getCoachByUsername } = useCoaches()
  const { students, isLoading } = useStudents()

  const coach = user?.username
    ? getCoachByUsername(user.username)
    : undefined

  const coachClasses = coach?.classes || []

  const activeStudents = students.filter((student) => student.isActive)

  /**
   * Retorna os alunos de UMA turma específica.
   *
   * Uma turma é definida por:
   * DIA + HORÁRIO
   *
   * Exemplo:
   * Segunda + 18:00-19:30
   * é diferente de
   * Segunda + 19:30-21:00
   */
  const getStudentsForClass = (schedule: string, day: string) => {
    return activeStudents.filter((student) => {
      // Formato mais novo:
      // cada configuração possui dia + horário
      if (
        student.scheduleConfigs &&
        student.scheduleConfigs.length > 0
      ) {
        return student.scheduleConfigs.some(
          (config) =>
            config.schedule === schedule &&
            config.day === day
        )
      }

      // Compatibilidade com alunos antigos
      return (
        student.classSchedule === schedule &&
        student.classDays?.includes(day as any)
      )
    })
  }

  /**
   * Primeiro transforma:
   *
   * 18:00-19:30
   * Segunda, Quarta, Sexta
   *
   * em:
   *
   * Segunda 18:00-19:30
   * Quarta 18:00-19:30
   * Sexta 18:00-19:30
   *
   * Cada uma será uma turma independente.
   */
  const individualClasses = coachClasses.flatMap((classInfo) =>
    classInfo.days.map((day) => ({
      schedule: classInfo.schedule,
      day,
    }))
  )

  /**
   * Remove possíveis combinações duplicadas
   * de dia + horário.
   */
  const uniqueClasses = individualClasses.filter(
    (classInfo, index, array) =>
      array.findIndex(
        (other) =>
          other.schedule === classInfo.schedule &&
          other.day === classInfo.day
      ) === index
  )

  /**
   * Adiciona os alunos de cada turma
   * e remove turmas vazias.
   */
  const classesWithStudents = uniqueClasses
    .map((classInfo) => ({
      ...classInfo,
      students: getStudentsForClass(
        classInfo.schedule,
        classInfo.day
      ),
    }))
    .filter((classInfo) => classInfo.students.length > 0)

  /**
   * Ordem dos dias da semana para deixar
   * a exibição organizada.
   */
  const dayOrder: Record<string, number> = {
    Segunda: 1,
    "Segunda-feira": 1,
    Terça: 2,
    "Terça-feira": 2,
    Quarta: 3,
    "Quarta-feira": 3,
    Quinta: 4,
    "Quinta-feira": 4,
    Sexta: 5,
    "Sexta-feira": 5,
    Sábado: 6,
    Domingo: 7,
  }

  /**
   * Organiza primeiro pelo dia
   * e depois pelo horário.
   */
  const sortedClasses = [...classesWithStudents].sort((a, b) => {
    const dayA = dayOrder[a.day] ?? 99
    const dayB = dayOrder[b.day] ?? 99

    if (dayA !== dayB) {
      return dayA - dayB
    }

    return a.schedule.localeCompare(b.schedule)
  })

  /**
   * Quantidade REAL de turmas.
   *
   * Só entram turmas que possuem
   * pelo menos 1 aluno.
   */
  const classCount = sortedClasses.length

  /**
   * Total de alunos únicos.
   *
   * Se Arthur treina:
   * segunda,
   * quarta,
   * sexta,
   *
   * ele continua contando apenas 1 vez
   * no cartão "Total de Alunos".
   */
  const coachStudentIds = new Set<string>()

  sortedClasses.forEach((classInfo) => {
    classInfo.students.forEach((student) => {
      coachStudentIds.add(student.id)
    })
  })

  const totalStudents = coachStudentIds.size

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
            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
              Suas Turmas
            </CardTitle>

            <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-lg bg-primary/10">
              <BookOpen className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
            </div>
          </CardHeader>

          <CardContent className="p-4 sm:p-6 pt-0">
            <div className="text-3xl sm:text-4xl font-bold text-foreground mb-1">
              {classCount}
            </div>

            <p className="text-xs sm:text-sm text-muted-foreground">
              Turma(s) com alunos ativos
            </p>
          </CardContent>
        </Card>

        <Card className="border-2 hover:border-accent/50 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between pb-2 sm:pb-3 p-4 sm:p-6">
            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
              Total de Alunos
            </CardTitle>

            <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-lg bg-accent/10">
              <Users className="h-4 w-4 sm:h-5 sm:w-5 text-accent" />
            </div>
          </CardHeader>

          <CardContent className="p-4 sm:p-6 pt-0">
            <div className="text-3xl sm:text-4xl font-bold text-foreground mb-1">
              {totalStudents}
            </div>

            <p className="text-xs sm:text-sm text-muted-foreground">
              Alunos únicos ativos nas suas turmas
            </p>
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

          <CardDescription className="text-sm sm:text-base">
            Cada dia e horário representa uma turma diferente
          </CardDescription>
        </CardHeader>

        <CardContent className="p-4 sm:p-6 pt-0">
          {sortedClasses.length === 0 ? (
            <div className="text-center py-8">
              <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-3 opacity-50" />

              <p className="text-sm text-muted-foreground">
                Nenhuma turma com alunos
              </p>

              <p className="text-xs text-muted-foreground mt-1">
                Nenhum aluno ativo foi encontrado nas turmas atribuídas
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {sortedClasses.map((classInfo) => {
                const classStudents = classInfo.students

                return (
                  <div
                    key={`${classInfo.day}-${classInfo.schedule}`}
                    className="p-4 rounded-xl border-2 bg-gradient-to-r from-primary/5 to-accent/5 hover:border-primary/30 transition-colors"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 flex-shrink-0">
                          <Clock className="h-5 w-5 text-primary" />
                        </div>

                        <div>
                          <p className="font-bold text-foreground text-lg">
                            {classInfo.day}
                          </p>

                          <p className="text-sm text-muted-foreground">
                            {classInfo.schedule}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className="text-2xl font-bold text-primary">
                            {classStudents.length}
                          </p>

                          <p className="text-xs text-muted-foreground">
                            alunos
                          </p>
                        </div>

                        <span className="text-xs px-3 py-1.5 rounded-full bg-primary/10 text-primary font-medium">
                          {classInfo.day}
                        </span>
                      </div>
                    </div>

                    <div className="mt-3 pt-3 border-t border-primary/10">
                      <p className="text-xs text-muted-foreground mb-2">
                        Alunos nesta turma:
                      </p>

                      <div className="flex flex-wrap gap-1">
                        {classStudents.slice(0, 5).map((student) => (
                          <span
                            key={student.id}
                            className="text-xs px-2 py-1 rounded bg-card border"
                          >
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