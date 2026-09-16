"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/lib/contexts/auth-context"
import { getBrowserClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, CalendarDays, ChevronDown, ChevronUp } from "lucide-react"

type Cancellation = { id: string; date: string; day_of_week: string; class_schedule: string; trainer_name: string; reason: string; created_at: string }

export function TrainingCancellationRecords() {
  const { user } = useAuth()
  const [open, setOpen] = useState(true)
  const [items, setItems] = useState<Cancellation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const supabase = getBrowserClient()

  useEffect(() => {
    if (user?.role !== "admin") return
    let active = true
    const load = async () => {
      const { data, error: fetchError } = await supabase.from("training_cancellations").select("id,date,day_of_week,class_schedule,trainer_name,reason,created_at").order("date", { ascending: false }).order("created_at", { ascending: false })
      if (!active) return
      if (fetchError) setError(fetchError.message)
      else setItems(data || [])
      setLoading(false)
    }
    void load()
    return () => { active = false }
  }, [supabase, user?.role])

  if (user?.role !== "admin") return null
  return <Card className="border-amber-300/60"><CardHeader className="pb-3"><button type="button" onClick={() => setOpen((value) => !value)} aria-expanded={open} className="flex w-full items-center justify-between gap-3 text-left"><CardTitle className="flex items-center gap-2 text-lg"><AlertTriangle className="h-5 w-5 text-amber-600" />Registros de treinos cancelados <Badge variant="secondary">{items.length}</Badge></CardTitle>{open ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}</button><CardDescription>Data, turma, treinador e justificativa. Cancelamentos não contam como falta.</CardDescription></CardHeader>{open && <CardContent>{loading ? <p className="py-4 text-sm text-muted-foreground">Carregando cancelamentos...</p> : error ? <p className="py-4 text-sm text-destructive">Não foi possível carregar: {error}</p> : items.length === 0 ? <p className="py-4 text-sm text-muted-foreground">Nenhum treino cancelado registrado.</p> : <div className="grid gap-3 md:grid-cols-2">{items.map((item) => <div key={item.id} className="rounded-xl border border-amber-200/70 p-4"><div className="mb-2 flex items-start justify-between gap-2"><p className="flex items-center gap-2 font-semibold"><CalendarDays className="h-4 w-4" />{new Date(`${item.date}T12:00:00`).toLocaleDateString("pt-BR")}</p><Badge variant="destructive">Cancelado</Badge></div><p className="text-sm text-muted-foreground">{item.day_of_week} · {item.class_schedule}</p><p className="mt-2 text-sm"><strong>Treinador:</strong> {item.trainer_name}</p><div className="mt-3 rounded-lg bg-muted/50 p-3 text-sm"><p className="mb-1 font-semibold">Motivo</p><p className="whitespace-pre-wrap break-words">{item.reason}</p></div><p className="mt-2 text-xs text-muted-foreground">Registrado em {new Date(item.created_at).toLocaleString("pt-BR")}</p></div>)}</div>}</CardContent>}</Card>
}
