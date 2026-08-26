import { AppHeader } from "@/components/app-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useAttendance } from "@/lib/hooks/use-attendance"
import { useStudents } from "@/lib/hooks/use-students"
import { CheckCircle2, XCircle, Calendar, Clock, User } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

import { BackButton } from "./back-button"

export default async function AttendanceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <AppHeader />

      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <BackButton />
          <AttendanceDetailContent attendanceId={id} />
        </div>
      </main>
    </div>
  )
}

function AttendanceDetailContent({ attendanceId }: { attendanceId: string }) {
  "use client"

  const { getAttendanceById } = useAttendance()
  const { students } = useStudents()

  const attendance = getAttendanceById(attendanceId)

  if (!attendance) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">Chamada não encontrada</p>
          <BackButton className="mt-4" />
        </CardContent>
      </Card>
    )
  }

  const formattedDate = format(new Date(attendance.date + "T00:00:00"), "dd 'de' MMMM 'de' yyyy", {
    locale: ptBR,
  })
  const formattedTime = format(new Date(attendance.createdAt), "HH:mm", { locale: ptBR })

  const presentStudents = attendance.records.filter((r) => r.status === "Presente")
  const absentStudents = attendance.records.filter((r) => r.status === "Ausente")

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Detalhes da Chamada</CardTitle>
          <CardDescription>Informações completas sobre a chamada registrada</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Data</p>
                <p className="font-semibold">{formattedDate}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Horário</p>
                <p className="font-semibold">{formattedTime}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Treinador</p>
                <p className="font-semibold">{attendance.trainerName}</p>
              </div>
            </div>

            <div>
              <p className="text-xs text-muted-foreground">Turma</p>
              <p className="font-semibold">{attendance.classSchedule}</p>
              <p className="text-xs text-muted-foreground">{attendance.classDays.join(", ")}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              Presentes
            </CardTitle>
            <Badge className="bg-green-600">{presentStudents.length}</Badge>
          </div>
        </CardHeader>
        <CardContent>
          {presentStudents.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">Nenhum aluno presente</p>
          ) : (
            <div className="space-y-3">
              {presentStudents.map((record) => {
                const student = students.find((s) => s.id === record.studentId)
                if (!student) return null

                return (
                  <div
                    key={student.id}
                    className="flex items-center gap-4 p-3 rounded-lg border bg-green-50 dark:bg-green-950"
                  >
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={student.photo || "/placeholder.svg"} alt={student.name} />
                      <AvatarFallback>{student.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-semibold">{student.name}</p>
                      <p className="text-sm text-muted-foreground">{student.classSchedule}</p>
                    </div>
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-600" />
              Ausentes
            </CardTitle>
            <Badge variant="destructive">{absentStudents.length}</Badge>
          </div>
        </CardHeader>
        <CardContent>
          {absentStudents.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">Nenhum aluno ausente</p>
          ) : (
            <div className="space-y-3">
              {absentStudents.map((record) => {
                const student = students.find((s) => s.id === record.studentId)
                if (!student) return null

                return (
                  <div
                    key={student.id}
                    className="flex items-center gap-4 p-3 rounded-lg border bg-red-50 dark:bg-red-950"
                  >
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={student.photo || "/placeholder.svg"} alt={student.name} />
                      <AvatarFallback>{student.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-semibold">{student.name}</p>
                      <p className="text-sm text-muted-foreground">{student.classSchedule}</p>
                    </div>
                    <XCircle className="h-5 w-5 text-red-600" />
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </>
  )
}
