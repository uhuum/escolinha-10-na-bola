"use client"

import { useEffect, useMemo, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { getBrowserClient } from "@/lib/supabase/client"
import { WEEK_DAYS, type EnrollmentRequest, displayDate } from "@/lib/enrollment"
import { formatCPF, formatRG, formatPhone, detectDocumentType } from "@/lib/formatters"
import { generateWelcomeGuidePdf } from "@/lib/utils/welcome-guide-pdf"
import type { Student } from "@/lib/types"
import { AppHeader } from "@/components/app-header"
import { SectionLoadingScreen } from "@/components/section-loading-screen"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, CheckCircle2, FileText } from "lucide-react"

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
      setMonthlyValue(String(row.approval?.monthlyValue ?? row.payload?.monthlyValue ?? (row.payload?.planDays === 2 ? 180 : 140)))
      const proposedSchedules = row.approval?.scheduleConfigs?.length
        ? row.approval.scheduleConfigs
        : row.payload?.scheduleConfigs?.length ? row.payload.scheduleConfigs
        : [{ day: "Segunda", schedule: "18:00-19:30" }]
      setScheduleConfigs(proposedSchedules)
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
    await generateWelcomeGuidePdf(student)
  }

  const approve = async () => {
    if (!request || !request.payload || busy || !confirmed) return
    const amount = Number(monthlyValue)
    if (monthlyValue.trim() === "" || !Number.isInteger(amount) || amount < 0 || amount > 10000
      || scheduleConfigs.length < 1 || new Set(scheduleConfigs.map((entry) => entry.day)).size !== scheduleConfigs.length
      || scheduleConfigs.length !== (request.payload.planDays || scheduleConfigs.length)) {
      setError("Confira o valor da mensalidade e os dias de treino, sem repetir dias.")
      return
    }
    setBusy(true)
    setError("")
    try {
      const { data: studentId, error: approvalError } = await supabase.rpc("approve_enrollment", {
        p_request_id: request.id,
        p_approval: { monthlyValue: amount, scheduleConfigs },
      })
      if (approvalError) {
        if (approvalError.message.includes("DUPLICATE_STUDENT")) throw new Error("Este aluno já está cadastrado. Confira o registro existente.")
        throw approvalError
      }
      if (!studentId || typeof studentId !== "string") throw new Error("A aprovação não retornou o aluno cadastrado.")
      setRequest({ ...request, status: "approved", student_id: studentId })
      setSuccess("Matrícula aprovada! O guia de boas-vindas personalizado está disponível para enviar à família.")
      try { await downloadPdf(studentId) }
      catch { setError("A matrícula foi aprovada, mas não foi possível baixar o guia automaticamente. Use o botão abaixo para tentar novamente.") }
    } catch (cause) {
      setError(cause instanceof Error && cause.message.includes("já está") ? cause.message : "Não foi possível aprovar a matrícula. Confira os campos e tente novamente.")
    } finally { setBusy(false) }
  }

  const payload = request?.payload
  const formattedDocument = (value: string) => !value ? "Não informado"
    : detectDocumentType(value) === "CPF" ? formatCPF(value) : formatRG(value)
  const formattedDate = (value?: string) => value && /^\d{4}-\d{2}-\d{2}$/.test(value)
    ? value.slice(8,10)+"/"+value.slice(5,7)+"/"+value.slice(0,4) : value || "Não informado"

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
                  <p><strong>Data de nascimento:</strong> {formattedDate(payload.birthDate)}</p>
                  <p><strong>Documento do aluno:</strong> {formattedDocument(payload.document)}</p>
                  <p><strong>Responsável:</strong> {payload.responsible}</p>
                  <p><strong>CPF do responsável:</strong> {formatCPF(payload.responsibleCpf)}</p>
                  <p><strong>WhatsApp:</strong> {formatPhone(payload.phone)}</p>
                  <p><strong>Telefone do pai:</strong> {payload.fatherPhone ? formatPhone(payload.fatherPhone) : "Não informado"}</p>
                  <p><strong>Telefone da mãe:</strong> {payload.motherPhone ? formatPhone(payload.motherPhone) : "Não informado"}</p>
                  <p><strong>E-mail:</strong> {payload.email}</p>
                  <p><strong>Contato de emergência:</strong> {[payload.emergencyName, payload.emergencyPhone ? formatPhone(payload.emergencyPhone) : ""].filter(Boolean).join(" — ") || "Não informado"}</p>
                  <p className="sm:col-span-2"><strong>Vencimento solicitado:</strong> dia {payload.dueDay}. {payload.dueDay > 10 ? "Solicitação excepcional, sujeita à confirmação." : "Dentro do período regular de 01 a 10."}</p>
                  <p className="sm:col-span-2"><strong>Plano solicitado:</strong> {payload.planDays ? `${payload.planDays} dia${payload.planDays === 1 ? "" : "s"} por semana — R$ ${(payload.monthlyValue || (payload.planDays === 2 ? 180 : 140)).toFixed(2).replace(".", ",")}` : "Plano não especificado na ficha antiga"}</p>
                  <p className="sm:col-span-2"><strong>Dias e horários escolhidos:</strong> {payload.scheduleConfigs?.length ? payload.scheduleConfigs.map(c=>`${c.day} (${c.schedule.replace("-"," às ")})`).join(" • ") : "Não informados na ficha antiga"}</p>
                  <p className="sm:col-span-2"><strong>Saúde:</strong> {payload.healthAnswer === "sim" ? `Sim — ${payload.healthNote}` : payload.healthAnswer === "nao" ? "Não" : payload.healthNote || "Não informado"}</p>
                </div>}
              </CardContent>
            </Card>

            {request.status === "pending" && payload && (
              <Card className="border-blue-200">
                <CardHeader><CardTitle className="text-lg">Dados para aprovação</CardTitle></CardHeader>
                <CardContent className="space-y-5">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div><Label htmlFor="value">Mensalidade (R$) *</Label><Input id="value" type="number" min={0} max={10000} step={1} value={monthlyValue} onChange={(e) => setMonthlyValue(e.target.value)} className="mt-1" /></div>
                    <div className="rounded-lg bg-slate-50 p-3 text-sm"><strong>Vencimento informado:</strong> dia {payload.dueDay}<p className="text-xs text-slate-500">Este dado é mantido como o responsável informou.</p></div>
                  </div>
                  <div className="space-y-3">
                    <h3 className="font-semibold">Dias dos treinos (única alteração de turma permitida)</h3>
                    <p className="text-xs text-slate-500">Os horários foram escolhidos pelo responsável e permanecem fixos. Você pode alterar apenas os dias.</p>
                    {scheduleConfigs.map((item,index)=><div key={index} className="flex flex-wrap items-center gap-2">
                      <select aria-label={"Dia de treino "+(index+1)} className="h-10 flex-1 rounded-md border bg-white px-2 text-sm" value={item.day}
                        onChange={(e)=>setScheduleConfigs(previous=>previous.map((s,j)=>j===index?{...s,day:e.target.value}:s))}>
                        {WEEK_DAYS.map(day=><option key={day}>{day}</option>)}
                      </select>
                      <div className="flex-1 rounded-md border bg-slate-100 px-3 py-2 text-sm">{item.schedule.replace("-"," às ")}</div>
                    </div>)}
                  </div>
                  <label className="flex items-center gap-2 rounded-lg bg-blue-50 p-3 text-sm"><input type="checkbox" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} /> Conferi as informações e confirmo os dados de matrícula.</label>
                  <Button
                    disabled={busy || !confirmed}
                    onClick={approve}
                    className="h-auto min-h-12 w-full min-w-0 max-w-full gap-2 whitespace-normal break-words bg-green-700 px-4 py-3 text-center text-sm leading-snug hover:bg-green-800 sm:w-auto sm:text-base"
                  >
                    <CheckCircle2 className="h-5 w-5 shrink-0" />
                    <span className="min-w-0">{busy ? "Aprovando..." : <><span className="sm:hidden">Aprovar matrícula</span><span className="hidden sm:inline">Aprovar matrícula e gerar guia de boas-vindas</span></>}</span>
                  </Button>
                </CardContent>
              </Card>
            )}
            {request.status === "approved" && request.student_id && (
              <Card className="border-green-200 bg-green-50"><CardContent className="flex flex-wrap items-center gap-3 p-5">
                <CheckCircle2 className="h-7 w-7 text-green-700" /><span className="font-semibold text-green-900">Matrícula aprovada</span>
                <Button variant="outline" disabled={busy} onClick={() => { setError(""); void downloadPdf(request.student_id!).catch(() => setError("Não foi possível gerar o PDF. Tente novamente.")) }}><FileText className="mr-2 h-4 w-4" /> Baixar guia de boas-vindas</Button>
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
