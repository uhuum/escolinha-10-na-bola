"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { AppHeader } from "@/components/app-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAttendance } from "@/lib/hooks/use-attendance"
import { useStudents } from "@/lib/hooks/use-students"
import { useAuth } from "@/lib/contexts/auth-context"
import { Calendar, Users, Eye, Search, X, AlertTriangle, BarChart3, Lock } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { AttendanceEditDialog } from "@/components/attendance-edit-dialog"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import type { Attendance } from "@/lib/types"
import { useToast } from "@/hooks/use-toast"
import { canEditAttendance, getEditDisabledReason } from "@/lib/utils/attendance-permissions"

export default function PresencasPage() {
  const { attendances, updateAttendance, deleteAttendance } = useAttendance()
  const { students } = useStudents()
  const { user } = useAuth()
  const router = useRouter()
  const { toast } = useToast()

  const [filterType, setFilterType] = useState<"all" | "presentes" | "ausentes">("all")
  const [studentFilter, setStudentFilter] = useState("")
  const [dateRangeStart, setDateRangeStart] = useState("")
  const [dateRangeEnd, setDateRangeEnd] = useState("")
  const [showViolations, setShowViolations] = useState(false)
  const [editingSession, setEditingSession] = useState<Attendance | null>(null)
  const [filterMonth, setFilterMonth] = useState("")

  let attendancesByDate = attendances.reduce(
    (acc, attendance) => {
      if (!acc[attendance.date]) {
        acc[attendance.date] = []
      }
      acc[attendance.date].push(attendance)
      return acc
    },
    {} as Record<string, typeof attendances>,
  )

  const filteredAttendances = attendances.filter((attendance) => {
    if (dateRangeStart && new Date(attendance.date) < new Date(dateRangeStart)) return false
    if (dateRangeEnd && new Date(attendance.date) > new Date(dateRangeEnd)) return false

    if (filterMonth && filterMonth !== "all") {
      const attendanceMonth = format(new Date(attendance.date + "T00:00:00"), "MMMM", { locale: ptBR }).toLowerCase()
      if (!attendanceMonth.includes(filterMonth.toLowerCase())) return false
    }

    if (studentFilter) {
      const hasStudent = attendance.records.some((record) => {
        const student = students.find((s) => s.id === record.studentId)
        return student?.name.toLowerCase().includes(studentFilter.toLowerCase())
      })
      if (!hasStudent) return false
    }

    return true
  })

  const finalAttendances = filteredAttendances.map((attendance) => {
    if (filterType === "all") return attendance

    const filteredRecords = attendance.records.filter((record) => {
      if (filterType === "presentes") return record.status === "Presente"
      if (filterType === "ausentes") return record.status === "Ausente"
      return true
    })

    return { ...attendance, records: filteredRecords }
  })

  attendancesByDate = finalAttendances.reduce(
    (acc, attendance) => {
      if (attendance.records.length === 0) return acc
      if (!acc[attendance.date]) {
        acc[attendance.date] = []
      }
      acc[attendance.date].push(attendance)
      return acc
    },
    {} as Record<string, typeof finalAttendances>,
  )

  const sortedDates = Object.keys(attendancesByDate).sort((a, b) => new Date(b).getTime() - new Date(a).getTime())

  const handleViewDetails = (attendanceId: string) => {
    router.push(`/presencas/${attendanceId}`)
  }

  const totalAttendances = finalAttendances.length
  const totalPresentes = finalAttendances.reduce(
    (sum, att) => sum + att.records.filter((r) => r.status === "Presente").length,
    0,
  )
  const totalAusentes = finalAttendances.reduce(
    (sum, att) => sum + att.records.filter((r) => r.status === "Ausente").length,
    0,
  )

  const getStudentsWithConsecutiveAbsences = () => {
    const studentMaxConsecutive: Record<string, { max: number; current: number }> = {}
    const sortedAttendances = [...attendances].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

    for (const attendance of sortedAttendances) {
      for (const record of attendance.records) {
        if (!studentMaxConsecutive[record.studentId]) {
          studentMaxConsecutive[record.studentId] = { max: 0, current: 0 }
        }
        if (record.status === "Ausente") {
          studentMaxConsecutive[record.studentId].current++
          studentMaxConsecutive[record.studentId].max = Math.max(
            studentMaxConsecutive[record.studentId].max,
            studentMaxConsecutive[record.studentId].current,
          )
        } else {
          studentMaxConsecutive[record.studentId].current = 0
        }
      }
    }

    return Object.entries(studentMaxConsecutive)
      .filter(([_, data]: [string, any]) => data.max >= 3)
      .map(([studentId]) => studentId)
  }

  const violatingStudents = getStudentsWithConsecutiveAbsences()

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

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <AppHeader />

      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="mb-6 lg:mb-8">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mb-2 text-balance">
              Relatório de Presenças
            </h1>
            <p className="text-sm sm:text-base lg:text-lg text-muted-foreground">
              Visualize o histórico completo de chamadas e detecte violações de frequência
            </p>
          </div>

          <Tabs defaultValue="historico" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="historico" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Histórico
              </TabsTrigger>
              <TabsTrigger value="estatisticas" className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Estatísticas
              </TabsTrigger>
            </TabsList>

            <TabsContent value="historico" className="space-y-6">
              <Card className="border-2 bg-accent/5">
                <CardHeader>
                  <CardTitle className="text-lg">Filtros Avançados</CardTitle>
                  <CardDescription>Refine os resultados do relatório</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Tipo de Presença</label>
                      <Select value={filterType} onValueChange={(value: any) => setFilterType(value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todas</SelectItem>
                          <SelectItem value="presentes">Apenas Presentes</SelectItem>
                          <SelectItem value="ausentes">Apenas Ausentes</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Nome do Aluno</label>
                      <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Buscar aluno..."
                          value={studentFilter}
                          onChange={(e) => setStudentFilter(e.target.value)}
                          className="pl-9"
                        />
                        {studentFilter && (
                          <button
                            onClick={() => setStudentFilter("")}
                            className="absolute right-2 top-2.5 text-muted-foreground hover:text-foreground"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Mês</label>
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

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Data Inicial</label>
                      <Input type="date" value={dateRangeStart} onChange={(e) => setDateRangeStart(e.target.value)} />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Filtro Especial</label>
                      <Button
                        variant={showViolations ? "default" : "outline"}
                        className="w-full justify-start"
                        onClick={() => setShowViolations(!showViolations)}
                      >
                        <AlertTriangle className="h-4 w-4 mr-2" />
                        <span className="text-xs">3+ Faltas</span>
                      </Button>
                    </div>
                  </div>

                  {(filterType !== "all" ||
                    studentFilter ||
                    dateRangeStart ||
                    dateRangeEnd ||
                    showViolations ||
                    filterMonth) && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setFilterType("all")
                        setStudentFilter("")
                        setDateRangeStart("")
                        setDateRangeEnd("")
                        setShowViolations(false)
                        setFilterMonth("")
                      }}
                    >
                      Limpar Filtros
                    </Button>
                  )}
                </CardContent>
              </Card>

              {showViolations && violatingStudents.length > 0 && (
                <Card className="border-2 border-destructive/50 bg-destructive/5">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-destructive">
                      <AlertTriangle className="h-5 w-5" />
                      Alunos com 3+ Faltas Seguidas
                    </CardTitle>
                    <CardDescription className="text-base">
                      {violatingStudents.length} aluno(s) com preocupante histórico de faltas
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {violatingStudents.map((studentId) => {
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

              {sortedDates.length === 0 && (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">Nenhuma chamada encontrada com os filtros aplicados</p>
                  </CardContent>
                </Card>
              )}

              {sortedDates.map((date) => {
                const dateAttendances = attendancesByDate[date]
                const formattedDate = format(new Date(date + "T00:00:00"), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })

                return (
                  <Card key={date}>
                    <CardHeader>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-5 w-5 text-primary" />
                        <CardTitle>{formattedDate}</CardTitle>
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
                            <Card key={attendance.id} className="border-2">
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

                                  <div className="pt-4 border-t space-y-2">
                                    {attendance.records.map((record) => {
                                      const student = students.find((s) => s.id === record.studentId)
                                      const isViolating = violatingStudents.includes(record.studentId)
                                      return (
                                        <div
                                          key={record.studentId}
                                          className={`flex items-center justify-between text-sm p-2 rounded transition-colors ${
                                            isViolating && record.status === "Ausente"
                                              ? "bg-destructive/10 border border-destructive/20"
                                              : "hover:bg-muted/50"
                                          }`}
                                        >
                                          <span className="text-foreground">{student?.name}</span>
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

                                  <div className="flex gap-2">
                                    <Button
                                      onClick={() => handleViewDetails(attendance.id)}
                                      variant="outline"
                                      size="sm"
                                      className="flex-1"
                                    >
                                      <Eye className="h-4 w-4 mr-1" />
                                      Ver Detalhes
                                    </Button>
                                    <TooltipProvider>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <div className="flex-1">
                                            <Button
                                              onClick={() => handleEditClick(attendance)}
                                              variant="outline"
                                              size="sm"
                                              className="w-full"
                                              disabled={!canEdit}
                                            >
                                              {canEdit ? (
                                                <>
                                                  <Eye className="h-4 w-4 mr-1" />
                                                  Editar
                                                </>
                                              ) : (
                                                <>
                                                  <Lock className="h-4 w-4 mr-1" />
                                                  Bloqueado
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
              <div className="grid gap-4 md:grid-cols-3">
                <Card className="border-2">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Total de Chamadas</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold text-primary">{totalAttendances}</p>
                  </CardContent>
                </Card>

                <Card className="border-2">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Presenças Registradas</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold text-accent">{totalPresentes}</p>
                  </CardContent>
                </Card>

                <Card className="border-2">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Faltas Registradas</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold text-destructive">{totalAusentes}</p>
                  </CardContent>
                </Card>
              </div>

              <Card className="border-2">
                <CardHeader>
                  <CardTitle>Frequência por Aluno</CardTitle>
                  <CardDescription>Porcentagem de presença de cada aluno</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {students
                      .filter((s) => s.isActive)
                      .map((student) => {
                        const studentRecords = attendances.flatMap((a) =>
                          a.records.filter((r) => r.studentId === student.id),
                        )
                        const totalRecords = studentRecords.length
                        const presentRecords = studentRecords.filter((r) => r.status === "Presente").length
                        const percentage = totalRecords > 0 ? Math.round((presentRecords / totalRecords) * 100) : 0

                        return (
                          <div key={student.id} className="flex items-center gap-4">
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">{student.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {presentRecords}/{totalRecords} presenças
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${
                                    percentage >= 75
                                      ? "bg-accent"
                                      : percentage >= 50
                                        ? "bg-yellow-500"
                                        : "bg-destructive"
                                  }`}
                                  style={{ width: `${percentage}%` }}
                                />
                              </div>
                              <span className="text-sm font-medium w-12 text-right">{percentage}%</span>
                            </div>
                          </div>
                        )
                      })}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      {editingSession && (
        <AttendanceEditDialog
          attendance={editingSession}
          students={students}
          onSave={handleSaveEdit}
          onDelete={handleDeleteAttendance}
          onClose={() => setEditingSession(null)}
        />
      )}
    </div>
  )
}
