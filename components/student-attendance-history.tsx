"use client"

import { useEffect, useMemo, useState } from "react"
import { CalendarCheck, AlertTriangle, CheckCircle2, XCircle, Loader2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { getBrowserClient } from "@/lib/supabase/client"

type RecordRow = { date: string; status: "Presente" | "Ausente"; schedule: string }
type JoinedRow = { status: string; attendance: { date: string; class_schedule: string } | { date: string; class_schedule: string }[] | null }

function localDate() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo", year: "numeric", month: "2-digit", day: "2-digit",
  }).format(new Date())
}
function mondayOf(dateStr: string) {
  const date = new Date(dateStr + "T12:00:00Z")
  const weekday = date.getUTCDay()
  date.setUTCDate(date.getUTCDate() - (weekday === 0 ? 6 : weekday - 1))
  return date.toISOString().slice(0, 10)
}
function dateDaysAgo(dateStr: string, today: string) {
  return Math.round((Date.parse(today + "T12:00:00Z") - Date.parse(dateStr + "T12:00:00Z")) / 86400000)
}
export function StudentAttendanceHistory({ studentId, registrationDate, isActive }: {
  studentId: string; registrationDate?: string; isActive: boolean
}) {
  const [records, setRecords] = useState<RecordRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  useEffect(() => {
    let alive = true
    const load = async () => {
      setLoading(true)
      setError("")
      try {
        const rows: RecordRow[] = []
        const db = getBrowserClient()
        for (let start = 0; ; start += 1000) {
          const { data, error: queryError } = await db.from("attendance_records")
            .select("status,attendance:attendance_id(date,class_schedule)")
            .eq("student_id", studentId).order("id").range(start, start + 999)
          if (queryError) throw queryError
          for (const row of (data || []) as JoinedRow[]) {
            const attendance = Array.isArray(row.attendance) ? row.attendance[0] : row.attendance
            if (!attendance || !/^\d{4}-\d{2}-\d{2}$/.test(attendance.date)) continue
            if (row.status !== "Presente" && row.status !== "Ausente") continue
            rows.push({ date: attendance.date, status: row.status, schedule: attendance.class_schedule })
          }
          if (!data || data.length < 1000) break
        }
        if (alive) setRecords(rows.sort((a, b) => b.date.localeCompare(a.date) || b.schedule.localeCompare(a.schedule)))
      } catch (cause) {
        console.error("[SIGA] Falha ao carregar frequência do aluno:", cause)
        if (alive) setError("Não foi possível carregar o histórico de chamadas. Tente atualizar a tela.")
      } finally { if (alive) setLoading(false) }
    }
    void load()
    return () => { alive = false }
  }, [studentId])

  const stats = useMemo(() => {
    const present = records.filter(row => row.status === "Presente").length
    const absent = records.filter(row => row.status === "Ausente").length
    const lastPresent = records.find(row => row.status === "Presente")?.date
    const weeks = new Map<string, { present: boolean; absent: boolean; newest: string }>()
    const today = localDate()
    for (const row of records) {
      if (row.date > today || dateDaysAgo(row.date, today) > 70) continue
      const monday = mondayOf(row.date)
      const w = weeks.get(monday) || { present: false, absent: false, newest: row.date }
      if (row.status === "Presente") w.present = true
      if (row.status === "Ausente") w.absent = true
      if (row.date > w.newest) w.newest = row.date
      weeks.set(monday, w)
    }
    const lastThree = [...weeks.entries()].sort((a,b)=>b[0].localeCompare(a[0])).slice(0,3)
    const threeWeeks = lastThree.length === 3
      && lastThree.every(([,week]) => week.absent && !week.present)
      && dateDaysAgo(lastThree[2][0], lastThree[0][0]) === 14
      && dateDaysAgo(lastThree[0][1].newest, today) <= 7
      && (!lastPresent || dateDaysAgo(lastPresent, today) >= 21)
      && (!!registrationDate && dateDaysAgo(registrationDate.slice(0,10), today) >= 21)
    return { present, absent, lastPresent, threeWeeks: isActive && threeWeeks }
  }, [records, registrationDate, isActive])

  return (
    <Card className="border-2">
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><CalendarCheck className="h-5 w-5" /> Frequência nos treinos</CardTitle>
        <CardDescription>Histórico completo das chamadas registradas. Dias sem chamada não contam como falta.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <p className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Carregando presenças e faltas...</p>
        ) : error ? <p role="alert" className="text-sm text-destructive">{error}</p> : (
          <>
            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-lg bg-emerald-50 p-3 text-center"><p className="text-2xl font-bold text-emerald-700">{stats.present}</p><p className="text-xs text-emerald-800">Presenças</p></div>
              <div className="rounded-lg bg-red-50 p-3 text-center"><p className="text-2xl font-bold text-red-700">{stats.absent}</p><p className="text-xs text-red-800">Faltas</p></div>
              <div className="rounded-lg bg-slate-50 p-3 text-center"><p className="text-2xl font-bold">{records.length ? Math.round(stats.present / records.length * 100) : 0}%</p><p className="text-xs text-muted-foreground">Frequência</p></div>
            </div>
            {stats.threeWeeks && (
              <div role="alert" className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
                <p className="flex items-center gap-2 font-semibold"><AlertTriangle className="h-5 w-5 shrink-0" /> Alerta: três semanas sem presença</p>
                <p className="mt-1">Há faltas registradas em três semanas consecutivas, sem presença nesse período. Entre em contato com a família.</p>
              </div>
            )}
            <p className="text-sm text-muted-foreground">Última presença: {stats.lastPresent ? new Date(stats.lastPresent + "T12:00:00").toLocaleDateString("pt-BR") : "Ainda não registrada"}</p>
            {records.length ? (
              <div className="max-h-96 divide-y overflow-y-auto rounded-lg border">
                {records.map((item,index) => (
                  <div key={`${item.date}-${item.schedule}-${index}`} className="flex items-center justify-between gap-3 px-3 py-2.5 text-sm">
                    <span>{new Date(item.date + "T12:00:00").toLocaleDateString("pt-BR")} <span className="text-xs text-muted-foreground">{item.schedule?.replace("-", " às ")}</span></span>
                    <span className={`inline-flex items-center gap-1 whitespace-nowrap font-medium ${item.status === "Presente" ? "text-emerald-700" : "text-red-700"}`}>
                      {item.status === "Presente" ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}{item.status}
                    </span>
                  </div>
                ))}
              </div>
            ) : <p className="text-sm text-muted-foreground">Ainda não há chamadas registradas para este aluno.</p>}
          </>
        )}
      </CardContent>
    </Card>
  )
}
