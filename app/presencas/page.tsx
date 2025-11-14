"use client"

import { useState } from "react"
import { useRouter } from 'next/navigation'
import { AppHeader } from "@/components/app-header"
import { AppFooter } from "@/components/app-footer"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { useAttendance } from "@/lib/hooks/use-attendance"
import { useStudents } from "@/lib/hooks/use-students"
import { Calendar, Users, Eye, Search, X, AlertTriangle } from 'lucide-react'
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

export default function PresencasPage() {
  const { attendances } = useAttendance()
  const { students } = useStudents()
  const router = useRouter()

  const [filterType, setFilterType] = useState<"all" | "presentes" | "ausentes">("all")
  const [studentFilter, setStudentFilter] = useState("")
  const [dateRangeStart, setDateRangeStart] = useState("")
  const [dateRangeEnd, setDateRangeEnd] = useState("")
  const [showViolations, setShowViolations] = useState(false)

  // Group attendances by date
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
    // Date range filter
    if (dateRangeStart && new Date(attendance.date) < new Date(dateRangeStart)) return false
    if (dateRangeEnd && new Date(attendance.date) > new Date(dateRangeEnd)) return false

    // Student name filter
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

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* <AppHeader /> */}

      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Relatório de Presenças</h1>
            <p className="text-muted-foreground">
              Visualize o histórico completo de chamadas e detecte violações de frequência
            </p>
          </div>

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
                  <label className="text-sm font-medium">Data Inicial</label>
                  <Input type="date" value={dateRangeStart} onChange={(e) => setDateRangeStart(e.target.value)} />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Data Final</label>
                  <Input type="date" value={dateRangeEnd} onChange={(e) => setDateRangeEnd(e.target.value)} />
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

              {(filterType !== "all" || studentFilter || dateRangeStart || dateRangeEnd || showViolations) && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setFilterType("all")
                    setStudentFilter("")
                    setDateRangeStart("")
                    setDateRangeEnd("")
                    setShowViolations(false)
                  }}
                >
                  Limpar Filtros
                </Button>
              )}
            </CardContent>
          </Card>

          {sortedDates.length > 0 && (
            <div className="grid grid-cols-3 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <Users className="h-8 w-8 text-primary" />
                    <div>
                      <p className="text-2xl font-bold">{totalAttendances}</p>
                      <p className="text-xs text-muted-foreground">Registros</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-green-100 dark:bg-green-950 flex items-center justify-center">
                      <span className="text-lg font-bold text-green-600">✓</span>
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{totalPresentes}</p>
                      <p className="text-xs text-muted-foreground">Presentes</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-red-100 dark:bg-red-950 flex items-center justify-center">
                      <span className="text-lg font-bold text-red-600">✕</span>
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{totalAusentes}</p>
                      <p className="text-xs text-muted-foreground">Ausentes</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
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

                      return (
                        <Card key={attendance.id} className="border-2">
                          <CardContent className="pt-6">
                            <div className="space-y-4">
                              <div className="flex items-start justify-between">
                                <div>
                                  <p className="font-semibold text-lg">{attendance.classSchedule}</p>
                                  <p className="text-sm text-muted-foreground">{attendance.classDays.join(", ")}</p>
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
                                  <p className="text-2xl font-bold text-green-600">{presentCount}</p>
                                  <p className="text-xs text-muted-foreground">Presentes</p>
                                </div>
                                <div className="flex-1">
                                  <p className="text-2xl font-bold text-red-600">{absentCount}</p>
                                  <p className="text-xs text-muted-foreground">Ausentes</p>
                                </div>
                              </div>

                              <Button
                                onClick={() => handleViewDetails(attendance.id)}
                                variant="outline"
                                size="sm"
                                className="w-full"
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                Ver Detalhes
                              </Button>
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
        </div>
      </main>

      <AppFooter />
    </div>
  )
}
