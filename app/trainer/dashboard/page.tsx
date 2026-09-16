"use client"

import { useMemo, useState } from "react"
import Image from "next/image"
import { useAuth } from "@/lib/contexts/auth-context"
import { useStudents } from "@/lib/hooks/use-students"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { LoadingStudents } from "@/components/loading-students"
import { useToast } from "@/hooks/use-toast"
import type { Student, DayScheduleConfig, WeekDay, ClassSchedule } from "@/lib/types"
import { ArrowLeft, Clock, Users, X, Plus, Trash2 } from "lucide-react"

const DAYS: WeekDay[] = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta"]
const TIMES: ClassSchedule[] = ["18:00-19:30", "19:30-21:00"]
const dayIndex = (day: string) => DAYS.indexOf(day as WeekDay)

function schedulesOf(student: Student): DayScheduleConfig[] {
  if (student.scheduleConfigs?.length) return student.scheduleConfigs.map((config) => ({ ...config }))
  return (student.classDays || []).map((day) => ({ day, schedule: student.classSchedule || TIMES[0] }))
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
    return [...map.entries()].sort((a, b) => {
      const dayDiff = dayIndex(a[1].day) - dayIndex(b[1].day)
      return dayDiff || a[1].schedule.localeCompare(b[1].schedule)
    })
  }, [students])

  const currentClass = classes.find(([key]) => key === selectedClass)?.[1]
  const selectedStudent = students.find((student) => student.id === selectedId)
  const openStudent = (student: Student) => {
    setSelectedId(student.id)
    setDraft(schedulesOf(student))
  }
  const change = (index: number, update: Partial<DayScheduleConfig>) => {
    setDraft((previous) => previous.map((config, i) => i === index ? { ...config, ...update } : config))
  }
  const save = async () => {
    if (!selectedStudent || saving) return
    if (!draft.length || draft.some(({ day, schedule }) => !day || !schedule) || new Set(draft.map(({ day }) => day)).size !== draft.length) {
      toast({ title: "Verifique os horários", description: "Selecione dias diferentes e horários válidos.", variant: "destructive" })
      return
    }
    setSaving(true)
    try {
      await updateStudent(selectedStudent.id, {
        scheduleConfigs: draft,
        classDays: draft.map(({ day }) => day),
        classSchedule: draft[0].schedule,
      })
      toast({ title: "Horários atualizados", description: "A alteração foi salva no cadastro do aluno." })
      setSelectedId(null)
    } catch (error) {
      toast({ title: "Não foi possível salvar", description: error instanceof Error ? error.message : "Tente novamente.", variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  if (isLoading) return <LoadingStudents message="Carregando dashboard..." />

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl sm:text-3xl font-bold">Olá, {user?.name || "Treinador"}!</h1><p className="text-muted-foreground">Abra uma turma para visualizar os alunos e editar seus horários.</p></div>
      <div className="grid grid-cols-2 gap-4">
        <Card><CardHeader><CardTitle className="text-sm">Suas turmas</CardTitle></CardHeader><CardContent className="text-3xl font-bold">{classes.length}</CardContent></Card>
        <Card><CardHeader><CardTitle className="text-sm">Total de alunos</CardTitle></CardHeader><CardContent className="text-3xl font-bold">{new Set(classes.flatMap(([, value]) => value.students.map((student) => student.id))).size}</CardContent></Card>
      </div>
      {currentClass ? (
        <Card><CardHeader><Button variant="ghost" className="w-fit gap-2" onClick={() => setSelectedClass(null)}><ArrowLeft className="h-4 w-4" /> Voltar às turmas</Button><CardTitle>{currentClass.day} — {currentClass.schedule}</CardTitle></CardHeader><CardContent className="grid gap-3 sm:grid-cols-2">{currentClass.students.map((student) => <button type="button" key={student.id} onClick={() => openStudent(student)} className="flex items-center gap-3 rounded-xl border p-3 text-left hover:border-primary focus-visible:outline-primary"><div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-full bg-muted">{student.photo || student.thumbnailUrl ? <Image src={(student.thumbnailUrl || student.photo)!} alt={student.name} fill className="object-cover" unoptimized /> : <Users className="m-4 h-6 w-6" />}</div><span className="font-medium">{student.name}</span></button>)}</CardContent></Card>
      ) : (
        <Card><CardHeader><CardTitle>Detalhes das turmas</CardTitle></CardHeader><CardContent className="grid gap-3 sm:grid-cols-2">{classes.length ? classes.map(([key, entry]) => <button key={key} type="button" onClick={() => setSelectedClass(key)} className="rounded-xl border-2 p-4 text-left hover:border-primary focus-visible:outline-primary"><div className="flex items-center gap-2 font-bold"><Clock className="h-5 w-5" />{entry.day}</div><p className="text-muted-foreground">{entry.schedule}</p><p className="mt-2 font-medium">{entry.students.length} aluno(s) — clicar para abrir</p></button>) : <p className="text-muted-foreground">Nenhuma turma encontrada.</p>}</CardContent></Card>
      )}
      {selectedStudent && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" role="presentation"><Card role="dialog" aria-modal="true" aria-label="Editar horários do aluno" className="max-h-[90vh] w-full max-w-lg overflow-y-auto"><CardHeader><div className="flex justify-between gap-3"><CardTitle>Alterar dias e horários</CardTitle><Button size="icon" variant="ghost" onClick={() => setSelectedId(null)} disabled={saving} aria-label="Fechar"><X className="h-5 w-5" /></Button></div></CardHeader><CardContent className="space-y-4"><div className="flex items-center gap-3"><div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-full bg-muted">{selectedStudent.photo || selectedStudent.thumbnailUrl ? <Image src={(selectedStudent.thumbnailUrl || selectedStudent.photo)!} alt={selectedStudent.name} fill className="object-cover" unoptimized /> : <Users className="m-6 h-8 w-8" />}</div><strong>{selectedStudent.name}</strong></div><p className="text-sm text-muted-foreground">Somente dias e horários podem ser alterados.</p>{draft.map((config, index) => <div key={index} className="flex gap-2"><Select value={config.day} onValueChange={(value) => change(index, { day: value as WeekDay })}><SelectTrigger aria-label="Dia de treino"><SelectValue placeholder="Dia" /></SelectTrigger><SelectContent>{DAYS.map((day) => <SelectItem key={day} value={day} disabled={draft.some((other, i) => i !== index && other.day === day)}>{day}</SelectItem>)}</SelectContent></Select><Select value={config.schedule} onValueChange={(value) => change(index, { schedule: value as ClassSchedule })}><SelectTrigger aria-label="Horário de treino"><SelectValue placeholder="Horário" /></SelectTrigger><SelectContent>{TIMES.map((time) => <SelectItem key={time} value={time}>{time}</SelectItem>)}</SelectContent></Select>{draft.length > 1 && <Button variant="outline" size="icon" aria-label="Remover dia" onClick={() => setDraft((previous) => previous.filter((_, i) => i !== index))}><Trash2 className="h-4 w-4" /></Button>}</div>)}{draft.length < DAYS.length && <Button variant="outline" className="w-full" onClick={() => { const available = DAYS.find((day) => !draft.some((config) => config.day === day)); if (available) setDraft((previous) => [...previous, { day: available, schedule: TIMES[0] }]) }}><Plus className="mr-2 h-4 w-4" />Adicionar dia</Button>}<div className="flex gap-2"><Button variant="outline" className="flex-1" disabled={saving} onClick={() => setSelectedId(null)}>Cancelar</Button><Button className="flex-1" disabled={saving} onClick={save}>{saving ? "Salvando..." : "Salvar alterações"}</Button></div></CardContent></Card></div>}
    </div>
  )
}
