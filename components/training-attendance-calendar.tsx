"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react"
import { useAttendance } from "@/lib/hooks/use-attendance"
import { getBrowserClient } from "@/lib/supabase/client"
import { getTrainingDayStatus, getTrainingSlotStatus } from "@/lib/utils/training-day-status"

const SCHEDULES = ["18:00-19:30", "19:30-21:00"] as const
const WEEKDAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"]
type Cancellation = { id: string; date: string; class_schedule: string; reason: string }
const colors = { realizado: "bg-emerald-100 text-emerald-800 border-emerald-300", cancelado: "bg-rose-100 text-rose-800 border-rose-300", pendente: "bg-amber-100 text-amber-800 border-amber-300", misto: "bg-violet-100 text-violet-800 border-violet-300", neutro: "bg-muted text-muted-foreground border-border" }
const labels = { realizado: "Realizado", cancelado: "Cancelado", pendente: "Pendente", misto: "Misto", neutro: "Neutro" }
const dateKey = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`

export function TrainingAttendanceCalendar() {
  const { attendances, isLoading } = useAttendance()
  const supabase = getBrowserClient()
  const [month, setMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1))
  const [selected, setSelected] = useState(() => dateKey(new Date()))
  const [cancellations, setCancellations] = useState<Cancellation[]>([])
  const [error, setError] = useState("")
  const [loadingCancellations, setLoadingCancellations] = useState(true)
  const start = dateKey(month)
  const end = dateKey(new Date(month.getFullYear(), month.getMonth() + 1, 0))

  useEffect(() => {
    let active = true
    const load = async () => {
      setLoadingCancellations(true)
      const { data, error: queryError } = await supabase.from("training_cancellations").select("id,date,class_schedule,reason").gte("date", start).lte("date", end)
      if (!active) return
      setCancellations(data || [])
      setError(queryError ? "Não foi possível carregar os cancelamentos. Os status podem estar incompletos." : "")
      setLoadingCancellations(false)
    }
    void load()
    return () => { active = false }
  }, [supabase, start, end])

  const cells = useMemo(() => {
    const first = new Date(month.getFullYear(), month.getMonth(), 1)
    const count = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate()
    return [...Array(first.getDay()).fill(null), ...Array.from({ length: count }, (_, i) => new Date(month.getFullYear(), month.getMonth(), i + 1))] as (Date | null)[]
  }, [month])

  const day = new Date(`${selected}T12:00:00`)
  const weekend = day.getDay() === 0 || day.getDay() === 6
  const dayAttendances = attendances.filter((item) => item.date === selected)
  const dayCancellations = cancellations.filter((item) => item.date === selected)
  const changeMonth = (offset: number) => {
    const next = new Date(month.getFullYear(), month.getMonth() + offset, 1)
    setMonth(next)
    setSelected(dateKey(next))
  }

  return (
    <section className="space-y-4 rounded-2xl border bg-card p-4 shadow-sm sm:p-6" aria-label="Calendário de treinos">
      <div className="flex items-center justify-between gap-3">
        <div><h2 className="flex items-center gap-2 text-xl font-bold"><CalendarDays className="h-5 w-5" />Calendário de treinos</h2><p className="text-sm text-muted-foreground">Selecione um dia para consultar cada horário separadamente.</p></div>
        <div className="flex shrink-0 items-center gap-1"><button type="button" onClick={() => changeMonth(-1)} aria-label="Mês anterior" className="rounded-lg border p-2 hover:bg-muted"><ChevronLeft className="h-4 w-4" /></button><span className="min-w-24 text-center text-sm font-semibold capitalize sm:min-w-36">{month.toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}</span><button type="button" onClick={() => changeMonth(1)} aria-label="Próximo mês" className="rounded-lg border p-2 hover:bg-muted"><ChevronRight className="h-4 w-4" /></button></div>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-xs sm:gap-2">{WEEKDAYS.map((name) => <span key={name} className="py-2 font-semibold text-muted-foreground">{name}</span>)}{cells.map((date, index) => {
        if (!date) return <span key={`empty-${index}`} />
        const key = dateKey(date)
        const attended = attendances.filter((item) => item.date === key).map((item) => item.classSchedule)
        const cancelled = cancellations.filter((item) => item.date === key).map((item) => item.class_schedule)
        const status = getTrainingDayStatus(date.getDay(), SCHEDULES, attended, cancelled)
        return <button key={key} type="button" onClick={() => setSelected(key)} aria-label={`${date.toLocaleDateString("pt-BR")}: ${labels[status]}`} aria-pressed={selected === key} className={`flex min-h-12 flex-col items-center justify-center rounded-lg border p-1 transition-colors sm:min-h-16 ${colors[status]} ${selected === key ? "ring-2 ring-primary ring-offset-2" : ""}`}><span className="font-bold">{date.getDate()}</span><span className="text-[9px] leading-tight sm:text-xs">{labels[status]}</span></button>
      })}</div>
      <div className="flex flex-wrap gap-2 text-xs">{(Object.keys(labels) as (keyof typeof labels)[]).map((status) => <span key={status} className={`rounded-full border px-2 py-1 ${colors[status]}`}>{labels[status]}</span>)}</div>
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      {(isLoading || loadingCancellations) && <p role="status" className="text-sm text-muted-foreground">Carregando registros de treinos...</p>}
      <div className="space-y-3 border-t pt-4"><h3 className="font-bold">{day.toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long", year: "numeric" })}</h3>{weekend ? <p className="text-sm text-muted-foreground">Fim de semana: calendário neutro.</p> : SCHEDULES.map((schedule) => {
        const attendance = dayAttendances.find((item) => item.classSchedule === schedule)
        const cancellation = dayCancellations.find((item) => item.class_schedule === schedule)
        const status = getTrainingSlotStatus(schedule, attendance ? [schedule] : [], cancellation ? [schedule] : [])
        return <div key={schedule} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border p-3"><div><p className="font-semibold">{schedule.replace("-", " às ")}</p><span className={`mt-1 inline-block rounded-full border px-2 py-0.5 text-xs ${colors[status]}`}>{labels[status]}</span>{cancellation && !attendance && <p className="mt-2 text-sm text-muted-foreground">Motivo: {cancellation.reason}</p>}{attendance && <p className="mt-1 text-xs text-muted-foreground">{attendance.records.length} alunos registrados</p>}</div>{attendance && <Link href={`/presencas/${attendance.id}`} className="rounded-lg border px-3 py-2 text-sm font-semibold hover:bg-muted">Abrir chamada</Link>}</div>
      })}</div>
    </section>
  )
}
