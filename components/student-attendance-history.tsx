"use client"

import { useEffect, useMemo, useState } from "react"
import { CalendarCheck, AlertTriangle, CheckCircle2, XCircle, Loader2, ChevronLeft, ChevronRight, CalendarX2, Clock3 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { getBrowserClient } from "@/lib/supabase/client"
import type { ClassSchedule, DayScheduleConfig, WeekDay } from "@/lib/types"
import {
  absentForThreeConsecutiveWeeks, localToday, monthAttendanceRows, type AttendanceEntry,
} from "@/lib/utils/attendance-insights"

type JoinedRow = {
  status: string
  attendance: { date: string; class_schedule: string } | { date: string; class_schedule: string }[] | null
}
type Cancellation = { date: string; class_schedule: string }
type Props = {
  studentId: string
  registrationDate?: string
  isActive: boolean
  classSchedule?: ClassSchedule
  classDays?: WeekDay[]
  scheduleConfigs?: DayScheduleConfig[]
}

const fmt = (date: string) => new Date(date + "T12:00:00Z")
  .toLocaleDateString("pt-BR", { timeZone: "UTC", weekday: "short", day: "2-digit", month: "2-digit" })
const monthLabel = (month: string) => {
  const [year, number] = month.split("-").map(Number)
  return new Date(Date.UTC(year, number - 1, 1)).toLocaleDateString("pt-BR", { month: "long", year: "numeric", timeZone: "UTC" })
}
const shiftMonth = (month: string, offset: number) => {
  const [year, number] = month.split("-").map(Number)
  const next = new Date(Date.UTC(year, number - 1 + offset, 1))
  return next.toISOString().slice(0, 7)
}

export function StudentAttendanceHistory({
  studentId, registrationDate, isActive, classSchedule, classDays, scheduleConfigs,
}: Props) {
  const [month, setMonth] = useState(() => localToday().slice(0, 7))
  const [records, setRecords] = useState<AttendanceEntry[]>([])
  const [cancellations, setCancellations] = useState<Cancellation[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMonth, setLoadingMonth] = useState(true)
  const [error, setError] = useState("")
  const [monthError, setMonthError] = useState("")
  const today = localToday()
  const student = useMemo(() => ({
    id: studentId, registrationDate, isActive, classSchedule, classDays, scheduleConfigs,
  }), [studentId, registrationDate, isActive, classSchedule, classDays, scheduleConfigs])

  useEffect(() => {
    let alive = true
    const load = async () => {
      setLoading(true)
      setError("")
      try {
        const items: AttendanceEntry[] = []
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
            items.push({ studentId, date: attendance.date, schedule: attendance.class_schedule, status: row.status })
          }
          if (!data || data.length < 1000) break
        }
        if (alive) setRecords(items)
      } catch (cause) {
        console.error("[SIGA] Falha ao carregar frequência:", cause)
        if (alive) setError("Não foi possível consultar as chamadas do aluno.")
      } finally { if (alive) setLoading(false) }
    }
    void load()
    return () => { alive = false }
  }, [studentId])

  useEffect(() => {
    let alive = true
    const load = async () => {
      setLoadingMonth(true)
      setMonthError("")
      const [year, number] = month.split("-").map(Number)
      const lastDay = String(new Date(Date.UTC(year, number, 0)).getUTCDate()).padStart(2, "0")
      try {
        const { data, error: queryError } = await getBrowserClient()
          .from("training_cancellations").select("date,class_schedule")
          .gte("date", month + "-01").lte("date", month + "-" + lastDay)
        if (queryError) throw queryError
        if (alive) setCancellations((data || []) as Cancellation[])
      } catch (cause) {
        console.error("[SIGA] Falha ao consultar cancelamentos:", cause)
        if (alive) { setCancellations([]); setMonthError("Não foi possível conferir os treinos cancelados.") }
      } finally { if (alive) setLoadingMonth(false) }
    }
    void load()
    return () => { alive = false }
  }, [month])

  const rows = useMemo(
    () => monthAttendanceRows(student, records, cancellations, month, today),
    [student, records, cancellations, month, today],
  )
  const stats = useMemo(() => {
    const present = rows.filter(row => row.status === "Presente").length
    const absent = rows.filter(row => row.status === "Ausente").length
    const cancelled = rows.filter(row => row.status === "Cancelado").length
    const withoutCall = rows.filter(row => row.status === "Sem chamada").length
    const latestPresent = records.filter(row => row.status === "Presente").map(row => row.date).sort().at(-1)
    return {
      present, absent, cancelled, withoutCall, latestPresent,
      frequency: present + absent > 0 ? Math.round(100 * present / (present + absent)) : null,
      threeWeeks: absentForThreeConsecutiveWeeks(student, records, today),
    }
  }, [rows, records, student, today])

  return (
    <Card className="border-2">
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><CalendarCheck className="h-5 w-5" /> Frequência nos treinos</CardTitle>
        <CardDescription>Por mês, conforme os dias e horários de treino cadastrados. Um dia sem chamada nunca conta como falta.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between gap-2 rounded-lg border p-2">
          <Button size="icon" variant="ghost" onClick={() => setMonth(current => shiftMonth(current, -1))} aria-label="Mês anterior"><ChevronLeft className="h-4 w-4" /></Button>
          <span className="text-sm font-semibold capitalize">{monthLabel(month)}</span>
          <Button size="icon" variant="ghost" disabled={month >= today.slice(0, 7)} onClick={() => setMonth(current => shiftMonth(current, 1))} aria-label="Próximo mês"><ChevronRight className="h-4 w-4" /></Button>
        </div>
        {loading || loadingMonth ? (
          <p className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Carregando a frequência do mês...</p>
        ) : error ? <p role="alert" className="text-sm text-destructive">{error}</p> : (
          <>
            {monthError && <p role="alert" className="text-sm text-destructive">{monthError}</p>}
            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-lg bg-emerald-50 p-3 text-center"><p className="text-2xl font-bold text-emerald-700">{stats.present}</p><p className="text-xs text-emerald-800">Presenças</p></div>
              <div className="rounded-lg bg-red-50 p-3 text-center"><p className="text-2xl font-bold text-red-700">{stats.absent}</p><p className="text-xs text-red-800">Faltas</p></div>
              <div className="rounded-lg bg-slate-50 p-3 text-center"><p className="text-2xl font-bold">{stats.frequency === null ? "—" : stats.frequency + "%"}</p><p className="text-xs text-muted-foreground">Frequência</p></div>
            </div>
            {stats.threeWeeks && (
              <div role="alert" className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
                <p className="flex items-center gap-2 font-semibold"><AlertTriangle className="h-5 w-5 shrink-0" /> Alerta: três semanas consecutivas de faltas</p>
                <p className="mt-1">Entre em contato com o responsável. Somente ausências confirmadas em chamadas entram nesse alerta.</p>
              </div>
            )}
            <p className="text-sm text-muted-foreground">
              {stats.withoutCall} treino(s) sem chamada · {stats.cancelled} cancelado(s). Última presença: {stats.latestPresent ? fmt(stats.latestPresent) : "não registrada"}.
            </p>
            {rows.length > 0 ? (
              <div className="max-h-96 divide-y overflow-y-auto rounded-lg border">
                {rows.map((item, index) => (
                  <div key={`${item.date}-${item.schedule}-${index}`} className="flex items-center justify-between gap-3 px-3 py-2.5 text-sm">
                    <span>{fmt(item.date)} <span className="text-xs text-muted-foreground">{item.schedule.replace("-", " às ")}</span></span>
                    <span className={`inline-flex items-center gap-1 whitespace-nowrap font-medium ${
                      item.status === "Presente" ? "text-emerald-700"
                        : item.status === "Ausente" ? "text-red-700"
                        : "text-muted-foreground"
                    }`}>
                      {item.status === "Presente" ? <CheckCircle2 className="h-4 w-4" />
                        : item.status === "Ausente" ? <XCircle className="h-4 w-4" />
                        : item.status === "Cancelado" ? <CalendarX2 className="h-4 w-4" />
                        : <Clock3 className="h-4 w-4" />}{item.status}
                    </span>
                  </div>
                ))}
              </div>
            ) : <p className="text-sm text-muted-foreground">Não há treinos previstos nem chamadas registradas neste mês.</p>}
          </>
        )}
      </CardContent>
    </Card>
  )
}
