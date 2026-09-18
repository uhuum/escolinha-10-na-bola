"use client"

import { useEffect, useMemo, useState } from "react"
import { ChevronLeft, ChevronRight, CalendarDays, Loader2, ArrowLeft, Edit2 } from "lucide-react"
import { useAuth } from "@/lib/contexts/auth-context"
import { useAttendance } from "@/lib/hooks/use-attendance"
import { useStudents } from "@/lib/hooks/use-students"
import { getBrowserClient } from "@/lib/supabase/client"
import { getTrainingDayStatus, getTrainingSlotStatus } from "@/lib/utils/training-day-status"
import { AttendanceEditDialog } from "@/components/attendance-edit-dialog"
import { canEditAttendance } from "@/lib/utils/attendance-permissions"
import { useToast } from "@/hooks/use-toast"
import type { Attendance } from "@/lib/types"

const SCHEDULES = ["18:00-19:30", "19:30-21:00"] as const
const DAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"]
const labels = { realizado: "Realizado", cancelado: "Cancelado", pendente: "Pendente", misto: "Misto", neutro: "Neutro" }
const colors = { realizado: "bg-emerald-100 text-emerald-800 border-emerald-300", cancelado: "bg-rose-100 text-rose-800 border-rose-300", pendente: "bg-amber-100 text-amber-800 border-amber-300", misto: "bg-violet-100 text-violet-800 border-violet-300", neutro: "bg-muted text-muted-foreground border-border" }
const keyOf = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
type Cancellation = { id: string; date: string; class_schedule: string; reason: string }

export default function TrainerRelatorioPage() {
  const { user } = useAuth()
  const { attendances, updateAttendance, deleteAttendance, isLoading } = useAttendance()
  const { students, isLoading: studentsLoading } = useStudents({ includePayments: false, lightweightPhotos: true })
  const { toast } = useToast()
  const supabase = useMemo(() => getBrowserClient(), [])
  const [month, setMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1))
  const [selected, setSelected] = useState(() => keyOf(new Date()))
  const [opened, setOpened] = useState<Attendance | null>(null)
  const [editing, setEditing] = useState<Attendance | null>(null)
  const [cancellations, setCancellations] = useState<Cancellation[]>([])
  const [loadingCancellations, setLoadingCancellations] = useState(true)
  const [error, setError] = useState("")
  const start = keyOf(month)
  const end = keyOf(new Date(month.getFullYear(), month.getMonth() + 1, 0))

  useEffect(() => {
    let active = true
    const load = async () => {
      setLoadingCancellations(true)
      setError("")
      const { data, error: queryError } = await supabase.from("training_cancellations").select("id,date,class_schedule,reason").gte("date", start).lte("date", end)
      if (!active) return
      setCancellations(data || [])
      if (queryError) setError("Não foi possível carregar os cancelamentos. Tente novamente.")
      setLoadingCancellations(false)
    }
    void load()
    return () => { active = false }
  }, [supabase, start, end])

  const cells = useMemo(() => {
    const first = new Date(month.getFullYear(), month.getMonth(), 1)
    const count = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate()
    return [...Array(first.getDay()).fill(null), ...Array.from({ length: count }, (_, index) => new Date(month.getFullYear(), month.getMonth(), index + 1))] as (Date | null)[]
  }, [month])
  const day = new Date(`${selected}T12:00:00`)
  const weekend = day.getDay() === 0 || day.getDay() === 6
  const dayAttendances = attendances.filter((item) => item.date === selected)
  const dayCancellations = cancellations.filter((item) => item.date === selected)
  const loading = isLoading || loadingCancellations || studentsLoading
  const stats = attendances.reduce((acc, item) => {
    acc.total += item.records.length
    acc.present += item.records.filter((record) => record.status === "Presente").length
    acc.absent += item.records.filter((record) => record.status === "Ausente").length
    return acc
  }, { total: 0, present: 0, absent: 0 })
  const changeMonth = (offset: number) => {
    const next = new Date(month.getFullYear(), month.getMonth() + offset, 1)
    setLoadingCancellations(true)
    setMonth(next)
    setSelected(keyOf(next))
    setOpened(null)
  }
  const saveEdit = async (records: Record<string, "Presente" | "Ausente">) => {
    if (!editing) return
    try {
      await updateAttendance(editing.id, records)
      setEditing(null)
      setOpened(null)
      toast({ title: "Chamada atualizada" })
    } catch { toast({ title: "Não foi possível salvar", variant: "destructive" }) }
  }
  const removeAttendance = async () => {
    if (!editing) return
    try {
      await deleteAttendance(editing.id)
      setEditing(null)
      setOpened(null)
      toast({ title: "Registro apagado" })
    } catch { toast({ title: "Não foi possível apagar", variant: "destructive" }) }
  }

  return <div className="min-w-0 space-y-6">
    <div><h1 className="text-2xl font-bold sm:text-3xl">Relatório de Presenças</h1><p className="mt-2 text-sm text-muted-foreground">Selecione uma data e um horário para consultar a chamada, sem listas extensas.</p></div>
    <section className="min-w-0 space-y-4 overflow-hidden rounded-2xl border bg-card p-3 shadow-sm sm:p-6" aria-label="Calendário do treinador" aria-busy={loading}>
      <h2 className="flex items-center gap-2 text-lg font-bold sm:text-xl"><CalendarDays className="h-5 w-5 shrink-0" />Calendário de treinos</h2>
      <div className="grid min-w-0 grid-cols-[40px_minmax(0,1fr)_40px] items-center gap-2 rounded-xl border p-2">
        <button type="button" onClick={() => changeMonth(-1)} aria-label="Mês anterior" className="flex h-10 w-10 items-center justify-center rounded-lg border hover:bg-muted"><ChevronLeft className="h-5 w-5" /></button>
        <span className="min-w-0 text-center text-sm font-semibold capitalize sm:text-base">{month.toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}</span>
        <button type="button" onClick={() => changeMonth(1)} aria-label="Próximo mês" className="flex h-10 w-10 items-center justify-center rounded-lg border hover:bg-muted"><ChevronRight className="h-5 w-5" /></button>
      </div>
      {loading ? <div className="flex min-h-72 flex-col items-center justify-center gap-4 text-center" role="status" aria-live="polite"><Loader2 className="h-8 w-8 animate-spin text-primary" /><p className="font-semibold">Carregando registros de treinos...</p></div> : <>
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        <div className="grid min-w-0 grid-cols-7 gap-1 text-center text-xs sm:gap-2">{DAYS.map((name) => <span key={name} className="py-2 font-semibold text-muted-foreground">{name}</span>)}{cells.map((date, index) => {
          if (!date) return <span key={`empty-${index}`} />
          const key = keyOf(date)
          const attended = attendances.filter((item) => item.date === key).map((item) => item.classSchedule)
          const cancelled = cancellations.filter((item) => item.date === key).map((item) => item.class_schedule)
          const status = getTrainingDayStatus(date.getDay(), SCHEDULES, attended, cancelled)
          return <button key={key} type="button" onClick={() => { setSelected(key); setOpened(null) }} aria-label={`${date.toLocaleDateString("pt-BR")}: ${labels[status]}`} aria-pressed={selected === key} className={`flex aspect-square min-w-0 flex-col items-center justify-center rounded-lg border p-0.5 ${colors[status]} ${selected === key ? "ring-2 ring-primary ring-offset-1" : ""}`}><span className="text-sm font-bold sm:text-base">{date.getDate()}</span><span className="hidden text-[10px] sm:block">{labels[status]}</span><span className="mt-0.5 h-1.5 w-1.5 rounded-full bg-current sm:hidden" aria-hidden="true" /></button>
        })}</div>
        <div className="flex flex-wrap gap-2 text-xs">{(Object.keys(labels) as (keyof typeof labels)[]).map((status) => <span key={status} className={`rounded-full border px-2 py-1 ${colors[status]}`}>{labels[status]}</span>)}</div>
        <div className="space-y-3 border-t pt-4"><h3 className="font-bold capitalize">{day.toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long", year: "numeric" })}</h3>
          {opened ? <div className="space-y-4 rounded-xl border p-3"><button type="button" onClick={() => setOpened(null)} className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm"><ArrowLeft className="h-4 w-4" />Voltar ao calendário</button><h4 className="font-bold">{opened.classSchedule} · {opened.trainerName}</h4><p className="text-sm text-muted-foreground">{opened.records.filter((r) => r.status === "Presente").length} presentes · {opened.records.filter((r) => r.status === "Ausente").length} ausentes</p><div className="space-y-2">{opened.records.map((record) => <div key={record.studentId} className="flex items-center justify-between gap-2 rounded-lg border p-2 text-sm"><span className="min-w-0 break-words">{students.find((s) => s.id === record.studentId)?.name || "Aluno não encontrado"}</span><span className={`shrink-0 rounded-full px-2 py-1 text-xs ${record.status === "Presente" ? colors.realizado : colors.cancelado}`}>{record.status}</span></div>)}</div>{canEditAttendance(opened, user ? { id: user.id, role: user.role as "admin" | "coach" } : null) && <button type="button" onClick={() => setEditing(opened)} className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold"><Edit2 className="h-4 w-4" />Editar registro</button>}</div> : weekend ? <p className="text-sm text-muted-foreground">Fim de semana: calendário neutro.</p> : SCHEDULES.map((schedule) => {
            const attendance = dayAttendances.find((item) => item.classSchedule === schedule)
            const cancellation = dayCancellations.find((item) => item.class_schedule === schedule)
            const status = getTrainingSlotStatus(schedule, attendance ? [schedule] : [], cancellation ? [schedule] : [])
            return <div key={schedule} className="flex min-w-0 flex-wrap items-center justify-between gap-3 rounded-xl border p-3"><div className="min-w-0"><p className="font-semibold">{schedule.replace("-", " às ")}</p><span className={`mt-1 inline-block rounded-full border px-2 py-0.5 text-xs ${colors[status]}`}>{labels[status]}</span>{cancellation && !attendance && <p className="mt-2 break-words text-sm text-muted-foreground">Motivo: {cancellation.reason}</p>}{attendance && <p className="mt-1 text-xs text-muted-foreground">{attendance.records.length} alunos · Treinador: {attendance.trainerName}</p>}</div>{attendance && <button type="button" onClick={() => setOpened(attendance)} className="rounded-lg border px-3 py-2 text-sm font-semibold hover:bg-muted">Abrir chamada</button>}</div>
          })}</div>
      </>}
    </section>
    {!loading && <section className="grid gap-3 sm:grid-cols-3" aria-label="Estatísticas de presença"><div className="rounded-xl border p-4"><p className="text-sm text-muted-foreground">Total de registros</p><p className="text-2xl font-bold">{stats.total}</p></div><div className="rounded-xl border p-4"><p className="text-sm text-muted-foreground">Presenças</p><p className="text-2xl font-bold text-emerald-600">{stats.present}</p></div><div className="rounded-xl border p-4"><p className="text-sm text-muted-foreground">Ausências</p><p className="text-2xl font-bold text-rose-600">{stats.absent}</p></div></section>}
    {editing && <AttendanceEditDialog isOpen={!!editing} onClose={() => setEditing(null)} attendance={editing} students={students} onSave={saveEdit} onDelete={removeAttendance} />}
  </div>
}
