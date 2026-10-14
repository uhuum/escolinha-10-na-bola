"use client"

import { useEffect, useMemo, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { getBrowserClient } from "@/lib/supabase/client"
import { WEEK_DAYS, TRAINING_TIMES, type EnrollmentRequest, displayDate } from "@/lib/enrollment"
import { generateEnrollmentPdf } from "@/lib/utils/enrollment-pdf"
import type { Student } from "@/lib/types"
import { AppHeader } from "@/components/app-header"
import { SectionLoadingScreen } from "@/components/section-loading-screen"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, CheckCircle2, FileText, Plus, Trash2 } from "lucide-react"

type Schedule = { day: string; schedule: string }

export default function ReviewEnrollmentPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const supabase = useMemo(() => getBrowserClient(), [])
  const [request, setRequest] = useState<EnrollmentRequest | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [monthlyValue, setMonthlyValue] = useState("")
  const [dueDay, setDueDay] = useState(10)
  const [scheduleConfigs, setScheduleConfigs] = useState<Schedule[]>([{ day: "Segunda", schedule: "18:00-19:30" }])
  const [confirmed, setConfirmed] = useState(false)

  useEffect(() => {
    let active = true
    async function load() {
      const { data, error: fetchError } = await supabase.from("enrollment_requests")
        .select("id,label,status,created_at,expires_at,submitted_at,approved_at,student_id,payload,approval")
        .eq("id", id).single()
      if (!active) return
      if (fetchError || !data) { setError("Solicitação não encontrada ou acesso não autorizado."); setLoading(false); return }
      const row = data as EnrollmentRequest
      setRequest(row)
      setDueDay(Math.max(1, Math.min(28, Number(row.approval?.dueDay || row.payload?.dueDay) || 10)))
      if (row.approval?.monthlyValue !== undefined) setMonthlyValue(String(row.approval.monthlyValue))
      if (row.approval?.scheduleConfigs?.length) setScheduleConfigs(row.approval.scheduleConfigs)
      setLoading(false)
    }
    void load()
    return () => { active = false }
  }, [id, supabase])

  const downloadPdf = async (studentId: string) => {
    const { data: s, error: studentError } = await supabase.from("students").select("*").eq("id", studentId).single()
    if (studentError || !s) throw new Error("Não foi possível consultar os dados do aluno para gerar o PDF.")
    const student: Student = {
      id: s.id, name: s.name, rg: s.rg || "", birthDate: s.birth_date || "",
      responsible: s.responsible || "", responsibleCpf: s.responsible_cpf || "",
      responsibleEmail: s.responsible_email || "", fatherPhone: s.father_phone || "",
      motherPhone: s.mother_phone || "", monthlyValue: s.monthly_value || 0,
      isActive: s.is_active ?? true, isScholarship: s.is_scholarship ?? false,
      paymentDueDay: s.payment_due_day, enrollmentCategory: s.enrollment_category,
      classSchedule: s.class_schedule, classDays: s.class_days || [],
      scheduleConfigs: Array.isArray(s.schedule_configs) ? s.schedule_configs : [],
      payments: [],
    }
    await generateEnrollmentPdf(student)
  }

  const approve = async () => {
    if (!request || !request.payload || busy || !confirmed) return
    const amount = Number(monthlyValue)
    if (monthlyValue.trim() === "" || !Number.isInteger(amount) || amount < 0 || amount > 10000
      || !Number.isInteger(dueDay) || dueDay < 1 || dueDay > 28
      || scheduleConfigs.length < 1 || new Set(scheduleConfigs.map((entry) => entry.day)).size !== scheduleConfigs.length) {
      setError("Confira o valor, vencimento e os dias/horários de treino.")
      return
    }
    setBusy(true)
    setError("")
    try {
      const { data: studentId, error: approvalError } = await supabase.rpc("approve_enrollment", {
        p_request_id: request.id,
        p_approval: { monthlyValue: amount, dueDay, scheduleConfigs },
      })
      if (approvalError) {
        if (approvalError.message.includes("DUPLICATE_STUDENT")) throw new Error("Este aluno já está cadastrado. Confira o registro existente.")
        throw approvalError
      }
      if (!studentId || typeof studentId !== "string") throw new Error("A aprovação não retornou o aluno cadastrado.")
      setRequest({ ...request, status: "approved", student_id: studentId })
      setSuccess("Matrícula aprovada! O aluno e as mensalidades foram cadastrados. O comprovante em PDF está disponível abaixo.")
      try { await downloadPdf(studentId) }
      catch { setError("A matrícula foi aprovada, mas não foi possível baixar o PDF automaticamente. Use o botão abaixo para tentar novamente.") }
    } catch (cause) {
      setError(cause instanceof Error && cause.message.includes("já está") ? cause.message : "Não foi possível aprovar a matrícula. Confira os campos e tente novamente.")
    } finally { setBusy(false) }
  }

  const payload = request?.payload

  if (loading) {
    return <SectionLoadingScreen title="Carregando conferência..." description="Consultando os dados da ficha de matrícula..." />
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <AppHeader />
      <main className="container mx-auto max-w-4xl space-y-6 px-4 py-7">
        <Button variant="outline" asChild><Link href="/enrollments"><ArrowLeft className="mr-2 h-4 w-4" /> Voltar às solicitações</Link></Button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Conferência de matrícula</h1>
          <p className="text-sm text-slate-600">Confira os dados em uma tela exclusiva antes de aprovar.</p>
        </div>
        {loading ? <Card><CardContent className="py-12 text-center">Carregando ficha...</CardContent></Card> : !request ? (
          <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">{error}</p>
        ) : (
          <>
            <Card>
              <CardHeader><CardTitle className="text-lg">{payload?.name || request.label}</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-slate-500">Enviada em: {request.submitted_at ? displayDate(request.submitted_at) : "Não enviada"} · Situação: {request.status === "approved" ? "Aprovada" : request.status === "pending" ? "Em análise" : "Aguardando preenchimento"}</p>
                {payload && <div className="grid gap-3 rounded-xl bg-slate-100 p-5 text-sm sm:grid-cols-2">
                  <p><strong>Aluno:</strong> {payload.name}</p>
                  <p><strong>Data de nascimento:</strong> {payload.birthDate.split("-").reverse().join("/")}</p>
                  <p><strong>Documento do aluno:</strong> {payload.document}</p>
                  <p><strong>Responsável:</strong> {payload.responsible}</p>
                  <p><strong>CPF do responsável:</strong> {payload.responsibleCpf}</p>
                  <p><strong>WhatsApp:</strong> {payload.phone}</p>
                  <p><strong>Telefone do pai:</strong> {payload.fatherPhone || "Não informado"}</p>
                  <p><strong>Telefone da mãe:</strong> {payload.motherPhone || "Não informado"}</p>
                  <p><strong>E-mail:</strong> {payload.email}</p>
                  <p><strong>Contato de emergência:</strong> {[payload.emergencyName, payload.emergencyPhone].filter(Boolean).join(" — ") || "Não informado"}</p>
                  <p className="sm:col-span-2"><strong>Vencimento solicitado:</strong> dia {payload.dueDay}. {payload.dueDay > 10 ? "Solicitação excepcional, sujeita à confirmação." : "Dentro do período regular de 01 a 10."}</p>
                  <p className="sm:col-span-2"><strong>Informações importantes para os treinos:</strong> {payload.healthNote || "Nenhuma informada"}</p>
                </div>}
              </CardContent>
            </Card>

            {request.status === "pending" && payload && (
              <Card className="border-blue-200">
                <CardHeader><CardTitle className="text-lg">Dados para aprovação</CardTitle></CardHeader>
                <CardContent className="space-y-5">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div><Label htmlFor="value">Mensalidade (R$) *</Label><Input id="value" type="number" min={0} max={10000} step={1} placeholder="Ex.: 120" value={monthlyValue} onChange={(e) => setMonthlyValue(e.target.value)} className="mt-1" /></div>
                    <div><Label htmlFor="due">Vencimento confirmado *</Label><select id="due" value={dueDay} onChange={(e) => setDueDay(Number(e.target.value))} className="mt-1 h-10 w-full rounded-md border bg-white px-3 text-sm">{Array.from({ length: 28 }, (_, i) => i + 1).map((n) => <option key={n} value={n}>Dia {n}</option>)}</select>
                      <p className="mt-1 text-xs text-slate-500">Até o vencimento, a mensalidade permanece Em Aberto. Ficará pendente somente no dia seguinte.</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-semibold">Dias e horários dos treinos</h3>
                      <Button size="sm" variant="outline" disabled={scheduleConfigs.length >= 5} onClick={() => {
                        const day = WEEK_DAYS.find((name) => !scheduleConfigs.some((s) => s.day === name))
                        if (day) setScheduleConfigs((items) => [...items, { day, schedule: "18:00-19:30" }])
                      }}><Plus className="mr-1 h-4 w-4" /> Adicionar dia</Button>
                    </div>
                    {scheduleConfigs.map((item, index) => <div key={index} className="flex flex-wrap items-center gap-2">
                      <select aria-label={"Dia de treino " + (index + 1)} className="h-10 flex-1 rounded-md border bg-white px-2 text-sm" value={item.day} onChange={(e) => setScheduleConfigs((old) => old.map((s, j) => j === index ? { ...s, day: e.target.value } : s))}>{WEEK_DAYS.map((day) => <option key={day}>{day}</option>)}</select>
                      <select aria-label={"Horário " + (index + 1)} className="h-10 flex-1 rounded-md border bg-white px-2 text-sm" value={item.schedule} onChange={(e) => setScheduleConfigs((old) => old.map((s, j) => j === index ? { ...s, schedule: e.target.value } : s))}>{TRAINING_TIMES.map((time) => <option key={time} value={time}>{time.replace("-", " às ")}</option>)}</select>
                      <Button size="icon" variant="outline" aria-label="Remover dia" disabled={scheduleConfigs.length === 1} onClick={() => setScheduleConfigs((items) => items.filter((_, j) => j !== index))}><Trash2 className="h-4 w-4" /></Button>
                    </div>)}
                  </div>
                  <label className="flex items-center gap-2 rounded-lg bg-blue-50 p-3 text-sm"><input type="checkbox" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} /> Conferi as informações e confirmo os dados de matrícula.</label>
                  <Button disabled={busy || !confirmed} onClick={approve} className="bg-green-700 hover:bg-green-800"><CheckCircle2 className="mr-2 h-4 w-4" />{busy ? "Aprovando..." : "Aprovar matrícula e gerar PDF"}</Button>
                </CardContent>
              </Card>
            )}
            {request.status === "approved" && request.student_id && (
              <Card className="border-green-200 bg-green-50"><CardContent className="flex flex-wrap items-center gap-3 p-5">
                <CheckCircle2 className="h-7 w-7 text-green-700" /><span className="font-semibold text-green-900">Matrícula aprovada</span>
                <Button variant="outline" disabled={busy} onClick={() => { setError(""); void downloadPdf(request.student_id!).catch(() => setError("Não foi possível gerar o PDF. Tente novamente.")) }}><FileText className="mr-2 h-4 w-4" /> Baixar PDF da matrícula</Button>
                <Button asChild variant="outline"><Link href={"/students/" + request.student_id}>Abrir cadastro do aluno</Link></Button>
              </CardContent></Card>
            )}
            {success && <p role="status" className="rounded-lg bg-green-100 p-4 text-sm text-green-800">{success}</p>}
            {error && <p role="alert" className="rounded-lg bg-red-100 p-4 text-sm text-red-800">{error}</p>}
          </>
        )}
      </main>
    </div>
  )
}
