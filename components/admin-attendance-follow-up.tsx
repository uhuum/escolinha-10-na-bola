"use client"

import { useMemo } from "react"
import Link from "next/link"
import { AlertTriangle, MessageCircle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/contexts/auth-context"
import { absentForThreeConsecutiveWeeks, localToday, type AttendanceEntry } from "@/lib/utils/attendance-insights"
import type { Attendance, Student } from "@/lib/types"

type Props = {
  students: Student[]
  attendances: Attendance[]
  loading?: boolean
  loadError?: string | null
}

function whatsappLink(student: Student, phone: string) {
  let digits = phone.replace(/\D/g, "")
  if (digits.length === 10 || digits.length === 11) digits = "55" + digits
  const text = `Olá, ${student.responsible || "responsável"}!

Aqui é do Administrativo 10 na Bola. Verificamos que o(a) aluno(a) *${student.name}* tem faltas registradas em três semanas consecutivas de treino.

Gostaríamos de saber se está tudo bem e se há alguma situação em que possamos ajudar. Aguardamos seu retorno!

*Administrativo 10 na Bola*`
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`
}

/**
 * Relatório administrativo de acompanhamento, visível apenas na aba Presenças.
 * Reutiliza os alunos e as chamadas já carregados na tela, sem criar consultas
 * paralelas ao banco ou duplicar a seção dentro de Matrículas.
 */
export function AdminAttendanceFollowUp({ students, attendances, loading = false, loadError }: Props) {
  const { user } = useAuth()
  const atRisk = useMemo(() => {
    if (user?.role !== "admin") return []
    const entriesByStudent = new Map<string, AttendanceEntry[]>()

    for (const attendance of attendances) {
      for (const record of attendance.records) {
        if (record.status !== "Presente" && record.status !== "Ausente") continue
        const list = entriesByStudent.get(record.studentId) || []
        list.push({
          studentId: record.studentId,
          date: attendance.date,
          schedule: attendance.classSchedule,
          status: record.status,
        })
        entriesByStudent.set(record.studentId, list)
      }
    }

    const today = localToday()
    return students
      .filter(student => student.isActive && !student.archivedAt)
      .filter(student => absentForThreeConsecutiveWeeks(
        student,
        entriesByStudent.get(student.id) || [],
        today,
      ))
      .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"))
  }, [students, attendances, user?.role])

  if (user?.role !== "admin") return null

  return (
    <Card className="min-w-0 border-amber-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600" />
          Acompanhamento de frequência
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Alunos com faltas registradas em três semanas consecutivas, considerando seus dias e horários de treino.
          Dias sem chamada não contam como ausência.
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {loading ? (
          <p className="text-sm text-muted-foreground">Consultando chamadas e alunos...</p>
        ) : loadError ? (
          <p role="alert" className="text-sm text-destructive">{loadError}</p>
        ) : atRisk.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum aluno atingiu o critério de três semanas consecutivas de faltas registradas.</p>
        ) : (
          <>
            <p className="text-sm font-semibold text-amber-800">
              {atRisk.length} {atRisk.length === 1 ? "aluno precisa" : "alunos precisam"} de contato com a família
            </p>
            <div className="grid min-w-0 gap-3 lg:grid-cols-2">
              {atRisk.map(student => {
                const father = student.fatherPhone?.trim() || ""
                const mother = student.motherPhone?.trim() || ""
                const uniqueMother = mother.replace(/\D/g, "") !== father.replace(/\D/g, "")
                return (
                  <div key={student.id} className="flex min-w-0 flex-col justify-between gap-3 rounded-xl border p-3">
                    <div className="min-w-0">
                      <Link href={`/students/${student.id}`} className="break-words font-semibold text-blue-700 hover:underline">
                        {student.name}
                      </Link>
                      <p className="break-words text-sm text-muted-foreground">
                        Responsável: {student.responsible || "Não informado"}
                      </p>
                      <p className="mt-1 text-xs text-amber-800">Três semanas consecutivas com faltas registradas</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {father && (
                        <Button asChild size="sm" variant="outline">
                          <a href={whatsappLink(student, father)} target="_blank" rel="noopener noreferrer">
                            <MessageCircle className="mr-1.5 h-4 w-4" /> WhatsApp pai
                          </a>
                        </Button>
                      )}
                      {mother && uniqueMother && (
                        <Button asChild size="sm" variant="outline">
                          <a href={whatsappLink(student, mother)} target="_blank" rel="noopener noreferrer">
                            <MessageCircle className="mr-1.5 h-4 w-4" /> WhatsApp mãe
                          </a>
                        </Button>
                      )}
                      {!father && !mother && (
                        <p className="text-xs text-destructive">Sem telefone cadastrado</p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
