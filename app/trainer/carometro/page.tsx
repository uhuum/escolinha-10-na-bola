"use client"

import { useState } from "react"
import { useAuth } from "@/lib/contexts/auth-context"
import { useCoaches } from "@/lib/hooks/use-coaches"
import { useStudents } from "@/lib/hooks/use-students"
import { useAttendance } from "@/lib/hooks/use-attendance"
import { Card, CardContent } from "@/components/ui/card"
import { Clock, Search, X, Calendar } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import type { ClassSchedule, WeekDay } from "@/lib/types"
import Image from "next/image"
import { LoadingStudents } from "@/components/loading-students"

function calculateAge(birthDate: string): number {
  const birth = new Date(birthDate)
  const today = new Date()
  let age = today.getFullYear() - birth.getFullYear()
  const monthDiff = today.getMonth() - birth.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--
  }
  return age
}

interface StudentModalProps {
  student: any
  onClose: () => void
  attendanceHistory: any[]
}

function StudentDetailModal({ student, onClose, attendanceHistory }: StudentModalProps) {
  const age = calculateAge(student.birthDate)

  const totalAbsences = attendanceHistory.reduce((sum, att) => {
    const record = att.records.find((r: any) => r.studentId === student.id)
    return sum + (record?.status === "Ausente" ? 1 : 0)
  }, 0)

  const totalPresences = attendanceHistory.reduce((sum, att) => {
    const record = att.records.find((r: any) => r.studentId === student.id)
    return sum + (record?.status === "Presente" ? 1 : 0)
  }, 0)

  const totalSessions = totalAbsences + totalPresences
  const attendancePercentage = totalSessions > 0 ? Math.round((totalPresences / totalSessions) * 100) : 0

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl border-2 max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-card z-10 p-4 sm:p-6 border-b flex items-center justify-between">
          <h2 className="text-lg sm:text-2xl font-bold text-foreground">Detalhes do Aluno</h2>
          <button onClick={onClose} className="p-1 hover:bg-muted rounded-lg transition-colors">
            <X className="h-6 w-6" />
          </button>
        </div>

        <CardContent className="p-4 sm:p-6 space-y-6">
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 items-start sm:items-center pb-6 border-b">
            <div className="relative h-32 w-32 rounded-lg overflow-hidden bg-primary/10 border-2 border-primary/20 flex-shrink-0">
              <Image
                src={student.photo || "/placeholder.svg?height=128&width=128&query=student"}
                alt={student.name}
                fill
                className="object-cover"
              />
            </div>
            <div className="flex-1 space-y-3">
              <div>
                <h3 className="text-2xl sm:text-3xl font-bold text-foreground">{student.name}</h3>
                <p className="text-sm text-muted-foreground">{student.responsible}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary">{age} anos</span>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <p className="font-semibold text-foreground">Horários de Aula</p>
            {student.scheduleConfigs && student.scheduleConfigs.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {student.scheduleConfigs.map((config: any, index: number) => (
                  <div key={index} className="p-3 rounded-lg bg-accent/5 border border-accent/20">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-primary" />
                      <span className="font-medium">{config.schedule}</span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{config.day}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-accent/5 border border-accent/20">
                  <p className="text-xs text-muted-foreground mb-1 font-medium">Turma</p>
                  <p className="text-lg font-semibold text-foreground">{student.classSchedule}</p>
                </div>
                <div className="p-4 rounded-lg bg-accent/5 border border-accent/20">
                  <p className="text-xs text-muted-foreground mb-1 font-medium">Dias da Semana</p>
                  <p className="text-lg font-semibold text-foreground">{student.classDays?.join(", ") || "N/A"}</p>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-3">
            <p className="font-semibold text-foreground">Histórico de Presenças</p>
            <div className="grid grid-cols-3 gap-3">
              <div className="p-4 rounded-lg bg-green-100 dark:bg-green-950 text-center">
                <p className="text-3xl font-bold text-green-600">{totalPresences}</p>
                <p className="text-xs text-green-800 dark:text-green-200 mt-1">Presentes</p>
              </div>
              <div className="p-4 rounded-lg bg-red-100 dark:bg-red-950 text-center">
                <p className="text-3xl font-bold text-red-600">{totalAbsences}</p>
                <p className="text-xs text-red-800 dark:text-red-200 mt-1">Ausentes</p>
              </div>
              <div className="p-4 rounded-lg bg-blue-100 dark:bg-blue-950 text-center">
                <p className="text-3xl font-bold text-blue-600">{attendancePercentage}%</p>
                <p className="text-xs text-blue-800 dark:text-blue-200 mt-1">Frequência</p>
              </div>
            </div>
          </div>

          <div className="space-y-3 pt-4 border-t">
            <p className="font-semibold text-foreground">Contato</p>
            <div className="space-y-2 text-sm">
              <p>
                <span className="font-medium">Email:</span> {student.responsibleEmail || "N/A"}
              </p>
              <p>
                <span className="font-medium">Telefone Pai:</span> {student.fatherPhone || "N/A"}
              </p>
              <p>
                <span className="font-medium">Telefone Mãe:</span> {student.motherPhone || "N/A"}
              </p>
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t">
            <Button onClick={onClose} variant="outline" className="flex-1 bg-transparent">
              Fechar
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function TrainerCarometroPage() {
  const { user } = useAuth()
  const { getCoachClasses } = useCoaches()
  const { students, isLoading } = useStudents()
  const { getStudentAttendanceHistory } = useAttendance()

  const coachClasses = user?.id ? getCoachClasses(user.id) : []
  const activeStudents = students.filter((s) => s.isActive)

  const [selectedSchedule, setSelectedSchedule] = useState<ClassSchedule | "all">("all")
  const [selectedDay, setSelectedDay] = useState<WeekDay | "all">("all")
  const [nameFilter, setNameFilter] = useState("")
  const [selectedStudent, setSelectedStudent] = useState<any>(null)

  if (isLoading) {
    return <LoadingStudents message="Carregando carômetro..." />
  }

  const filteredStudents = activeStudents.filter((student) => {
    const matchesName = nameFilter === "" || student.name.toLowerCase().includes(nameFilter.toLowerCase())

    if (!matchesName) return false

    if (selectedSchedule === "all" && selectedDay === "all") return true

    if (student.scheduleConfigs && student.scheduleConfigs.length > 0) {
      return student.scheduleConfigs.some((config) => {
        const matchesSchedule = selectedSchedule === "all" || config.schedule === selectedSchedule
        const matchesDay = selectedDay === "all" || config.day === selectedDay
        return matchesSchedule && matchesDay
      })
    }

    const matchesSchedule = selectedSchedule === "all" || student.classSchedule === selectedSchedule
    const matchesDay = selectedDay === "all" || (student.classDays && student.classDays.includes(selectedDay))
    return matchesSchedule && matchesDay
  })

  const uniqueSchedules: ClassSchedule[] = Array.from(
    new Set(activeStudents.filter((s) => s.classSchedule).map((s) => s.classSchedule as ClassSchedule)),
  )

  const days: WeekDay[] = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta"]

  return (
    <div className="space-y-6 sm:space-y-8">
      <div>
        <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-2 text-balance">Carômetro</h1>
        <p className="text-base sm:text-lg text-muted-foreground">Visualização de todos os alunos da escolinha</p>
      </div>

      {coachClasses.length > 0 && (
        <Card className="border-2 bg-accent/5">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-start gap-3 mb-4">
              <Calendar className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-foreground mb-1">Suas Turmas</h3>
                <p className="text-sm text-muted-foreground">Horários e dias que você treina</p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {coachClasses.map((classInfo, index) => (
                <div key={index} className="p-3 rounded-lg border bg-card">
                  <p className="font-semibold text-foreground flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    {classInfo.schedule}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">{classInfo.days.join(", ")}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="space-y-2">
          <label className="text-sm font-medium">Horário</label>
          <Select
            value={selectedSchedule}
            onValueChange={(value) => setSelectedSchedule(value as ClassSchedule | "all")}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Selecione o horário" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Horários</SelectItem>
              {uniqueSchedules.map((schedule) => (
                <SelectItem key={schedule} value={schedule}>
                  {schedule}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Dia da Semana</label>
          <Select value={selectedDay} onValueChange={(value) => setSelectedDay(value as WeekDay | "all")}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Selecione o dia" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Dias</SelectItem>
              {days.map((day) => (
                <SelectItem key={day} value={day}>
                  {day}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Buscar por Nome</label>
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Digite o nome do aluno..."
              value={nameFilter}
              onChange={(e) => setNameFilter(e.target.value)}
              className="pl-9"
            />
            {nameFilter && (
              <button
                onClick={() => setNameFilter("")}
                className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="mb-6">
        <p className="text-sm text-muted-foreground">Mostrando {filteredStudents.length} aluno(s)</p>
      </div>

      <div className="grid gap-4 sm:gap-6 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {filteredStudents.map((student) => {
          const age = calculateAge(student.birthDate)
          return (
            <div key={student.id} onClick={() => setSelectedStudent(student)}>
              <Card className="hover:shadow-lg transition-shadow border-2 cursor-pointer h-full hover:border-primary">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex flex-col items-center text-center space-y-3 sm:space-y-4">
                    <div className="relative h-24 w-24 sm:h-32 sm:w-32 rounded-full overflow-hidden bg-primary/10 border-4 border-primary/20">
                      <Image
                        src={student.photo || "/placeholder.svg?height=128&width=128&query=student+soccer"}
                        alt={student.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="space-y-2 w-full">
                      <h3 className="font-bold text-foreground text-base sm:text-lg leading-tight">{student.name}</h3>
                      <div className="space-y-1 pt-2 border-t">
                        <p className="text-xs sm:text-sm text-muted-foreground">
                          <span className="font-semibold">{age} anos</span>
                        </p>
                        {student.scheduleConfigs && student.scheduleConfigs.length > 0 ? (
                          <div className="flex flex-wrap gap-1 justify-center">
                            {student.scheduleConfigs.map((config, idx) => (
                              <span key={idx} className="text-xs px-2 py-0.5 rounded-full bg-accent/10 text-accent">
                                {config.day.slice(0, 3)} {config.schedule.split("-")[0]}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <>
                            {student.classDays && student.classDays.length > 0 && (
                              <div className="flex flex-wrap gap-1 justify-center">
                                {student.classDays.map((day) => (
                                  <span key={day} className="text-xs px-2 py-0.5 rounded-full bg-accent/10 text-accent">
                                    {day}
                                  </span>
                                ))}
                              </div>
                            )}
                            <div className="flex items-center justify-center gap-1 sm:gap-2 text-xs sm:text-sm">
                              <Clock className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-primary" />
                              <span className="font-medium text-foreground">{student.classSchedule}</span>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )
        })}

        {filteredStudents.length === 0 && (
          <div className="col-span-full">
            <Card className="border-2">
              <CardContent className="p-12 text-center">
                <h3 className="text-lg font-semibold text-foreground mb-2">Nenhum aluno encontrado</h3>
                <p className="text-muted-foreground">Não há alunos cadastrados com os filtros selecionados</p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {selectedStudent && (
        <StudentDetailModal
          student={selectedStudent}
          onClose={() => setSelectedStudent(null)}
          attendanceHistory={getStudentAttendanceHistory(selectedStudent.id)}
        />
      )}
    </div>
  )
}
