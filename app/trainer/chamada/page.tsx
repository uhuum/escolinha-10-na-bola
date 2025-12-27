"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/contexts/auth-context"
import { useCoaches } from "@/lib/hooks/use-coaches"
import { useStudents } from "@/lib/hooks/use-students"
import { useAttendance } from "@/lib/hooks/use-attendance"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { CheckCircle2, XCircle, AlertCircle, Clock } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import type { ClassSchedule, AttendanceRecord, WeekDay } from "@/lib/types"
import { useToast } from "@/hooks/use-toast"
import Image from "next/image"
import { getTodayDateString } from "@/lib/utils/date"
import { LoadingStudents } from "@/components/loading-students"

function getDayOfWeekInPortuguese(date: Date): string {
  const days = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"]
  return days[date.getDay()]
}

export default function TrainerChamadaPage() {
  const { user } = useAuth()
  const { getCoachClasses } = useCoaches()
  const { students, isLoading: studentsLoading } = useStudents()
  const { addAttendance, attendances, isLoading: attendanceLoading } = useAttendance()
  const { toast } = useToast()

  const [todayAttendanceSchedules, setTodayAttendanceSchedules] = useState<Set<string>>(new Set())
  const [trainerName, setTrainerName] = useState("")
  const [selectedDay, setSelectedDay] = useState<WeekDay | "">("")
  const [selectedSchedule, setSelectedSchedule] = useState<ClassSchedule | "">("")
  const [attendanceRecords, setAttendanceRecords] = useState<Record<string, "Presente" | "Ausente">>({})
  const [showAttendanceModal, setShowAttendanceModal] = useState(false)

  const coachClasses = user?.id ? getCoachClasses(user.id) : []
  const today = getTodayDateString()
  const todayDayOfWeek = getDayOfWeekInPortuguese(new Date()) as WeekDay

  useEffect(() => {
    if (user?.name && !trainerName) {
      setTrainerName(user.name)
    }
  }, [user?.name, trainerName])

  useEffect(() => {
    const todayAttendances = attendances.filter((att) => att.date === today)
    const schedulesWithAttendance = new Set(todayAttendances.map((att) => att.classSchedule))
    setTodayAttendanceSchedules(schedulesWithAttendance)
  }, [attendances, today])

  const filteredStudents =
    selectedDay && selectedSchedule
      ? students.filter((s) => {
          if (!s.isActive) return false

          if (s.scheduleConfigs && s.scheduleConfigs.length > 0) {
            return s.scheduleConfigs.some(
              (config) => config.schedule === selectedSchedule && config.day === selectedDay,
            )
          }

          if (s.classSchedule !== selectedSchedule) return false
          if (!s.classDays || s.classDays.length === 0) return false
          return s.classDays.includes(selectedDay)
        })
      : []

  const scheduleAlreadyAttended =
    selectedSchedule &&
    selectedDay &&
    attendances.some(
      (att) => att.date === today && att.classSchedule === selectedSchedule && att.dayOfWeek === selectedDay,
    )

  const canStartAttendance = trainerName.trim() && selectedDay && selectedSchedule && !scheduleAlreadyAttended

  const handleToggleAttendance = (studentId: string) => {
    setAttendanceRecords((prev) => ({
      ...prev,
      [studentId]: prev[studentId] === "Presente" ? "Ausente" : "Presente",
    }))
  }

  const handleStartAttendance = () => {
    if (!canStartAttendance) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos antes de começar",
        variant: "destructive",
      })
      return
    }

    if (filteredStudents.length === 0) {
      toast({
        title: "Erro",
        description:
          "Não há alunos nesta turma para o dia selecionado. Verifique se os alunos foram cadastrados com a turma e horário corretos.",
        variant: "destructive",
      })
      return
    }

    const initialRecords: Record<string, "Presente" | "Ausente"> = {}
    filteredStudents.forEach((student) => {
      initialRecords[student.id] = "Ausente"
    })
    setAttendanceRecords(initialRecords)
    setShowAttendanceModal(true)
  }

  const handleSubmitAttendance = async () => {
    const records: AttendanceRecord[] = filteredStudents.map((student) => ({
      studentId: student.id,
      status: attendanceRecords[student.id] || "Ausente",
    }))

    try {
      await addAttendance(
        selectedSchedule as ClassSchedule,
        [selectedDay as WeekDay],
        trainerName,
        user?.id || "", // trainerId
        records,
        selectedDay as WeekDay,
      )

      toast({
        title: "Sucesso!",
        description: `Chamada de ${selectedDay} às ${selectedSchedule} registrada.`,
      })

      setAttendanceRecords({})
      setTrainerName(user?.name || "")
      setSelectedDay("")
      setSelectedSchedule("")
      setShowAttendanceModal(false)
    } catch (error) {
      console.error("[v0] Failed to record attendance:", error)
      toast({
        title: "Erro ao registrar chamada",
        description: "Tente novamente ou contate o administrador.",
        variant: "destructive",
      })
    }
  }

  const presentCount = Object.values(attendanceRecords).filter((status) => status === "Presente").length
  const absentCount = Object.values(attendanceRecords).filter((status) => status === "Ausente").length

  if (studentsLoading || attendanceLoading) {
    return <LoadingStudents message="Carregando chamada..." />
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">Chamada do Dia</h1>
        <p className="text-muted-foreground">Registre a presença dos alunos em tempo real</p>
      </div>

      <Card className="border-2 bg-accent/5">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="h-5 w-5 text-accent" />
            Horários das Turmas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3 rounded-lg border bg-card">
              <p className="font-semibold text-foreground mb-1">Primeiro Horário</p>
              <p className="text-sm text-muted-foreground">18h00 até 19h30</p>
            </div>
            <div className="p-3 rounded-lg border bg-card">
              <p className="font-semibold text-foreground mb-1">Segundo Horário</p>
              <p className="text-sm text-muted-foreground">19h30 até 21h00</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-2">
        <CardHeader>
          <CardTitle>Iniciar Chamada</CardTitle>
          <CardDescription>Preencha os dados abaixo para começar o registro de presença</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="trainer-name" className="text-base font-semibold">
              Nome do Treinador *
            </Label>
            <Input
              id="trainer-name"
              placeholder="Digite seu nome..."
              value={trainerName}
              onChange={(e) => setTrainerName(e.target.value)}
              className="h-11"
              disabled={showAttendanceModal}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="day-select" className="text-base font-semibold">
                Dia da Semana *
              </Label>
              <Select
                value={selectedDay}
                onValueChange={(value) => setSelectedDay(value as WeekDay)}
                disabled={showAttendanceModal}
              >
                <SelectTrigger id="day-select" className="h-11">
                  <SelectValue placeholder="Selecione o dia" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Segunda">Segunda-feira</SelectItem>
                  <SelectItem value="Terça">Terça-feira</SelectItem>
                  <SelectItem value="Quarta">Quarta-feira</SelectItem>
                  <SelectItem value="Quinta">Quinta-feira</SelectItem>
                  <SelectItem value="Sexta">Sexta-feira</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="schedule-select" className="text-base font-semibold">
                Horário *
              </Label>
              <Select
                value={selectedSchedule}
                onValueChange={(value) => setSelectedSchedule(value as ClassSchedule)}
                disabled={showAttendanceModal}
              >
                <SelectTrigger id="schedule-select" className="h-11">
                  <SelectValue placeholder="Selecione o horário" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="18:00-19:30">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      <span>18h00 até 19h30</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="19:30-21:00">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      <span>19h30 até 21h00</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {selectedDay && selectedSchedule && (
            <div className="p-4 rounded-lg bg-primary/5 border">
              <p className="text-sm">
                <span className="font-semibold text-foreground">{filteredStudents.length}</span> aluno(s) encontrado(s)
                para {selectedDay} às {selectedSchedule}
              </p>
            </div>
          )}

          {scheduleAlreadyAttended && (
            <Alert className="border-yellow-200 bg-yellow-50 dark:bg-yellow-950">
              <AlertCircle className="h-4 w-4 text-yellow-600" />
              <AlertDescription className="text-yellow-800 dark:text-yellow-200">
                Já existe uma chamada registrada para esta turma hoje. Acesse o Relatório de Presenças para editar.
              </AlertDescription>
            </Alert>
          )}

          {!showAttendanceModal && (
            <Button
              onClick={handleStartAttendance}
              size="lg"
              disabled={!canStartAttendance}
              className="w-full md:w-auto"
            >
              Fazer Chamada
            </Button>
          )}
        </CardContent>
      </Card>

      {showAttendanceModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <Card className="w-full max-w-2xl my-8 border-2 max-h-[90vh] overflow-y-auto">
            <CardHeader className="sticky top-0 bg-card z-10 border-b">
              <CardTitle>
                {selectedDay} - {selectedSchedule}
              </CardTitle>
              <CardDescription>Marque a presença dos alunos clicando nos seus nomes</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 py-6">
              <div className="grid grid-cols-3 gap-3 mb-6 sticky top-16 bg-card z-10 pb-4 border-b">
                <div className="text-center p-3 rounded-lg bg-primary/10">
                  <p className="text-2xl font-bold text-primary">{filteredStudents.length}</p>
                  <p className="text-xs text-muted-foreground">Total</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-green-100 dark:bg-green-950">
                  <p className="text-2xl font-bold text-green-600">{presentCount}</p>
                  <p className="text-xs text-muted-foreground">Presentes</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-red-100 dark:bg-red-950">
                  <p className="text-2xl font-bold text-red-600">{absentCount}</p>
                  <p className="text-xs text-muted-foreground">Ausentes</p>
                </div>
              </div>

              <div className="space-y-3">
                {filteredStudents.map((student) => {
                  const status = attendanceRecords[student.id]
                  const isPresent = status === "Presente"
                  const isAbsent = status === "Ausente"

                  return (
                    <div
                      key={student.id}
                      onClick={() => handleToggleAttendance(student.id)}
                      className={`flex items-center gap-4 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                        isPresent
                          ? "border-green-500 bg-green-50 dark:bg-green-950"
                          : isAbsent
                            ? "border-red-500 bg-red-50 dark:bg-red-950"
                            : "border-border hover:border-primary"
                      }`}
                    >
                      <div className="relative h-16 w-16 rounded-full overflow-hidden flex-shrink-0 bg-primary/10 border-2 border-primary/20">
                        <Image
                          src={student.photo || "/placeholder.svg?height=64&width=64&query=student"}
                          alt={student.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-foreground truncate">{student.name}</p>
                      </div>

                      <div>
                        {isPresent && (
                          <Badge className="bg-green-600 hover:bg-green-700 whitespace-nowrap">
                            <CheckCircle2 className="h-4 w-4 mr-1" />
                            Presente
                          </Badge>
                        )}
                        {isAbsent && (
                          <Badge variant="destructive" className="whitespace-nowrap">
                            <XCircle className="h-4 w-4 mr-1" />
                            Ausente
                          </Badge>
                        )}
                        {!status && <Badge variant="outline">Não marcado</Badge>}
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
            <div className="flex flex-col sm:flex-row gap-3 p-6 border-t sticky bottom-0 bg-card">
              <Button onClick={handleSubmitAttendance} size="lg" className="flex-1">
                Registrar Chamada
              </Button>
              <Button
                onClick={() => {
                  setShowAttendanceModal(false)
                  setAttendanceRecords({})
                }}
                variant="outline"
                size="lg"
                className="flex-1"
              >
                Cancelar
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
