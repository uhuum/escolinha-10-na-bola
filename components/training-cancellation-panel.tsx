"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/lib/contexts/auth-context"
import { getBrowserClient } from "@/lib/supabase/client"
import { getTodayDateString } from "@/lib/utils/date"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { AlertTriangle, ChevronDown, ChevronUp } from "lucide-react"

const days = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"]
const schedules = ["18:00-19:30", "19:30-21:00"] as const

export function TrainingCancellationPanel() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [schedule, setSchedule] = useState("")
  const [reason, setReason] = useState("")
  const [saving, setSaving] = useState(false)
  const [existing, setExisting] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const today = getTodayDateString()
  const day = days[new Date(`${today}T12:00:00`).getDay()]
  const supabase = getBrowserClient()

  useEffect(() => {
    let active = true
    const load = async () => {
      const { data, error } = await supabase.from("training_cancellations").select("class_schedule").eq("date", today)
      if (!active) return
      if (error) toast({ title: "Erro ao consultar cancelamentos", description: error.message, variant: "destructive" })
      else setExisting((data || []).map((row) => row.class_schedule))
      setLoading(false)
    }
    void load()
    return () => { active = false }
  }, [supabase, today, toast])

  const submit = async () => {
    const cleaned = reason.trim()
    if (user?.role !== "coach" || !user.id || !schedule || cleaned.length < 5 || cleaned.length > 1000 || !["Segunda", "Terça", "Quarta", "Quinta", "Sexta"].includes(day)) {
      toast({ title: "Confira os dados", description: "Selecione o horário e informe um motivo com 5 a 1000 caracteres.", variant: "destructive" })
      return
    }
    setSaving(true)
    try {
      const { error } = await supabase.from("training_cancellations").insert({ date: today, day_of_week: day, class_schedule: schedule, trainer_id: user.id, trainer_name: user.name || user.username, reason: cleaned })
      if (error) throw error
      setExisting((previous) => [...previous, schedule])
      setSchedule("")
      setReason("")
      setOpen(false)
      toast({ title: "Treino cancelado", description: "Motivo registrado para a administração. Nenhuma falta foi gerada." })
    } catch (error) {
      toast({ title: "Não foi possível cancelar", description: error instanceof Error ? error.message : "Verifique se a chamada já foi registrada ou se o treino já foi cancelado.", variant: "destructive" })
    } finally { setSaving(false) }
  }

  return <Card className="border-amber-300/60">
    <CardHeader className="pb-3"><button type="button" onClick={() => setOpen((value) => !value)} aria-expanded={open} className="flex w-full items-center justify-between gap-3 text-left"><span className="flex items-center gap-2 font-semibold"><AlertTriangle className="h-5 w-5 text-amber-600" />Treino cancelado</span>{open ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}</button><CardDescription>O treino não aconteceu? Registre o motivo aqui, sem gerar faltas para os alunos.</CardDescription></CardHeader>
    {open && <CardContent className="space-y-4"><div className="rounded-lg bg-muted p-3 text-sm"><strong>Data:</strong> {new Date(`${today}T12:00:00`).toLocaleDateString("pt-BR")} · <strong>Dia:</strong> {day} · <strong>Treinador:</strong> {user?.name || "—"}</div><div className="space-y-2"><Label>Horário da turma *</Label><Select value={schedule} onValueChange={setSchedule} disabled={saving || loading}><SelectTrigger><SelectValue placeholder="Selecione o horário" /></SelectTrigger><SelectContent>{schedules.map((value) => <SelectItem key={value} value={value} disabled={existing.includes(value)}>{value}{existing.includes(value) ? " · Já cancelado" : ""}</SelectItem>)}</SelectContent></Select></div><div className="space-y-2"><Label htmlFor="cancellation-reason-inline">Motivo do cancelamento *</Label><Textarea id="cancellation-reason-inline" value={reason} onChange={(event) => setReason(event.target.value)} maxLength={1000} rows={4} placeholder="Ex.: Quadra interditada devido à chuva..." disabled={saving} /><p className="text-right text-xs text-muted-foreground">{reason.trim().length}/1000 caracteres (mínimo 5)</p></div><Button className="w-full" variant="destructive" onClick={submit} disabled={saving || loading || !schedule || reason.trim().length < 5 || user?.role !== "coach" || !["Segunda", "Terça", "Quarta", "Quinta", "Sexta"].includes(day)}>{saving ? "Registrando..." : "Confirmar cancelamento do treino"}</Button></CardContent>}
  </Card>
}
