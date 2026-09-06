"use client"

import { useMemo, useState } from "react"
import { AlertTriangle, CheckCircle2, MessageCircle, Phone, Search, UserRoundX } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import type { Attendance, Student } from "@/lib/types"

interface AttendanceFollowUpProps {
  students: Student[]
  attendances: Attendance[]
  title?: string
  description?: string
  maxItems?: number
}

type FollowUpStudent = {
  student: Student
  total: number
  present: number
  absent: number
  rate: number
  consecutiveAbsences: number
  lastStatus?: "Presente" | "Ausente"
  lastDate?: string
  level: "urgent" | "attention" | "ok"
}

function onlyDigits(value?: string) {
  return (value || "").replace(/\D/g, "")
}

function whatsappUrl(phone?: string, studentName?: string) {
  let digits = onlyDigits(phone)
  if (!digits) return null
  if (digits.length <= 11) digits = `55${digits}`
  const text = encodeURIComponent(`Olá! Tudo bem? Estamos entrando em contato sobre a frequência de ${studentName || "aluno(a)"} nos treinos da 10 na Bola.`)
  return `https://wa.me/${digits}?text=${text}`
}

export function AttendanceFollowUp({
  students,
  attendances,
  title = "Acompanhamento de frequência",
  description = "Alunos que merecem atenção para evitar afastamento e facilitar o contato com a família.",
  maxItems = 12,
}: AttendanceFollowUpProps) {
  const [search, setSearch] = useState("")
  const studentMap = useMemo(() => new Map(students.map((student) => [student.id, student])), [students])

  const followUp = useMemo(() => {
    const recordsByStudent = new Map<string, Array<{ date: string; status: "Presente" | "Ausente" }>>()

    const ordered = [...attendances].sort((a, b) => b.date.localeCompare(a.date))
    for (const attendance of ordered) {
      for (const record of attendance.records) {
        if (!studentMap.has(record.studentId)) continue
        const list = recordsByStudent.get(record.studentId) || []
        list.push({ date: attendance.date, status: record.status })
        recordsByStudent.set(record.studentId, list)
      }
    }

    const result: FollowUpStudent[] = []
    for (const [studentId, records] of recordsByStudent) {
      const student = studentMap.get(studentId)
      if (!student || !student.isActive) continue

      const recent = records.slice(0, 8)
      const present = recent.filter((r) => r.status === "Presente").length
      const absent = recent.filter((r) => r.status === "Ausente").length
      const rate = recent.length ? Math.round((present / recent.length) * 100) : 100
      let consecutiveAbsences = 0
      for (const record of records) {
        if (record.status !== "Ausente") break
        consecutiveAbsences++
      }

      let level: FollowUpStudent["level"] = "ok"
      if (consecutiveAbsences >= 3 || (recent.length >= 4 && rate <= 50)) level = "urgent"
      else if (consecutiveAbsences >= 2 || (recent.length >= 4 && rate <= 65)) level = "attention"

      if (level !== "ok") {
        result.push({
          student,
          total: recent.length,
          present,
          absent,
          rate,
          consecutiveAbsences,
          lastStatus: records[0]?.status,
          lastDate: records[0]?.date,
          level,
        })
      }
    }

    return result.sort((a, b) => {
      if (a.level !== b.level) return a.level === "urgent" ? -1 : 1
      if (a.consecutiveAbsences !== b.consecutiveAbsences) return b.consecutiveAbsences - a.consecutiveAbsences
      return a.rate - b.rate
    })
  }, [attendances, studentMap])

  const filtered = followUp.filter((item) => item.student.name.toLowerCase().includes(search.toLowerCase())).slice(0, maxItems)
  const urgentCount = followUp.filter((item) => item.level === "urgent").length

  return (
    <Card className="border-2 overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <UserRoundX className="h-5 w-5 text-amber-600" />
              {title}
            </CardTitle>
            <CardDescription className="mt-1">{description}</CardDescription>
          </div>
          <div className="flex gap-2">
            <Badge variant="outline">{followUp.length} em atenção</Badge>
            {urgentCount > 0 && <Badge className="bg-red-600 hover:bg-red-600">{urgentCount} urgentes</Badge>}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {followUp.length > 4 && (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar aluno..." className="pl-9" />
          </div>
        )}

        {followUp.length === 0 ? (
          <div className="rounded-xl border bg-emerald-50/60 p-4 text-sm text-emerald-800 flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 shrink-0" />
            Nenhum aluno apresenta sequência preocupante de faltas neste momento.
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {filtered.map(({ student, rate, consecutiveAbsences, total, absent, level, lastDate }) => {
              const fatherWhats = whatsappUrl(student.fatherPhone, student.name)
              const motherWhats = whatsappUrl(student.motherPhone, student.name)
              const primaryWhats = motherWhats || fatherWhats
              return (
                <div key={student.id} className={`rounded-xl border p-4 ${level === "urgent" ? "border-red-200 bg-red-50/60" : "border-amber-200 bg-amber-50/60"}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold truncate">{student.name}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Últimas {total} chamadas: {absent} falta(s) • {rate}% de presença
                      </p>
                    </div>
                    <Badge className={level === "urgent" ? "bg-red-600 hover:bg-red-600" : "bg-amber-500 hover:bg-amber-500"}>
                      {level === "urgent" ? "Urgente" : "Atenção"}
                    </Badge>
                  </div>

                  <div className="mt-3 flex items-center gap-2 text-sm">
                    <AlertTriangle className={`h-4 w-4 ${level === "urgent" ? "text-red-600" : "text-amber-600"}`} />
                    <span className="font-medium">{consecutiveAbsences} falta(s) consecutiva(s)</span>
                    {lastDate && <span className="text-xs text-muted-foreground">• última chamada {new Date(lastDate + "T00:00:00").toLocaleDateString("pt-BR")}</span>}
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {primaryWhats ? (
                      <Button size="sm" asChild className="h-9">
                        <a href={primaryWhats} target="_blank" rel="noreferrer">
                          <MessageCircle className="mr-2 h-4 w-4" /> WhatsApp
                        </a>
                      </Button>
                    ) : (
                      <Badge variant="outline" className="h-9 px-3 text-muted-foreground">Sem WhatsApp cadastrado</Badge>
                    )}
                    {student.fatherPhone && (
                      <Button size="sm" variant="outline" asChild className="h-9">
                        <a href={`tel:${onlyDigits(student.fatherPhone)}`}><Phone className="mr-2 h-4 w-4" /> Responsável</a>
                      </Button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
