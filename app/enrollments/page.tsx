"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useAuth } from "@/lib/contexts/auth-context"
import { getBrowserClient } from "@/lib/supabase/client"
import { createInvitationToken, displayDate, hashInvitationToken, WEEK_DAYS, TRAINING_TIMES, type EnrollmentRequest } from "@/lib/enrollment"
import { generateEnrollmentPdf } from "@/lib/utils/enrollment-pdf"
import type { Student } from "@/lib/types"
import { AppHeader } from "@/components/app-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ClipboardCopy, FileText, Link2, RefreshCcw, CheckCircle2, XCircle, Plus, Trash2 } from "lucide-react"

type Schedule = { day: string; schedule: string }

function statusName(value: string) {
  switch (value) {
    case "invited": return "Aguardando preenchimento"
    case "pending": return "Aguardando aprovação"
    case "approved": return "Matrícula aprovada"
    case "cancelled": return "Cancelado"
    default: return value
  }
}

export default function EnrollmentsPage() {
  const { user } = useAuth()
  const supabase = useMemo(() => getBrowserClient(), [])
  const [rows, setRows] = useState<EnrollmentRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [label, setLabel] = useState("")
  const [generatedLink, setGeneratedLink] = useState("")
  const [error, setError] = useState("")
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [category, setCategory] = useState("")
  const [monthlyValue, setMonthlyValue] = useState("")
  const [dueDay, setDueDay] = useState(10)
  const [scheduleConfigs, setScheduleConfigs] = useState<Schedule[]>([{ day: "Segunda", schedule: "18:00-19:30" }])
  const [confirmation, setConfirmation] = useState("")
  const selected = rows.find((row) => row.id === selectedId) || null

  const load = useCallback(async () => {
    const { data, error: readError } = await supabase.from("enrollment_requests")
      .select("id,label,status,created_at,expires_at,submitted_at,approved_at,student_id,payload,approval")
      .order("created_at", { ascending: false }).limit(200)
    if (readError) throw readError
    setRows((data || []) as EnrollmentRequest[])
  }, [supabase])

  useEffect(() => {
    let active = true
    load().catch(() => { if (active) setError("Não foi possível carregar as solicitações.") })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [load])

  const refresh = async () => {
    setError("")
    setLoading(true)
    try { await load() } catch { setError("Não foi possível atualizar a lista.") }
    finally { setLoading(false) }
  }

  const create = async () => {
    if (busy || !user?.authId) return
    setError("")
    setConfirmation("")
    setBusy(true)
    try {
      const token = createInvitationToken()
      const hash = await hashInvitationToken(token)
      const expiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      const { error: insertError } = await supabase.from("enrollment_requests").insert({
        token_hash: hash,
        label: (label.trim() || "Nova matrícula").slice(0, 100),
        status: "invited",
        created_by: user.authId,
        expires_at: expiry,
      })
      if (insertError) throw insertError
      const url = `${window.location.origin}/enroll#${token}`
      setGeneratedLink(url)
      setLabel("")
      setConfirmation("Convite criado. Copie e envie o link ao responsável pelo WhatsApp.")
      await load()
    } catch {
      setError("Não foi possível criar o convite. Confira se você está logado como administrador.")
    } finally { setBusy(false) }
  }

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(generatedLink)
      setConfirmation("Link copiado. Você já pode enviar pelo WhatsApp.")
    } catch {
      setConfirmation("Selecione o link abaixo e copie manualmente.")
    }
  }

  const openApproval = (row: EnrollmentRequest) => {
    setSelectedId(row.id)
    setMonthlyValue("")
    setCategory("")
    setDueDay(Math.max(1, Math.min(28, Number(row.payload?.dueDay) || 10)))
    setScheduleConfigs([{ day: "Segunda", schedule: "18:00-19:30" }])
    setError("")
    setConfirmation("")
  }

  const approve = async () => {
    if (!selected || busy) return
    const amount = Number(monthlyValue)
    if (!category || monthlyValue.trim() === "" || !Number.isInteger(amount) || amount < 0 || amount > 10000
      || !Number.isInteger(dueDay) || dueDay < 1 || dueDay > 28 || scheduleConfigs.length < 1
      || new Set(scheduleConfigs.map((item) => item.day)).size !== scheduleConfigs.length) {
      setError("Informe categoria, valor mensal, vencimento e dias/horários válidos para aprovar.")
      return
    }
    setBusy(true)
    setError("")
    try {
      const { error: approvalError } = await supabase.rpc("approve_enrollment", {
        p_request_id: selected.id,
        p_approval: { category, monthlyValue: amount, dueDay, scheduleConfigs },
      })
      if (approvalError) {
        if (approvalError.message.includes("DUPLICATE_STUDENT")) throw new Error("Aluno já cadastrado. Confira antes de prosseguir.")
        throw approvalError
      }
      setSelectedId(null)
      setConfirmation("Matrícula aprovada! O aluno já está cadastrado no sistema com suas mensalidades.")
      await load()
    } catch (cause) {
      setError(cause instanceof Error && cause.message.includes("Aluno já") ? cause.message : "Não foi possível aprovar. Confira o cadastro e tente novamente.")
    } finally { setBusy(false) }
  }

  const cancel = async (row: EnrollmentRequest) => {
    if (busy || !window.confirm("Cancelar este convite? Esta ação não apaga alunos já matriculados.")) return
    setBusy(true)
    setError("")
    try {
      const { data: result, error: cancelError } = await supabase.from("enrollment_requests")
        .update({ status: "cancelled" }).eq("id", row.id).in("status", ["invited", "pending"]).select("id")
      if (cancelError || !result?.length) throw new Error("cancel failed")
      setSelectedId(null)
      setConfirmation("Convite cancelado.")
      await load()
    } catch { setError("Não foi possível cancelar a solicitação.") }
    finally { setBusy(false) }
  }

  const downloadPdf = async (studentId: string) => {
    setBusy(true)
    setError("")
    try {
      const { data: s, error: studentError } = await supabase.from("students").select("*").eq("id", studentId).single()
      if (studentError || !s) throw new Error("missing student")
      const student: Student = {
        id: s.id, name: s.name, rg: s.rg || "", birthDate: s.birth_date || "",
        responsible: s.responsible || "", responsibleCpf: s.responsible_cpf || "",
        responsibleEmail: s.responsible_email || "", fatherPhone: s.father_phone || "",
        motherPhone: s.mother_phone || "", monthlyValue: s.monthly_value || 0,
        isActive: s.is_active ?? true, isScholarship: s.is_scholarship ?? false,
        classSchedule: s.class_schedule, classDays: s.class_days || [],
        scheduleConfigs: Array.isArray(s.schedule_configs) ? s.schedule_configs : [],
        payments: [],
      }
      await generateEnrollmentPdf(student)
    } catch { setError("Não foi possível gerar a declaração de matrícula.") }
    finally { setBusy(false) }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <AppHeader />
      <main className="container mx-auto max-w-5xl space-y-6 px-4 py-7">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div><h1 className="text-2xl font-bold text-slate-900">Matrículas online</h1>
            <p className="text-sm text-slate-600">Convites por WhatsApp, fichas pendentes e aprovações.</p>
          </div>
          <Button variant="outline" onClick={refresh} disabled={busy || loading}><RefreshCcw className="mr-2 h-4 w-4" /> Atualizar</Button>
        </div>

        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2 text-lg"><Link2 className="h-5 w-5 text-red-600" /> Nova matrícula por link</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <Label htmlFor="inviteLabel">Identificação do convite (uso interno)</Label>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Input id="inviteLabel" placeholder="Ex.: Matrícula recebida via WhatsApp" value={label} maxLength={100} onChange={(e) => setLabel(e.target.value)} />
              <Button disabled={busy} onClick={create} className="bg-red-600 hover:bg-red-700"><Plus className="mr-2 h-4 w-4" /> Gerar link</Button>
            </div>
            {generatedLink && <div className="space-y-2 rounded-lg border border-blue-200 bg-blue-50 p-3">
              <Label htmlFor="generatedLink">Link exclusivo (válido por 7 dias; use apenas uma vez)</Label>
              <Input id="generatedLink" value={generatedLink} readOnly onFocus={(e) => e.target.select()} />
              <Button size="sm" onClick={copyLink}><ClipboardCopy className="mr-2 h-4 w-4" /> Copiar link</Button>
              <p className="text-xs text-slate-600">Guarde o link se precisar reenviá-lo: por segurança, ele não fica disponível novamente no painel.</p>
            </div>}
          </CardContent>
        </Card>

        {error && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        {confirmation && <p role="status" className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">{confirmation}</p>}

        <div className="space-y-3">
          <div className="flex items-center justify-between"><h2 className="text-lg font-semibold">Solicitações recebidas</h2>
            <span className="text-sm text-slate-500">{rows.filter((row) => row.status === "pending").length} pendente(s)</span>
          </div>
          {loading ? <p className="py-6 text-center text-slate-600">Carregando solicitações...</p> : rows.length === 0 ?
            <Card><CardContent className="py-8 text-center text-slate-500">Nenhuma solicitação encontrada. Gere seu primeiro link acima.</CardContent></Card> :
            rows.map((row) => (
              <Card key={row.id} className={row.status === "pending" ? "border-blue-300" : ""}>
                <CardContent className="space-y-3 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div><p className="font-semibold">{row.payload?.name || row.label}</p>
                      {row.payload && <p className="text-sm text-slate-600">Responsável: {row.payload.responsible}</p>}
                      <p className="mt-1 text-xs text-slate-500">Criado em {displayDate(row.created_at)} · Expira em {displayDate(row.expires_at)}</p>
                    </div>
                    <Badge variant={row.status === "approved" ? "default" : "secondary"}>{statusName(row.status)}</Badge>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {row.status === "pending" && <Button size="sm" onClick={() => openApproval(row)}><CheckCircle2 className="mr-2 h-4 w-4" /> Analisar matrícula</Button>}
                    {row.status === "approved" && row.student_id && <>
                      <Button size="sm" variant="outline" disabled={busy} onClick={() => downloadPdf(row.student_id!)}><FileText className="mr-2 h-4 w-4" /> Baixar PDF</Button>
                      <Button asChild size="sm" variant="outline"><Link href={`/students/${row.student_id}`}>Ver aluno</Link></Button>
                    </>}
                    {(row.status === "invited" || row.status === "pending") && <Button size="sm" variant="outline" disabled={busy} onClick={() => cancel(row)}><XCircle className="mr-2 h-4 w-4" /> Cancelar</Button>}
                  </div>
                </CardContent>
              </Card>
            ))}
        </div>

        {selected && selected.status === "pending" && selected.payload && <Card className="border-2 border-blue-300" id="review">
          <CardHeader><CardTitle className="text-lg">Conferir matrícula de {selected.payload.name}</CardTitle></CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-2 rounded-lg bg-slate-100 p-4 text-sm sm:grid-cols-2">
              <p><strong>Nome:</strong> {selected.payload.name}</p>
              <p><strong>Nascimento:</strong> {selected.payload.birthDate}</p>
              <p><strong>Documento:</strong> {selected.payload.document}</p>
              <p><strong>Responsável:</strong> {selected.payload.responsible}</p>
              <p><strong>CPF do responsável:</strong> {selected.payload.responsibleCpf}</p>
              <p><strong>Telefone:</strong> {selected.payload.phone}</p>
              <p><strong>E-mail:</strong> {selected.payload.email}</p>
              <p><strong>Vencimento solicitado:</strong> dia {selected.payload.dueDay}</p>
              <p><strong>Emergência:</strong> {selected.payload.emergencyName || "Não informado"} · {selected.payload.emergencyPhone || "Não informado"}</p>
              <p className="sm:col-span-2"><strong>Saúde (acesso administrativo):</strong> {selected.payload.healthNote || "Nada informado"}</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div><Label htmlFor="category">Categoria *</Label><select id="category" className="mt-1 h-10 w-full rounded-md border bg-white px-3 text-sm" value={category} onChange={(e) => setCategory(e.target.value)}>
                <option value="">Selecionar...</option>{Array.from({ length: 9 }, (_, i) => i + 8).map((n) => <option key={n} value={`Sub-${String(n).padStart(2, "0")}`}>Sub-{String(n).padStart(2, "0")}</option>)}
              </select></div>
              <div><Label htmlFor="value">Valor mensal em R$ *</Label><Input id="value" type="number" min={0} max={10000} step={1} placeholder="Ex.: 120" value={monthlyValue} onChange={(e) => setMonthlyValue(e.target.value)} className="mt-1" /></div>
              <div><Label htmlFor="due">Vencimento *</Label><select id="due" value={dueDay} onChange={(e) => setDueDay(Number(e.target.value))} className="mt-1 h-10 w-full rounded-md border bg-white px-3 text-sm">{Array.from({ length: 28 }, (_, i) => i + 1).map((n) => <option key={n} value={n}>Dia {n}</option>)}</select></div>
            </div>
            <div className="space-y-3"><div className="flex items-center justify-between"><h3 className="font-semibold">Dias e horários de treino</h3>
              <Button size="sm" variant="outline" disabled={scheduleConfigs.length >= 5} onClick={() => {
                const freeDay = WEEK_DAYS.find((day) => !scheduleConfigs.some((entry) => entry.day === day))
                if (freeDay) setScheduleConfigs((old) => [...old, { day: freeDay, schedule: "18:00-19:30" }])
              }}><Plus className="mr-1 h-4 w-4" /> Adicionar dia</Button></div>
              {scheduleConfigs.map((item, index) => <div key={index} className="flex flex-wrap items-center gap-2">
                <select aria-label={`Dia de treino ${index + 1}`} className="h-10 flex-1 rounded-md border bg-white px-2 text-sm" value={item.day} onChange={(e) => setScheduleConfigs((old) => old.map((entry, i) => i === index ? { ...entry, day: e.target.value } : entry))}>
                  {WEEK_DAYS.map((day) => <option key={day} value={day}>{day}</option>)}
                </select>
                <select aria-label={`Horário de treino ${index + 1}`} className="h-10 flex-1 rounded-md border bg-white px-2 text-sm" value={item.schedule} onChange={(e) => setScheduleConfigs((old) => old.map((entry, i) => i === index ? { ...entry, schedule: e.target.value } : entry))}>
                  {TRAINING_TIMES.map((time) => <option key={time} value={time}>{time.replace("-", " às ")}</option>)}
                </select>
                <Button size="icon" variant="outline" aria-label="Remover dia" disabled={scheduleConfigs.length === 1} onClick={() => setScheduleConfigs((old) => old.filter((_, i) => i !== index))}><Trash2 className="h-4 w-4" /></Button>
              </div>)}
            </div>
            <p className="text-xs text-slate-600">Confirme os valores e a turma com o responsável antes de aprovar. A aprovação cadastra o aluno e gera mensalidades.</p>
            <div className="flex flex-wrap gap-2">
              <Button disabled={busy} onClick={approve} className="bg-green-700 hover:bg-green-800"><CheckCircle2 className="mr-2 h-4 w-4" /> {busy ? "Aprovando..." : "Aprovar e cadastrar aluno"}</Button>
              <Button variant="outline" onClick={() => setSelectedId(null)}>Voltar</Button>
            </div>
          </CardContent>
        </Card>}
      </main>
    </div>
  )
}
