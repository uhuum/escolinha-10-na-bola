"use client"

import { useState, useEffect, useCallback } from "react"
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
import { CheckCircle2, XCircle, AlertCircle, Clock, UserCheck } from "lucide-react"
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
  const [trainerConfirmed, setTrainerConfirmed] = useState(false)
  const [selectedDay, setSelectedDay] = useState<WeekDay | "">("")
  const [selectedSchedule, setSelectedSchedule] = useState<ClassSchedule | "">("")
  const [attendanceRecords, setAttendanceRecords] = useState<Record<string, "Presente" | "Ausente">>({})
  const [showAttendanceModal, setShowAttendanceModal] = useState(false)

  const coachClasses = user?.id ? getCoachClasses(user.id) : []
  const today = getTodayDateString()
  const todayDayOfWeek = getDayOfWeekInPortuguese(new Date()) as WeekDay

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

  const canStartAttendance =
    trainerConfirmed && trainerName.trim() && selectedDay && selectedSchedule && !scheduleAlreadyAttended

  const handleToggleAttendance = useCallback((studentId: string) => {
    setAttendanceRecords((prev) => ({
      ...prev,
      [studentId]: prev[studentId] === "Presente" ? "Ausente" : "Presente",
    }))
  }, [])

  const handleConfirmTrainer = () => {
    if (trainerName.trim().length < 2) {
      toast({
        title: "Nome inválido",
        description: "Digite um nome válido para continuar",
        variant: "destructive",
      })
      return
    }
    setTrainerConfirmed(true)
    toast({
      title: "Treinador confirmado",
      description: `Bem-vindo, ${trainerName}!`,
    })
  }

  const handleStartAttendance = () => {
    if (!trainerConfirmed) {
      toast({
        title: "Erro",
        description: "Confirme seu nome de treinador antes de começar",
        variant: "destructive",
      })
      return
    }

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
        user?.id || "",
        records,
        selectedDay as WeekDay,
      )

      toast({
        title: "Sucesso!",
        description: `Chamada de ${selectedDay} às ${selectedSchedule} registrada por ${trainerName}.`,
      })

      setAttendanceRecords({})
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
    <div className="space-y-4 sm:space-y-6 max-w-5xl mx-auto px-2 sm:px-0">
      <div>
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-2">Chamada do Dia</h1>
        <p className="text-sm sm:text-base text-muted-foreground">Registre a presença dos alunos em tempo real</p>
      </div>

      <Card className="border-2 bg-accent/5">
        <CardHeader className="pb-3 p-3 sm:p-6">
          <CardTitle className="text-sm sm:text-base flex items-center gap-2">
            <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-accent" />
            Horários das Turmas
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 sm:p-6 pt-0">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
            <div className="p-2 sm:p-3 rounded-lg border bg-card">
              <p className="font-semibold text-sm sm:text-base text-foreground mb-1">Primeiro Horário</p>
              <p className="text-xs sm:text-sm text-muted-foreground">18h00 até 19h30</p>
            </div>
            <div className="p-2 sm:p-3 rounded-lg border bg-card">
              <p className="font-semibold text-sm sm:text-base text-foreground mb-1">Segundo Horário</p>
              <p className="text-xs sm:text-sm text-muted-foreground">19h30 até 21h00</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-2">
        <CardHeader className="p-3 sm:p-6">
          <CardTitle className="text-base sm:text-lg">Iniciar Chamada</CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            Preencha os dados abaixo para começar o registro de presença
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 sm:space-y-6 p-3 sm:p-6 pt-0">
          <div className="space-y-2">
            <Label htmlFor="trainer-name" className="text-sm sm:text-base font-semibold flex items-center gap-2">
              <UserCheck className="h-4 w-4" />
              Nome do Treinador *
            </Label>
            <div className="flex gap-2">
              <Input
                id="trainer-name"
                placeholder="Digite seu nome..."
                value={trainerName}
                onChange={(e) => {
                  setTrainerName(e.target.value)
                  if (trainerConfirmed) setTrainerConfirmed(false)
                }}
                className="h-10 sm:h-11 text-sm sm:text-base flex-1"
                disabled={showAttendanceModal}
              />
              {!trainerConfirmed && (
                <Button
                  onClick={handleConfirmTrainer}
                  disabled={!trainerName.trim() || showAttendanceModal}
                  className="h-10 sm:h-11 px-3 sm:px-4"
                >
                  Confirmar
                </Button>
              )}
            </div>
            {trainerConfirmed && (
              <p className="text-xs sm:text-sm text-green-600 flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3 sm:h-4 sm:w-4" />
                Treinador confirmado: {trainerName}
              </p>
            )}
            {!trainerConfirmed && (
              <p className="text-xs text-muted-foreground">Confirme seu nome para poder fazer a chamada</p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div className="space-y-2">
              <Label htmlFor="day-select" className="text-sm sm:text-base font-semibold">
                Dia da Semana *
              </Label>
              <Select
                value={selectedDay}
                onValueChange={(value) => setSelectedDay(value as WeekDay)}
                disabled={showAttendanceModal || !trainerConfirmed}
              >
                <SelectTrigger id="day-select" className="h-10 sm:h-11 text-sm sm:text-base">
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
              <Label htmlFor="schedule-select" className="text-sm sm:text-base font-semibold">
                Horário *
              </Label>
              <Select
                value={selectedSchedule}
                onValueChange={(value) => setSelectedSchedule(value as ClassSchedule)}
                disabled={showAttendanceModal || !trainerConfirmed}
              >
                <SelectTrigger id="schedule-select" className="h-10 sm:h-11 text-sm sm:text-base">
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
            <div className="p-3 sm:p-4 rounded-lg bg-primary/5 border">
              <p className="text-xs sm:text-sm">
                <span className="font-semibold text-foreground">{filteredStudents.length}</span> aluno(s) encontrado(s)
                para {selectedDay} às {selectedSchedule}
              </p>
            </div>
          )}

          {scheduleAlreadyAttended && (
            <Alert className="border-yellow-200 bg-yellow-50 dark:bg-yellow-950">
              <AlertCircle className="h-4 w-4 text-yellow-600" />
              <AlertDescription className="text-xs sm:text-sm text-yellow-800 dark:text-yellow-200">
                Já existe uma chamada registrada para esta turma hoje. Acesse o Relatório de Presenças para editar.
              </AlertDescription>
            </Alert>
          )}

          {!trainerConfirmed && !showAttendanceModal && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-xs sm:text-sm">
                Confirme seu nome de treinador para habilitar a chamada.
              </AlertDescription>
            </Alert>
          )}

          {!showAttendanceModal && (
            <Button
              onClick={handleStartAttendance}
              size="lg"
              disabled={!canStartAttendance}
              className="w-full text-sm sm:text-base h-10 sm:h-11"
            >
              Fazer Chamada
            </Button>
          )}
        </CardContent>
      </Card>

      {showAttendanceModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4 overflow-y-auto">
          <Card className="w-full max-w-2xl my-4 sm:my-8 border-2 max-h-[95vh] sm:max-h-[90vh] overflow-hidden flex flex-col">
            <CardHeader className="sticky top-0 bg-card z-10 border-b p-3 sm:p-6">
              <CardTitle className="text-base sm:text-lg">
                {selectedDay} - {selectedSchedule}
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Treinador: <span className="font-medium">{trainerName}</span> | Marque a presença clicando nos nomes
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 sm:space-y-4 py-4 sm:py-6 px-3 sm:px-6 flex-1 overflow-y-auto">
              <div className="grid grid-cols-3 gap-2 sm:gap-3 sticky top-0 bg-card z-10 pb-3 sm:pb-4 border-b">
                <div className="text-center p-2 sm:p-3 rounded-lg bg-primary/10">
                  <p className="text-lg sm:text-2xl font-bold text-primary">{filteredStudents.length}</p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">Total</p>
                </div>
                <div className="text-center p-2 sm:p-3 rounded-lg bg-green-100 dark:bg-green-950">
                  <p className="text-lg sm:text-2xl font-bold text-green-600">{presentCount}</p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">Presentes</p>
                </div>
                <div className="text-center p-2 sm:p-3 rounded-lg bg-red-100 dark:bg-red-950">
                  <p className="text-lg sm:text-2xl font-bold text-red-600">{absentCount}</p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">Ausentes</p>
                </div>
              </div>

              <div className="space-y-2 sm:space-y-3">
                {filteredStudents.map((student) => {
                  const status = attendanceRecords[student.id]
                  const isPresent = status === "Presente"
                  const isAbsent = status === "Ausente"

                  return (
                    <div
                      key={student.id}
                      onClick={() => handleToggleAttendance(student.id)}
                      className={`flex items-center gap-2 sm:gap-4 p-2 sm:p-4 rounded-lg border-2 cursor-pointer transition-all ${
                        isPresent
                          ? "border-green-500 bg-green-50 dark:bg-green-950"
                          : isAbsent
                            ? "border-red-500 bg-red-50 dark:bg-red-950"
                            : "border-border hover:border-primary"
                      }`}
                    >
                      <div className="relative h-10 w-10 sm:h-16 sm:w-16 rounded-full overflow-hidden flex-shrink-0 bg-primary/10 border-2 border-primary/20">
                        <Image
                          src={student.photo || "/placeholder.svg?height=64&width=64&query=student"}
                          alt={student.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm sm:text-base text-foreground truncate">{student.name}</p>
                      </div>

                      <div className="flex-shrink-0">
                        {isPresent && (
                          <Badge className="bg-green-600 hover:bg-green-700 text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 sm:py-1">
                            <CheckCircle2 className="h-3 w-3 sm:h-4 sm:w-4 mr-0.5 sm:mr-1" />
                            <span className="hidden xs:inline">Presente</span>
                          </Badge>
                        )}
                        {isAbsent && (
                          <Badge variant="destructive" className="text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 sm:py-1">
                            <XCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-0.5 sm:mr-1" />
                            <span className="hidden xs:inline">Ausente</span>
                          </Badge>
                        )}
                        {!status && (
                          <Badge variant="outline" className="text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 sm:py-1">
                            ...
                          </Badge>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 p-3 sm:p-6 border-t sticky bottom-0 bg-card">
              <Button onClick={handleSubmitAttendance} size="lg" className="flex-1 text-sm sm:text-base h-10 sm:h-11">
                Registrar Chamada
              </Button>
              <Button
                onClick={() => {
                  setShowAttendanceModal(false)
                  setAttendanceRecords({})
                }}
                variant="outline"
                size="lg"
                className="flex-1 text-sm sm:text-base h-10 sm:h-11"
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
