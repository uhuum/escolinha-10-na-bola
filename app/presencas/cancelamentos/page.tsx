"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useAuth } from "@/lib/contexts/auth-context"
import { getBrowserClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { AlertTriangle, ArrowLeft, CalendarDays } from "lucide-react"

type Cancellation = { id: string; date: string; day_of_week: string; class_schedule: string; trainer_name: string; reason: string; created_at: string }

export default function CancellationHistoryPage() {
  const { user } = useAuth()
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

  return <div className="min-h-screen bg-background"><div className="mx-auto max-w-5xl space-y-6 px-4 py-8">
    <Button asChild variant="outline"><Link href="/presencas"><ArrowLeft className="mr-2 h-4 w-4" />Voltar às presenças</Link></Button>
    <div><h1 className="flex items-center gap-2 text-2xl font-bold sm:text-3xl"><AlertTriangle className="h-7 w-7 text-amber-600" />Treinos cancelados</h1><p className="mt-2 text-muted-foreground">Histórico de cancelamentos, responsáveis e justificativas. Cancelamentos não são faltas.</p></div>
    {user?.role !== "admin" ? <Card><CardContent className="py-8">Acesso restrito à administração.</CardContent></Card> : loading ? <Card><CardContent className="py-8">Carregando cancelamentos...</CardContent></Card> : error ? <Card><CardContent className="py-8 text-destructive">Não foi possível carregar: {error}</CardContent></Card> : items.length === 0 ? <Card><CardContent className="py-10 text-center text-muted-foreground">Nenhum treino cancelado registrado.</CardContent></Card> : <div className="grid gap-4 md:grid-cols-2">{items.map((item) => <Card key={item.id} className="border-amber-200/70"><CardHeader><div className="flex items-start justify-between gap-2"><CardTitle className="flex items-center gap-2 text-lg"><CalendarDays className="h-5 w-5" />{new Date(`${item.date}T12:00:00`).toLocaleDateString("pt-BR")}</CardTitle><Badge variant="destructive">Cancelado</Badge></div><CardDescription>{item.day_of_week} · {item.class_schedule}</CardDescription></CardHeader><CardContent className="space-y-3 text-sm"><p><span className="font-semibold">Treinador:</span> {item.trainer_name}</p><div className="rounded-lg border bg-muted/40 p-3"><p className="mb-1 font-semibold">Motivo</p><p className="whitespace-pre-wrap break-words">{item.reason}</p></div><p className="text-xs text-muted-foreground">Registrado em {new Date(item.created_at).toLocaleString("pt-BR")}</p></CardContent></Card>)}</div>}
  </div></div>
}
