"use client"

import { useMemo, useState } from "react"
import Image from "next/image"
import { useAuth } from "@/lib/contexts/auth-context"
import { useStudents } from "@/lib/hooks/use-students"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { LoadingStudents } from "@/components/loading-students"
import { useToast } from "@/hooks/use-toast"
import type { Student, DayScheduleConfig, WeekDay, ClassSchedule } from "@/lib/types"
import { ArrowLeft, ArrowRight, CalendarDays, Check, Clock3, GraduationCap, Plus, Trash2, Users, X } from "lucide-react"

const DAYS: WeekDay[] = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta"]
const TIMES: ClassSchedule[] = ["18:00-19:30", "19:30-21:00"]
const dayIndex = (day: string) => { const index = DAYS.indexOf(day as WeekDay); return index < 0 ? 99 : index }
const formatTime = (time: string) => time.replace("-", " às ")

function schedulesOf(student: Student): DayScheduleConfig[] {
  if (student.scheduleConfigs?.length) return student.scheduleConfigs.map((config) => ({ ...config }))
  return (student.classDays || []).map((day) => ({ day, schedule: student.classSchedule || TIMES[0] }))
}

function StudentPhoto({ student, size = "md" }: { student: Student; size?: "md" | "lg" }) {
  return (
    <div className={`relative shrink-0 overflow-hidden rounded-2xl border border-border/60 bg-muted ${size === "lg" ? "h-16 w-16 sm:h-20 sm:w-20" : "h-12 w-12 sm:h-14 sm:w-14"}`}>
      {student.thumbnailUrl || student.photo ? (
        <Image src={(student.thumbnailUrl || student.photo)!} alt={`Foto de ${student.name}`} fill className="object-cover" unoptimized />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-muted-foreground"><Users className="h-6 w-6" /></div>
      )}
    </div>
  )
}

export default function TrainerDashboardPage() {
  const { user } = useAuth()
  const { students, isLoading, updateStudent } = useStudents({ includePayments: false, lightweightPhotos: true })
  const { toast } = useToast()
  const [selectedClass, setSelectedClass] = useState<string | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [draft, setDraft] = useState<DayScheduleConfig[]>([])
  const [saving, setSaving] = useState(false)

  const classes = useMemo(() => {
    const map = new Map<string, { day: string; schedule: string; students: Student[] }>()
    students.filter((student) => student.isActive).forEach((student) => {
      schedulesOf(student).forEach(({ day, schedule }) => {
        const key = `${day}|${schedule}`
        if (!map.has(key)) map.set(key, { day, schedule, students: [] })
        const entry = map.get(key)!
        if (!entry.students.some((item) => item.id === student.id)) entry.students.push(student)
      })
    })
    return [...map.entries()].sort((a, b) => dayIndex(a[1].day) - dayIndex(b[1].day) || a[1].schedule.localeCompare(b[1].schedule))
  }, [students])

  const currentClass = classes.find(([key]) => key === selectedClass)?.[1]
  const selectedStudent = students.find((student) => student.id === selectedId)
  const totalStudents = new Set(classes.flatMap(([, entry]) => entry.students.map((student) => student.id))).size
  const openStudent = (student: Student) => { setSelectedId(student.id); setDraft(schedulesOf(student)) }
  const closeEditor = () => { if (!saving) setSelectedId(null) }
  const change = (index: number, update: Partial<DayScheduleConfig>) => {
    setDraft((previous) => previous.map((config, i) => i === index ? { ...config, ...update } : config))
  }
  const save = async () => {
    if (!selectedStudent || saving) return
    if (!draft.length || draft.some(({ day, schedule }) => !day || !schedule) || new Set(draft.map(({ day }) => day)).size !== draft.length) {
      toast({ title: "Verifique os horários", description: "Escolha dias diferentes e horários válidos.", variant: "destructive" })
      return
    }
    setSaving(true)
    try {
      await updateStudent(selectedStudent.id, { scheduleConfigs: draft, classDays: draft.map(({ day }) => day), classSchedule: draft[0].schedule })
      toast({ title: "Horários atualizados", description: "As turmas do aluno foram atualizadas com sucesso." })
      setSelectedId(null)
    } catch (error) {
      toast({ title: "Não foi possível salvar", description: error instanceof Error ? error.message : "Tente novamente.", variant: "destructive" })
    } finally { setSaving(false) }
  }

  if (isLoading) return <LoadingStudents message="Carregando dashboard..." />

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 pb-10 sm:space-y-8">
      <header className="relative overflow-hidden rounded-3xl border border-primary/15 bg-gradient-to-br from-primary/15 via-background to-background p-5 sm:p-8">
        <div className="relative flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm"><GraduationCap className="h-6 w-6" /></div>
          <div className="min-w-0"><p className="mb-1 text-xs font-semibold uppercase tracking-[0.16em] text-primary">Painel do treinador</p><h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Olá, {user?.name || "Treinador"}!</h1><p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">Acompanhe suas turmas e organize os dias e horários dos alunos em um só lugar.</p></div>
        </div>
      </header>

      <section className="grid grid-cols-2 gap-3 sm:gap-5" aria-label="Resumo das turmas">
        <Card className="rounded-2xl border-border/70 shadow-sm"><CardContent className="flex items-center gap-3 p-4 sm:p-6"><div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"><CalendarDays className="h-5 w-5" /></div><div><p className="text-xs font-medium text-muted-foreground sm:text-sm">Turmas ativas</p><p className="text-2xl font-bold tabular-nums sm:text-3xl">{classes.length}</p></div></CardContent></Card>
        <Card className="rounded-2xl border-border/70 shadow-sm"><CardContent className="flex items-center gap-3 p-4 sm:p-6"><div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"><Users className="h-5 w-5" /></div><div><p className="text-xs font-medium text-muted-foreground sm:text-sm">Alunos únicos</p><p className="text-2xl font-bold tabular-nums sm:text-3xl">{totalStudents}</p></div></CardContent></Card>
      </section>

      <Card className="overflow-hidden rounded-3xl border-border/70 shadow-sm">
        <CardHeader className="border-b bg-muted/20 p-5 sm:p-7">
          {currentClass ? (
            <><Button variant="ghost" size="sm" className="-ml-2 mb-2 w-fit gap-2 text-muted-foreground" onClick={() => setSelectedClass(null)}><ArrowLeft className="h-4 w-4" /> Todas as turmas</Button><div className="flex flex-wrap items-center justify-between gap-3"><div><CardTitle className="text-xl sm:text-2xl">{currentClass.day}-feira</CardTitle><CardDescription className="mt-1 flex items-center gap-2"><Clock3 className="h-4 w-4" /> {formatTime(currentClass.schedule)}</CardDescription></div><span className="rounded-full border bg-background px-3 py-1 text-xs font-semibold text-foreground">{currentClass.students.length} {currentClass.students.length === 1 ? "aluno" : "alunos"}</span></div></>
          ) : (
            <><div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary"><CalendarDays className="h-5 w-5" /></div><div><CardTitle className="text-xl sm:text-2xl">Suas turmas</CardTitle><CardDescription className="mt-1">Selecione uma turma para visualizar seus alunos.</CardDescription></div></div></>
          )}
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          {currentClass ? (
            <div className="grid gap-3 sm:grid-cols-2">{[...currentClass.students].sort((a, b) => a.name.localeCompare(b.name, "pt-BR")).map((student) => (
              <button key={student.id} type="button" onClick={() => openStudent(student)} className="group flex min-w-0 items-center gap-3 rounded-2xl border border-border/70 bg-card p-3 text-left shadow-sm transition-all hover:border-primary/50 hover:bg-primary/5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary sm:p-4"><StudentPhoto student={student} /><div className="min-w-0 flex-1"><p className="break-words text-sm font-semibold sm:text-base">{student.name}</p><p className="mt-1 text-xs text-muted-foreground">Editar dias e horários</p></div><ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary" /></button>
            ))}</div>
          ) : classes.length ? (
            <div className="grid gap-3 sm:grid-cols-2">{classes.map(([key, entry]) => (
              <button key={key} type="button" onClick={() => setSelectedClass(key)} className="group flex flex-col gap-4 rounded-2xl border border-border/70 bg-card p-4 text-left shadow-sm transition-all hover:border-primary/50 hover:bg-primary/5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary sm:p-5"><div className="flex items-start justify-between gap-3"><div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary"><CalendarDays className="h-5 w-5" /></div><ArrowRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary" /></div><div><p className="text-lg font-bold">{entry.day}-feira</p><p className="mt-1 flex items-center gap-2 text-sm text-muted-foreground"><Clock3 className="h-4 w-4" />{formatTime(entry.schedule)}</p></div><div className="flex items-center justify-between border-t pt-3"><span className="flex items-center gap-2 text-xs font-medium text-muted-foreground"><Users className="h-4 w-4" />{entry.students.length} {entry.students.length === 1 ? "aluno" : "alunos"}</span><span className="text-xs font-semibold text-primary">Ver turma</span></div></button>
            ))}</div>
          ) : <div className="flex flex-col items-center gap-3 py-12 text-center text-muted-foreground"><CalendarDays className="h-10 w-10 opacity-40" /><p className="font-medium">Nenhuma turma encontrada</p><p className="text-sm">As turmas com alunos ativos aparecerão aqui.</p></div>}
        </CardContent>
      </Card>

      {selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-3 backdrop-blur-sm sm:p-6" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) closeEditor() }}>
          <Card role="dialog" aria-modal="true" aria-label={`Editar horários de ${selectedStudent.name}`} className="flex max-h-[92dvh] w-full max-w-xl flex-col overflow-hidden rounded-3xl border-border/70 shadow-2xl">
            <CardHeader className="shrink-0 border-b bg-muted/25 p-5 sm:p-6"><div className="flex items-start justify-between gap-3"><div><p className="mb-1 text-xs font-semibold uppercase tracking-wider text-primary">Organização de treinos</p><CardTitle className="text-xl sm:text-2xl">Editar dias e horários</CardTitle><CardDescription className="mt-1">Altere somente os horários de treino deste aluno.</CardDescription></div><Button size="icon" variant="ghost" onClick={closeEditor} disabled={saving} aria-label="Fechar edição"><X className="h-5 w-5" /></Button></div></CardHeader>
            <CardContent className="min-h-0 flex-1 space-y-5 overflow-y-auto p-5 sm:p-6"><div className="flex items-center gap-4 rounded-2xl border bg-muted/25 p-3 sm:p-4"><StudentPhoto student={selectedStudent} size="lg" /><div className="min-w-0"><p className="text-xs font-medium text-muted-foreground">Aluno</p><p className="break-words text-base font-bold sm:text-lg">{selectedStudent.name}</p><p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground"><Check className="h-3.5 w-3.5 text-primary" /> Nome e foto protegidos</p></div></div><div className="flex items-center justify-between gap-2"><div><h3 className="font-semibold">Dias de treino</h3><p className="text-xs text-muted-foreground">Escolha o dia e o horário de cada treino.</p></div><span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">{draft.length} {draft.length === 1 ? "dia" : "dias"}</span></div><div className="space-y-3">{draft.map((config, index) => (
              <div key={index} className="rounded-2xl border border-border/80 bg-card p-3 sm:p-4"><div className="mb-3 flex items-center justify-between"><span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Treino {index + 1}</span>{draft.length > 1 && <Button variant="ghost" size="sm" className="h-8 gap-1 text-muted-foreground hover:text-destructive" onClick={() => setDraft((previous) => previous.filter((_, i) => i !== index))} disabled={saving}><Trash2 className="h-3.5 w-3.5" /> Remover</Button>}</div><div className="grid gap-3 sm:grid-cols-2"><div className="space-y-1.5"><label className="text-xs font-medium text-muted-foreground">Dia da semana</label><Select value={config.day} onValueChange={(value) => change(index, { day: value as WeekDay })} disabled={saving}><SelectTrigger aria-label={`Dia do treino ${index + 1}`} className="w-full"><SelectValue placeholder="Selecione o dia" /></SelectTrigger><SelectContent>{DAYS.map((day) => <SelectItem key={day} value={day} disabled={draft.some((other, i) => i !== index && other.day === day)}>{day}-feira</SelectItem>)}</SelectContent></Select></div><div className="space-y-1.5"><label className="text-xs font-medium text-muted-foreground">Horário</label><Select value={config.schedule} onValueChange={(value) => change(index, { schedule: value as ClassSchedule })} disabled={saving}><SelectTrigger aria-label={`Horário do treino ${index + 1}`} className="w-full"><SelectValue placeholder="Selecione o horário" /></SelectTrigger><SelectContent>{TIMES.map((time) => <SelectItem key={time} value={time}>{formatTime(time)}</SelectItem>)}</SelectContent></Select></div></div></div>
            ))}</div>{draft.length < DAYS.length && <Button variant="outline" className="w-full gap-2 rounded-xl border-dashed" disabled={saving} onClick={() => { const available = DAYS.find((day) => !draft.some((config) => config.day === day)); if (available) setDraft((previous) => [...previous, { day: available, schedule: TIMES[0] }]) }}><Plus className="h-4 w-4" /> Adicionar outro dia</Button>}</CardContent>
            <div className="flex shrink-0 gap-3 border-t bg-background p-4 sm:p-6"><Button variant="outline" className="flex-1 rounded-xl" disabled={saving} onClick={closeEditor}>Cancelar</Button><Button className="flex-1 gap-2 rounded-xl" disabled={saving} onClick={save}>{saving ? "Salvando..." : <><Check className="h-4 w-4" /> Salvar alterações</>}</Button></div>
          </Card>
        </div>
      )}
    </div>
  )
}
