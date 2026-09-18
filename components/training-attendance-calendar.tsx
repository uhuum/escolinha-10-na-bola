"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { ChevronLeft, ChevronRight, CalendarDays, Loader2 } from "lucide-react"
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
      setError("")
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
    setLoadingCancellations(true)
    setMonth(next)
    setSelected(dateKey(next))
  }
  const loading = isLoading || loadingCancellations

  return (
    <section className="min-w-0 space-y-4 overflow-hidden rounded-2xl border bg-card p-3 shadow-sm sm:p-6" aria-label="Calendário de treinos" aria-busy={loading}>
      <div className="space-y-1"><h2 className="flex items-center gap-2 text-lg font-bold sm:text-xl"><CalendarDays className="h-5 w-5 shrink-0" />Calendário de treinos</h2><p className="text-sm text-muted-foreground">Selecione um dia para consultar cada horário separadamente.</p></div>
      <div className="grid min-w-0 grid-cols-[40px_minmax(0,1fr)_40px] items-center gap-2 rounded-xl border p-2 sm:grid-cols-[44px_minmax(0,1fr)_44px]" aria-label="Navegação entre meses">
        <button type="button" onClick={() => changeMonth(-1)} aria-label="Mês anterior" className="flex h-10 w-10 items-center justify-center rounded-lg border hover:bg-muted"><ChevronLeft className="h-5 w-5" /></button>
        <span className="min-w-0 text-center text-sm font-semibold capitalize sm:text-base">{month.toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}</span>
        <button type="button" onClick={() => changeMonth(1)} aria-label="Próximo mês" className="flex h-10 w-10 items-center justify-center rounded-lg border hover:bg-muted"><ChevronRight className="h-5 w-5" /></button>
      </div>
      {loading ? (
        <div className="flex min-h-72 flex-col items-center justify-center gap-4 text-center" role="status" aria-live="polite"><Loader2 className="h-8 w-8 animate-spin text-primary" aria-hidden="true" /><p className="font-semibold">Carregando registros de treinos...</p><p className="text-sm text-muted-foreground">Aguarde enquanto preparamos o calendário.</p></div>
      ) : (
        <>
          {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
          <div className="grid min-w-0 grid-cols-7 gap-1 text-center text-xs sm:gap-2">{WEEKDAYS.map((name) => <span key={name} className="min-w-0 py-2 font-semibold text-muted-foreground">{name}</span>)}{cells.map((date, index) => {
            if (!date) return <span key={`empty-${index}`} />
            const key = dateKey(date)
            const attended = attendances.filter((item) => item.date === key).map((item) => item.classSchedule)
            const cancelled = cancellations.filter((item) => item.date === key).map((item) => item.class_schedule)
            const status = getTrainingDayStatus(date.getDay(), SCHEDULES, attended, cancelled)
            return <button key={key} type="button" onClick={() => setSelected(key)} aria-label={`${date.toLocaleDateString("pt-BR")}: ${labels[status]}`} aria-pressed={selected === key} className={`flex aspect-square min-w-0 flex-col items-center justify-center rounded-lg border p-0.5 transition-colors sm:min-h-16 ${colors[status]} ${selected === key ? "ring-2 ring-primary ring-offset-1" : ""}`}><span className="text-sm font-bold sm:text-base">{date.getDate()}</span><span className="hidden text-[10px] leading-tight sm:block">{labels[status]}</span><span className="mt-0.5 h-1.5 w-1.5 rounded-full bg-current sm:hidden" aria-hidden="true" /></button>
          })}</div>
          <div className="flex flex-wrap gap-2 text-xs">{(Object.keys(labels) as (keyof typeof labels)[]).map((status) => <span key={status} className={`rounded-full border px-2 py-1 ${colors[status]}`}>{labels[status]}</span>)}</div>
          <div className="space-y-3 border-t pt-4"><h3 className="font-bold">{day.toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long", year: "numeric" })}</h3>{weekend ? <p className="text-sm text-muted-foreground">Fim de semana: calendário neutro.</p> : SCHEDULES.map((schedule) => {
            const attendance = dayAttendances.find((item) => item.classSchedule === schedule)
            const cancellation = dayCancellations.find((item) => item.class_schedule === schedule)
            const status = getTrainingSlotStatus(schedule, attendance ? [schedule] : [], cancellation ? [schedule] : [])
            return <div key={schedule} className="flex min-w-0 flex-wrap items-center justify-between gap-3 rounded-xl border p-3"><div className="min-w-0"><p className="font-semibold">{schedule.replace("-", " às ")}</p><span className={`mt-1 inline-block rounded-full border px-2 py-0.5 text-xs ${colors[status]}`}>{labels[status]}</span>{cancellation && !attendance && <p className="mt-2 break-words text-sm text-muted-foreground">Motivo: {cancellation.reason}</p>}{attendance && <p className="mt-1 text-xs text-muted-foreground">{attendance.records.length} alunos registrados</p>}</div>{attendance && <Link href={`/presencas/${attendance.id}`} className="rounded-lg border px-3 py-2 text-sm font-semibold hover:bg-muted">Abrir chamada</Link>}</div>
          })}</div>
        </>
      )}
    </section>
  )
}
