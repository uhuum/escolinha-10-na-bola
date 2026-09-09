"use client"

import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useAttendance } from "@/lib/hooks/use-attendance"
import { useStudents } from "@/lib/hooks/use-students"
import { CheckCircle2, XCircle, Calendar, Clock, User, ChevronRight } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { BackButton } from "@/app/presencas/[id]/back-button"

export function AttendanceDetailContent({ attendanceId }: { attendanceId: string }) {
  const { getAttendanceById, isLoading: attendanceLoading } = useAttendance()
  const { students, isLoading: studentsLoading } = useStudents({ includePayments: false, lightweightPhotos: true })
  const attendance = getAttendanceById(attendanceId)

  if (attendanceLoading || studentsLoading) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Carregando detalhes da chamada...</p>
        </CardContent>
      </Card>
    )
  }

  if (!attendance) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="font-medium">Chamada não encontrada</p>
          <p className="mt-1 text-sm text-muted-foreground">O registro pode ter sido removido ou ainda não sincronizou.</p>
          <BackButton className="mt-4" />
        </CardContent>
      </Card>
    )
  }

  const formattedDate = format(new Date(attendance.date + "T00:00:00"), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
  const formattedTime = attendance.createdAt ? format(new Date(attendance.createdAt), "HH:mm", { locale: ptBR }) : "—"
  const presentStudents = attendance.records.filter((r) => r.status === "Presente")
  const absentStudents = attendance.records.filter((r) => r.status === "Ausente")

  const StudentRow = ({ record, present }: { record: (typeof attendance.records)[number]; present: boolean }) => {
    const student = students.find((s) => s.id === record.studentId)
    if (!student) return null
    return (
      <Link
        href={`/students/${student.id}`}
        className={`group flex w-full min-w-0 max-w-full items-center gap-3 rounded-xl border p-3 transition-colors hover:bg-muted/60 sm:gap-4 ${present ? "border-green-200/70" : "border-red-200/70"}`}
      >
        <Avatar className="h-14 w-14 shrink-0 border sm:h-16 sm:w-16">
          <AvatarImage src={student.photo || "/placeholder.svg"} alt={student.name} className="object-cover" />
          <AvatarFallback className="text-lg font-semibold">{student.name.slice(0, 2).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="break-words text-base font-semibold leading-tight text-foreground sm:text-lg">{student.name}</p>
          <p className="text-sm text-muted-foreground">{student.classSchedule}</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {present ? <CheckCircle2 className="h-5 w-5 text-green-600" /> : <XCircle className="h-5 w-5 text-red-600" />}
          <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
        </div>
      </Link>
    )
  }

  return (
    <div className="w-full min-w-0 max-w-full space-y-5 overflow-x-hidden">
      <Card className="w-full min-w-0 max-w-full overflow-hidden">
        <CardHeader>
          <CardTitle>Detalhes da Chamada</CardTitle>
          <CardDescription>Informações completas do registro e dos alunos.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="flex items-start gap-2"><Calendar className="mt-0.5 h-4 w-4 text-muted-foreground" /><div><p className="text-xs text-muted-foreground">Data</p><p className="font-semibold">{formattedDate}</p></div></div>
            <div className="flex items-start gap-2"><Clock className="mt-0.5 h-4 w-4 text-muted-foreground" /><div><p className="text-xs text-muted-foreground">Registrada às</p><p className="font-semibold">{formattedTime}</p></div></div>
            <div className="flex items-start gap-2"><User className="mt-0.5 h-4 w-4 text-muted-foreground" /><div><p className="text-xs text-muted-foreground">Treinador</p><p className="font-semibold">{attendance.trainerName}</p></div></div>
            <div><p className="text-xs text-muted-foreground">Turma</p><p className="font-semibold">{attendance.classSchedule}</p><p className="text-xs text-muted-foreground">{attendance.classDays.join(", ")}</p></div>
          </div>
        </CardContent>
      </Card>

      <Card className="w-full min-w-0 max-w-full overflow-hidden">
        <CardHeader className="pb-3"><div className="flex items-center justify-between"><CardTitle className="flex items-center gap-2 text-lg"><CheckCircle2 className="h-5 w-5 text-green-600" />Presentes</CardTitle><Badge className="bg-green-600">{presentStudents.length}</Badge></div></CardHeader>
        <CardContent>{presentStudents.length ? <div className="grid gap-3 md:grid-cols-2">{presentStudents.map((record) => <StudentRow key={record.studentId} record={record} present />)}</div> : <p className="py-4 text-center text-sm text-muted-foreground">Nenhum aluno presente</p>}</CardContent>
      </Card>

      <Card className="w-full min-w-0 max-w-full overflow-hidden">
        <CardHeader className="pb-3"><div className="flex items-center justify-between"><CardTitle className="flex items-center gap-2 text-lg"><XCircle className="h-5 w-5 text-red-600" />Ausentes</CardTitle><Badge variant="destructive">{absentStudents.length}</Badge></div></CardHeader>
        <CardContent>{absentStudents.length ? <div className="grid gap-3 md:grid-cols-2">{absentStudents.map((record) => <StudentRow key={record.studentId} record={record} present={false} />)}</div> : <p className="py-4 text-center text-sm text-muted-foreground">Nenhum aluno ausente</p>}</CardContent>
      </Card>
    </div>
  )
}
