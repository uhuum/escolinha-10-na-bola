"use client"

import { useAuth } from "@/lib/contexts/auth-context"
import { useCoaches } from "@/lib/hooks/use-coaches"
import { useStudents } from "@/lib/hooks/use-students"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Users, ClipboardCheck, BarChart3, BookOpen, ArrowRight, Calendar } from "lucide-react"
import Link from "next/link"

export default function TrainerDashboardPage() {
  const { user } = useAuth()
  const { getCoachClasses } = useCoaches()
  const { students } = useStudents()

  const coachClasses = user?.id ? getCoachClasses(user.id) : []

  const coachStudents = students.filter(
    (s) =>
      s.isActive &&
      coachClasses.some(
        (classInfo) =>
          s.classSchedule === classInfo.schedule && s.classDays?.some((day) => classInfo.days.includes(day)),
      ),
  )

  const totalStudents = coachStudents.length
  const classCount = coachClasses.length

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
            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">Turmas</CardTitle>
            <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-lg bg-primary/10">
              <BookOpen className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
            </div>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0">
            <div className="text-3xl sm:text-4xl font-bold text-foreground mb-1">{classCount}</div>
            <p className="text-xs sm:text-sm text-muted-foreground">Sob sua responsabilidade</p>
            <div className="mt-4 space-y-2">
              {coachClasses.map((classInfo, idx) => (
                <div key={idx} className="text-xs p-2 bg-primary/5 rounded border border-primary/20">
                  <p className="font-semibold">{classInfo.schedule}</p>
                  <p className="text-muted-foreground">{classInfo.days.join(", ")}</p>
                  <p className="text-primary font-bold mt-1">
                    {
                      students.filter(
                        (s) =>
                          s.isActive &&
                          s.classSchedule === classInfo.schedule &&
                          s.classDays?.some((d) => classInfo.days.includes(d)),
                      ).length
                    }{" "}
                    alunos
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 hover:border-accent/50 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between pb-2 sm:pb-3 p-4 sm:p-6">
            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">Alunos</CardTitle>
            <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-lg bg-accent/10">
              <Users className="h-4 w-4 sm:h-5 sm:w-5 text-accent" />
            </div>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0">
            <div className="text-3xl sm:text-4xl font-bold text-foreground mb-1">{totalStudents}</div>
            <p className="text-xs sm:text-sm text-muted-foreground">Alunos ativos nas suas turmas</p>
            <div className="mt-4 text-xs text-muted-foreground space-y-1">
              <p>Total de alunos da Escolinha: {students.filter((s) => s.isActive).length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-2">
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-lg bg-accent/10">
              <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-accent" />
            </div>
            Suas Turmas
          </CardTitle>
          <CardDescription className="text-sm sm:text-base">Horários e dias da semana</CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-0">
          {coachClasses.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma turma atribuída</p>
          ) : (
            <div className="space-y-3">
              {coachClasses.map((classInfo, index) => (
                <div
                  key={index}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors gap-2"
                >
                  <div>
                    <p className="font-semibold text-foreground">{classInfo.schedule}</p>
                    <p className="text-sm text-muted-foreground">{classInfo.days.join(", ")}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs px-3 py-1 rounded-full bg-primary/10 text-primary">
                      {classInfo.days.length} dias
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-2">
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-lg bg-primary/10">
              <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
            </div>
            Ações Rápidas
          </CardTitle>
          <CardDescription className="text-sm sm:text-base">
            Acesso às principais funcionalidades do treinador
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-0">
          <div className="space-y-3">
            <Button asChild className="w-full justify-between h-auto py-3 sm:py-4 px-4 sm:px-5 text-sm sm:text-base">
              <Link href="/trainer/carometro">
                <span className="flex items-center gap-2 sm:gap-3">
                  <BookOpen className="h-4 w-4 sm:h-5 sm:w-5" />
                  <span className="font-semibold">Visualizar Carômetro</span>
                </span>
                <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </Link>
            </Button>
            <Button
              asChild
              className="w-full justify-between h-auto py-3 sm:py-4 px-4 sm:px-5 bg-transparent text-sm sm:text-base"
              variant="outline"
            >
              <Link href="/trainer/chamada">
                <span className="flex items-center gap-2 sm:gap-3">
                  <ClipboardCheck className="h-4 w-4 sm:h-5 sm:w-5" />
                  <span className="font-semibold">Fazer Chamada</span>
                </span>
                <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </Link>
            </Button>
            <Button
              asChild
              className="w-full justify-between h-auto py-3 sm:py-4 px-4 sm:px-5 bg-transparent text-sm sm:text-base"
              variant="outline"
            >
              <Link href="/trainer/relatorio">
                <span className="flex items-center gap-2 sm:gap-3">
                  <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5" />
                  <span className="font-semibold">Relatório de Presenças</span>
                </span>
                <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
