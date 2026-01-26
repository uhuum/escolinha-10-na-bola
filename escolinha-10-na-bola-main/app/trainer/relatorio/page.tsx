"use client"

import { useState } from "react"
import { useAuth } from "@/lib/contexts/auth-context"
import { useCoaches } from "@/lib/hooks/use-coaches"
import { useAttendance } from "@/lib/hooks/use-attendance"
import { useStudents } from "@/lib/hooks/use-students"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Users, Calendar, Edit2, AlertTriangle, Filter, BarChart3, Lock } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { AttendanceEditDialog } from "@/components/attendance-edit-dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import type { Attendance } from "@/lib/types"
import { useToast } from "@/hooks/use-toast"
import { LoadingStudents } from "@/components/loading-students"
import { canEditAttendance, getEditDisabledReason } from "@/lib/utils/attendance-permissions"

export default function TrainerRelatorioPage() {
  const { user } = useAuth()
  const { getCoachClasses } = useCoaches()
  const { attendances, updateAttendance, deleteAttendance, isLoading: attendanceLoading } = useAttendance()
  const { students, isLoading: studentsLoading } = useStudents()
  const { toast } = useToast()
  const [editingSession, setEditingSession] = useState<Attendance | null>(null)
  const [filterViolationsOnly, setFilterViolationsOnly] = useState(false)
  const [filterStudent, setFilterStudent] = useState("")
  const [filterMonth, setFilterMonth] = useState("")

  const coachClasses = user?.id ? getCoachClasses(user.id) : []
  const availableSchedules = coachClasses.map((c) => c.schedule)

  if (studentsLoading || attendanceLoading) {
    return <LoadingStudents message="Carregando relatório..." />
  }

  const coachAttendances = attendances

  const getStudentsWithConsecutiveAbsences = (count = 3) => {
    const studentAbsenceChains: Record<string, { maxConsecutive: number; currentChain: number }> = {}

    const sortedAttendances = [...coachAttendances].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    )

    for (const attendance of sortedAttendances) {
      for (const record of attendance.records) {
        if (!studentAbsenceChains[record.studentId]) {
          studentAbsenceChains[record.studentId] = { maxConsecutive: 0, currentChain: 0 }
        }

        if (record.status === "Ausente") {
          studentAbsenceChains[record.studentId].currentChain++
          studentAbsenceChains[record.studentId].maxConsecutive = Math.max(
            studentAbsenceChains[record.studentId].maxConsecutive,
            studentAbsenceChains[record.studentId].currentChain,
          )
        } else {
          studentAbsenceChains[record.studentId].currentChain = 0
        }
      }
    }

    return Object.entries(studentAbsenceChains)
      .filter(([_, data]) => data.maxConsecutive >= count)
      .map(([studentId]) => studentId)
  }

  const studentsWithConsecutiveAbsences = getStudentsWithConsecutiveAbsences(3)

  let attendancesByDate = coachAttendances.reduce(
    (acc, attendance) => {
      if (!acc[attendance.date]) {
        acc[attendance.date] = []
      }
      acc[attendance.date].push(attendance)
      return acc
    },
    {} as Record<string, typeof coachAttendances>,
  )

  if (filterStudent || filterMonth) {
    const filteredAttendances = coachAttendances.filter((att) => {
      const matchesStudent = filterStudent
        ? att.records.some((r) => {
            const student = students.find((s) => s.id === r.studentId)
            return student?.name.toLowerCase().includes(filterStudent.toLowerCase())
          })
        : true

      const matchesMonth =
        filterMonth && filterMonth !== "all"
          ? format(new Date(att.date + "T00:00:00"), "MMMM", { locale: ptBR })
              .toLowerCase()
              .includes(filterMonth.toLowerCase())
          : true

      return matchesStudent && matchesMonth
    })

    attendancesByDate = filteredAttendances.reduce(
      (acc, attendance) => {
        if (!acc[attendance.date]) {
          acc[attendance.date] = []
        }
        acc[attendance.date].push(attendance)
        return acc
      },
      {} as Record<string, typeof coachAttendances>,
    )
  }

  const sortedDates = Object.keys(attendancesByDate).sort((a, b) => new Date(b).getTime() - new Date(a).getTime())

  const handleSaveEdit = (updatedRecords: Record<string, "Presente" | "Ausente">) => {
    if (editingSession) {
      updateAttendance(editingSession.id, updatedRecords)
      toast({
        title: "Chamada atualizada",
        description: "Registro de presença foi atualizado com sucesso",
      })
      setEditingSession(null)
    }
  }

  const handleDeleteAttendance = () => {
    if (editingSession) {
      deleteAttendance(editingSession.id)
      toast({
        title: "Registro apagado",
        description: "A chamada foi removida com sucesso",
      })
      setEditingSession(null)
    }
  }

  const handleEditClick = (attendance: Attendance) => {
    const userForCheck = user ? { id: user.id, role: user.role as "admin" | "coach" } : null
    if (canEditAttendance(attendance, userForCheck)) {
      setEditingSession(attendance)
    } else {
      const reason = getEditDisabledReason(attendance, userForCheck)
      toast({
        title: "Edição não permitida",
        description: reason || "Você não tem permissão para editar esta chamada",
        variant: "destructive",
      })
    }
  }

  const displayedDates = filterViolationsOnly
    ? sortedDates.filter((date) => {
        const dateAttendances = attendancesByDate[date]
        return dateAttendances.some((attendance) =>
          attendance.records.some(
            (record) => record.status === "Ausente" && studentsWithConsecutiveAbsences.includes(record.studentId),
          ),
        )
      })
    : sortedDates

  const stats = {
    total: Object.values(attendancesByDate)
      .flat()
      .reduce((sum, att) => sum + att.records.length, 0),
    present: Object.values(attendancesByDate)
      .flat()
      .reduce((sum, att) => sum + att.records.filter((r) => r.status === "Presente").length, 0),
    absent: Object.values(attendancesByDate)
      .flat()
      .reduce((sum, att) => sum + att.records.filter((r) => r.status === "Ausente").length, 0),
  }

  return (
    <div className="space-y-6">
      <div className="mb-6 lg:mb-8">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mb-2 text-balance">
          Relatório de Presenças
        </h1>
        <p className="text-sm sm:text-base lg:text-lg text-muted-foreground">
          Visualize e edite o histórico de chamadas das suas turmas ({coachAttendances.length} registros)
        </p>
      </div>

      <Tabs defaultValue="historico" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="historico" className="flex items-center gap-2 text-xs sm:text-sm">
            <Calendar className="h-4 w-4" />
            <span className="hidden sm:inline">Histórico</span>
          </TabsTrigger>
          <TabsTrigger value="estatisticas" className="flex items-center gap-2 text-xs sm:text-sm">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">Estatísticas</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="historico" className="space-y-6">
          <Card className="border-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <Filter className="h-5 w-5" />
                Filtros
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <label className="text-xs sm:text-sm font-medium mb-2 block">Nome do Aluno</label>
                  <Input
                    placeholder="Filtrar por nome..."
                    value={filterStudent}
                    onChange={(e) => setFilterStudent(e.target.value)}
                    className="h-10 sm:h-11 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs sm:text-sm font-medium mb-2 block">Mês</label>
                  <Select value={filterMonth} onValueChange={setFilterMonth}>
                    <SelectTrigger className="h-10 sm:h-11 text-sm">
                      <SelectValue placeholder="Todos os meses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os meses</SelectItem>
                      <SelectItem value="janeiro">Janeiro</SelectItem>
                      <SelectItem value="fevereiro">Fevereiro</SelectItem>
                      <SelectItem value="março">Março</SelectItem>
                      <SelectItem value="abril">Abril</SelectItem>
                      <SelectItem value="maio">Maio</SelectItem>
                      <SelectItem value="junho">Junho</SelectItem>
                      <SelectItem value="julho">Julho</SelectItem>
                      <SelectItem value="agosto">Agosto</SelectItem>
                      <SelectItem value="setembro">Setembro</SelectItem>
                      <SelectItem value="outubro">Outubro</SelectItem>
                      <SelectItem value="novembro">Novembro</SelectItem>
                      <SelectItem value="dezembro">Dezembro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="sm:col-span-2 lg:col-span-2">
                  <label className="text-xs sm:text-sm font-medium mb-2 block">Filtro Especial</label>
                  <Button
                    variant={filterViolationsOnly ? "default" : "outline"}
                    className="w-full h-10 sm:h-11 text-sm gap-2"
                    onClick={() => setFilterViolationsOnly(!filterViolationsOnly)}
                  >
                    <AlertTriangle className="h-4 w-4" />
                    {filterViolationsOnly ? "Mostrando Violações" : "Ver Violações (3+ Faltas)"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {studentsWithConsecutiveAbsences.length > 0 && filterViolationsOnly && (
            <Card className="border-2 border-destructive/50 bg-destructive/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-destructive">
                  <AlertTriangle className="h-5 w-5" />
                  Alunos com 3+ Faltas Seguidas
                </CardTitle>
                <CardDescription className="text-base">
                  {studentsWithConsecutiveAbsences.length} aluno(s) com preocupante histórico de faltas
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {studentsWithConsecutiveAbsences.map((studentId) => {
                    const student = students.find((s) => s.id === studentId)
                    return (
                      <div
                        key={studentId}
                        className="flex items-center justify-between p-3 rounded-lg border-2 border-destructive/20 bg-destructive/10"
                      >
                        <div>
                          <p className="font-semibold text-foreground">{student?.name}</p>
                          <p className="text-xs text-muted-foreground">{student?.classSchedule}</p>
                        </div>
                        <Badge className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          Atenção
                        </Badge>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {displayedDates.length === 0 && (
            <Card className="border-2">
              <CardContent className="py-12 text-center">
                <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                <p className="text-muted-foreground">
                  {filterViolationsOnly ? "Nenhuma violação encontrada" : "Nenhuma chamada registrada ainda"}
                </p>
              </CardContent>
            </Card>
          )}

          {displayedDates.map((date) => {
            const dateAttendances = attendancesByDate[date]
            const formattedDate = format(new Date(date + "T00:00:00"), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })

            return (
              <Card key={date} className="border-2">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-primary" />
                    <CardTitle className="text-lg sm:text-xl">{formattedDate}</CardTitle>
                  </div>
                  <CardDescription>{dateAttendances.length} chamada(s) registrada(s)</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2">
                    {dateAttendances.map((attendance) => {
                      const presentCount = attendance.records.filter((r) => r.status === "Presente").length
                      const absentCount = attendance.records.filter((r) => r.status === "Ausente").length
                      const totalStudents = attendance.records.length

                      const userForCheck = user ? { id: user.id, role: user.role as "admin" | "coach" } : null
                      const canEdit = canEditAttendance(attendance, userForCheck)
                      const editDisabledReason = getEditDisabledReason(attendance, userForCheck)

                      return (
                        <Card key={attendance.id} className="border-2 hover:shadow-md transition-shadow">
                          <CardContent className="pt-6">
                            <div className="space-y-4">
                              <div className="flex items-start justify-between">
                                <div>
                                  <p className="font-semibold text-lg">{attendance.classSchedule}</p>
                                  <p className="text-sm text-muted-foreground">{attendance.dayOfWeek}</p>
                                  <p className="text-xs text-muted-foreground mt-1">
                                    Treinador: {attendance.trainerName}
                                  </p>
                                </div>
                                <Badge variant="outline">
                                  <Users className="h-3 w-3 mr-1" />
                                  {totalStudents}
                                </Badge>
                              </div>

                              <div className="flex gap-4">
                                <div className="flex-1">
                                  <p className="text-2xl font-bold text-accent">{presentCount}</p>
                                  <p className="text-xs text-muted-foreground">Presentes</p>
                                </div>
                                <div className="flex-1">
                                  <p className="text-2xl font-bold text-destructive">{absentCount}</p>
                                  <p className="text-xs text-muted-foreground">Ausentes</p>
                                </div>
                              </div>

                              <div className="pt-4 border-t space-y-2 max-h-[200px] overflow-y-auto">
                                {attendance.records.map((record) => {
                                  const student = students.find((s) => s.id === record.studentId)
                                  const isViolating = studentsWithConsecutiveAbsences.includes(record.studentId)
                                  return (
                                    <div
                                      key={record.studentId}
                                      className={`flex items-center justify-between text-sm p-2 rounded transition-colors ${
                                        isViolating && record.status === "Ausente"
                                          ? "bg-destructive/10 border border-destructive/20"
                                          : "hover:bg-muted/50"
                                      }`}
                                    >
                                      <span className="text-foreground">{student?.name || "Aluno não encontrado"}</span>
                                      <Badge
                                        className={
                                          record.status === "Presente"
                                            ? "bg-accent hover:bg-accent/90"
                                            : "bg-destructive hover:bg-destructive/90"
                                        }
                                      >
                                        {record.status}
                                      </Badge>
                                    </div>
                                  )
                                })}
                              </div>

                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <div className="w-full">
                                      <Button
                                        onClick={() => handleEditClick(attendance)}
                                        variant="outline"
                                        size="sm"
                                        className="w-full mt-4"
                                        disabled={!canEdit}
                                      >
                                        {canEdit ? (
                                          <>
                                            <Edit2 className="h-4 w-4 mr-2" />
                                            Editar Registro
                                          </>
                                        ) : (
                                          <>
                                            <Lock className="h-4 w-4 mr-2" />
                                            Edição Bloqueada
                                          </>
                                        )}
                                      </Button>
                                    </div>
                                  </TooltipTrigger>
                                  {!canEdit && editDisabledReason && (
                                    <TooltipContent>
                                      <p>{editDisabledReason}</p>
                                    </TooltipContent>
                                  )}
                                </Tooltip>
                              </TooltipProvider>
                            </div>
                          </CardContent>
                        </Card>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </TabsContent>

        <TabsContent value="estatisticas" className="space-y-6">
          <div className="grid gap-3 sm:gap-4 lg:gap-6 grid-cols-1 sm:grid-cols-3">
            <Card className="border-2">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">Total de Registros</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-foreground">{stats.total}</p>
              </CardContent>
            </Card>
            <Card className="border-2 border-green-500/30 bg-green-500/5">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-green-600">Presenças</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-green-600">{stats.present}</p>
                <p className="text-xs text-muted-foreground">
                  {stats.total > 0 ? `${((stats.present / stats.total) * 100).toFixed(1)}%` : "0%"}
                </p>
              </CardContent>
            </Card>
            <Card className="border-2 border-red-500/30 bg-red-500/5">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-red-600">Ausências</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-red-600">{stats.absent}</p>
                <p className="text-xs text-muted-foreground">
                  {stats.total > 0 ? `${((stats.absent / stats.total) * 100).toFixed(1)}%` : "0%"}
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {editingSession && (
        <AttendanceEditDialog
          isOpen={!!editingSession}
          onClose={() => setEditingSession(null)}
          attendance={editingSession}
          students={students}
          onSave={handleSaveEdit}
          onDelete={handleDeleteAttendance}
        />
      )}
    </div>
  )
}
