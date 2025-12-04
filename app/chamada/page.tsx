"use client"

import { useState } from "react"
import { AppHeader } from "@/components/app-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useStudents } from "@/lib/hooks/use-students"
import { useAttendance } from "@/lib/hooks/use-attendance"
import { useAuth } from "@/lib/contexts/auth-context"
import { CheckCircle2, XCircle, Users } from "lucide-react"
import type { ClassSchedule, AttendanceRecord } from "@/lib/types"
import { useToast } from "@/hooks/use-toast"

export default function ChamadaPage() {
  const { students } = useStudents()
  const { addAttendance } = useAttendance()
  const { user } = useAuth()
  const { toast } = useToast()

  const [selectedSchedule, setSelectedSchedule] = useState<ClassSchedule | "">("")
  const [attendanceRecords, setAttendanceRecords] = useState<Record<string, "Presente" | "Ausente">>({})

  const filteredStudents = selectedSchedule
    ? students.filter((s) => {
        if (!s.isActive) return false
        // Check scheduleConfigs first
        if (s.scheduleConfigs && s.scheduleConfigs.length > 0) {
          return s.scheduleConfigs.some((config) => config.schedule === selectedSchedule)
        }
        return s.classSchedule === selectedSchedule
      })
    : []

  const handleToggleAttendance = (studentId: string) => {
    setAttendanceRecords((prev) => ({
      ...prev,
      [studentId]: prev[studentId] === "Presente" ? "Ausente" : "Presente",
    }))
  }

  const handleSubmitAttendance = () => {
    if (!selectedSchedule) {
      toast({
        title: "Erro",
        description: "Selecione uma turma primeiro",
        variant: "destructive",
      })
      return
    }

    if (filteredStudents.length === 0) {
      toast({
        title: "Erro",
        description: "Não há alunos nesta turma",
        variant: "destructive",
      })
      return
    }

    const records: AttendanceRecord[] = filteredStudents.map((student) => ({
      studentId: student.id,
      status: attendanceRecords[student.id] || "Ausente",
    }))

    const classDays = filteredStudents[0]?.classDays || []

    addAttendance(selectedSchedule, classDays, user?.username || "Treinador", records)

    toast({
      title: "Chamada Registrada!",
      description: `Chamada da turma ${selectedSchedule} registrada com sucesso.`,
    })

    setAttendanceRecords({})
    setSelectedSchedule("")
  }

  const presentCount = Object.values(attendanceRecords).filter((status) => status === "Presente").length
  const absentCount = Object.values(attendanceRecords).filter((status) => status === "Ausente").length

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <AppHeader />

      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Registrar Chamada</h1>
            <p className="text-muted-foreground">Registre a presença dos alunos</p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Selecione a Turma</CardTitle>
              <CardDescription>Escolha o horário da turma para fazer a chamada</CardDescription>
            </CardHeader>
            <CardContent>
              <Select value={selectedSchedule} onValueChange={(value) => setSelectedSchedule(value as ClassSchedule)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione o horário" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="18:00-19:30">18:00 - 19:30</SelectItem>
                  <SelectItem value="19:30-21:00">19:30 - 21:00</SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {selectedSchedule && filteredStudents.length > 0 && (
            <div className="grid grid-cols-3 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <Users className="h-8 w-8 text-primary" />
                    <div>
                      <p className="text-2xl font-bold">{filteredStudents.length}</p>
                      <p className="text-sm text-muted-foreground">Total</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="h-8 w-8 text-green-600" />
                    <div>
                      <p className="text-2xl font-bold">{presentCount}</p>
                      <p className="text-sm text-muted-foreground">Presentes</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <XCircle className="h-8 w-8 text-red-600" />
                    <div>
                      <p className="text-2xl font-bold">{absentCount}</p>
                      <p className="text-sm text-muted-foreground">Ausentes</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {selectedSchedule && filteredStudents.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Lista de Alunos - {selectedSchedule}</CardTitle>
                <CardDescription>Clique nos alunos para marcar presença</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {filteredStudents.map((student) => {
                    const status = attendanceRecords[student.id]
                    const isPresent = status === "Presente"
                    const isAbsent = status === "Ausente"

                    return (
                      <div
                        key={student.id}
                        onClick={() => handleToggleAttendance(student.id)}
                        className={`flex items-center justify-between p-4 rounded-lg border-2 cursor-pointer transition-all ${
                          isPresent
                            ? "border-green-500 bg-green-50 dark:bg-green-950"
                            : isAbsent
                              ? "border-red-500 bg-red-50 dark:bg-red-950"
                              : "border-border hover:border-primary"
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <Avatar className="h-12 w-12">
                            <AvatarImage src={student.photo || "/placeholder.svg"} alt={student.name} />
                            <AvatarFallback>{student.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-semibold">{student.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {student.scheduleConfigs && student.scheduleConfigs.length > 0
                                ? student.scheduleConfigs.map((c) => `${c.day} ${c.schedule}`).join(", ")
                                : `${student.classDays?.join(", ")} - ${student.classSchedule}`}
                            </p>
                          </div>
                        </div>

                        <div>
                          {isPresent && (
                            <Badge className="bg-green-600 hover:bg-green-700">
                              <CheckCircle2 className="h-4 w-4 mr-1" />
                              Presente
                            </Badge>
                          )}
                          {isAbsent && (
                            <Badge variant="destructive">
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

                <div className="mt-6 flex gap-3">
                  <Button onClick={handleSubmitAttendance} className="flex-1" size="lg">
                    Concluir Chamada
                  </Button>
                  <Button
                    onClick={() => {
                      setAttendanceRecords({})
                      setSelectedSchedule("")
                    }}
                    variant="outline"
                    size="lg"
                  >
                    Cancelar
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {selectedSchedule && filteredStudents.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Nenhum aluno encontrado nesta turma</p>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  )
}
