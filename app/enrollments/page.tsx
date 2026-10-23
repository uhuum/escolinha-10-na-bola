"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useAuth } from "@/lib/contexts/auth-context"
import { getBrowserClient } from "@/lib/supabase/client"
import { createInvitationToken, displayDate, hashInvitationToken, type EnrollmentRequest } from "@/lib/enrollment"
import { generateWelcomeGuidePdf } from "@/lib/utils/welcome-guide-pdf"
import type { Student } from "@/lib/types"
import { AppHeader } from "@/components/app-header"
import { SectionLoadingScreen } from "@/components/section-loading-screen"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ClipboardCopy, FileText, Link2, RefreshCcw, CheckCircle2, XCircle, Plus, AlertTriangle, MessageCircle } from "lucide-react"
import { absentForThreeConsecutiveWeeks, localToday, type AttendanceEntry } from "@/lib/utils/attendance-insights"

function statusName(value: string) {
  switch (value) {
    case "invited": return "Aguardando preenchimento"
    case "pending": return "Em análise — aguardando aprovação"
    case "approved": return "Matrícula aprovada"
    case "cancelled": return "Cancelado"
    default: return value
  }
}

type AbsentStudent = {
  id: string; name: string; responsible: string; fatherPhone: string; motherPhone: string
}
type AttendanceJoin = {
  student_id: string
  status: string
  attendance: { date: string; class_schedule: string } | { date: string; class_schedule: string }[] | null
}

function absenceWhatsAppLink(student: AbsentStudent, phone: string) {
  const digits = phone.replace(/\D/g, "")
  const number = digits.startsWith("55") ? digits : "55" + digits
  const message = `Olá, ${student.responsible || "responsável"}!

Aqui é do Administrativo 10 na Bola. Verificamos que o(a) aluno(a) *${student.name}* tem faltas registradas em três semanas consecutivas de treino.

Gostaríamos de saber se está tudo bem e se há alguma situação em que possamos ajudar. Aguardamos seu retorno!

Atenciosamente,
*Administrativo 10 na Bola*`
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`
}

export default function EnrollmentsPage() {
  const { user } = useAuth()
  const supabase = useMemo(() => getBrowserClient(), [])
  const [rows, setRows] = useState<EnrollmentRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [firstLoadCompleted, setFirstLoadCompleted] = useState(false)
  const [busy, setBusy] = useState(false)
  const [label, setLabel] = useState("")
  const [generatedLink, setGeneratedLink] = useState("")
  const [error, setError] = useState("")
  const [confirmation, setConfirmation] = useState("")
  const [absentStudents, setAbsentStudents] = useState<AbsentStudent[]>([])
  const [absenceLoading, setAbsenceLoading] = useState(true)
  const [absenceError, setAbsenceError] = useState("")
  const [absenceRevision, setAbsenceRevision] = useState(0)
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
      .finally(() => { if (active) { setLoading(false); setFirstLoadCompleted(true) } })
    return () => { active = false }
  }, [load])

  useEffect(() => {
    let alive = true
    const loadAbsences = async () => {
      setAbsenceLoading(true)
      setAbsenceError("")
      try {
        const { data: studentRows, error: studentsError } = await supabase.from("students")
          .select("id,name,responsible,father_phone,mother_phone,registration_date,class_schedule,class_days,schedule_configs,is_active,archived_at")
          .eq("is_active", true).is("archived_at", null)
        if (studentsError) throw studentsError
        const entries: AttendanceEntry[] = []
        for (let offset = 0; ; offset += 1000) {
          const { data, error: attendanceError } = await supabase.from("attendance_records")
            .select("student_id,status,attendance:attendance_id(date,class_schedule)")
            .order("id").range(offset, offset + 999)
          if (attendanceError) throw attendanceError
          for (const row of (data || []) as AttendanceJoin[]) {
            const attendance = Array.isArray(row.attendance) ? row.attendance[0] : row.attendance
            if (!attendance || (row.status !== "Presente" && row.status !== "Ausente")) continue
            entries.push({
              studentId: row.student_id,
              date: attendance.date,
              schedule: attendance.class_schedule,
              status: row.status,
            })
          }
          if (!data || data.length < 1000) break
        }
        const today = localToday()
        const candidates = (studentRows || []).filter(student => absentForThreeConsecutiveWeeks({
          id: student.id,
          registrationDate: student.registration_date,
          isActive: student.is_active,
          archivedAt: student.archived_at,
          classSchedule: student.class_schedule,
          classDays: student.class_days || [],
          scheduleConfigs: Array.isArray(student.schedule_configs) ? student.schedule_configs : [],
        }, entries, today)).map(student => ({
          id: student.id,
          name: student.name,
          responsible: student.responsible || "",
          fatherPhone: student.father_phone || "",
          motherPhone: student.mother_phone || "",
        })).sort((a, b) => a.name.localeCompare(b.name, "pt-BR"))
        if (alive) setAbsentStudents(candidates)
      } catch (cause) {
        console.error("[SIGA] Falha no relatório de faltas:", cause)
        if (alive) setAbsenceError("Não foi possível consultar as faltas. Use Atualizar para tentar novamente.")
      } finally { if (alive) setAbsenceLoading(false) }
    }
    void loadAbsences()
    return () => { alive = false }
  }, [supabase, absenceRevision])

  const refresh = async () => {
    setAbsenceRevision(value => value + 1)
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
      const url = `https://matricula10nabola.netlify.app/#${token}`
      setGeneratedLink(url)
      setLabel("")
      setConfirmation("Convite criado. Copie o link exclusivo e envie ao responsável pelo WhatsApp.")
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

  const cancel = async (row: EnrollmentRequest) => {
    if (busy || !window.confirm("Cancelar este convite? Esta ação não apaga alunos já matriculados.")) return
    setBusy(true)
    setError("")
    try {
      const { data: result, error: cancelError } = await supabase.from("enrollment_requests")
        .update({ status: "cancelled" }).eq("id", row.id).in("status", ["invited", "pending"]).select("id")
      if (cancelError || !result?.length) throw new Error("cancel failed")
      
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
        paymentDueDay: s.payment_due_day, enrollmentCategory: s.enrollment_category,
        classSchedule: s.class_schedule, classDays: s.class_days || [],
        scheduleConfigs: Array.isArray(s.schedule_configs) ? s.schedule_configs : [],
        payments: [],
      }
      await generateWelcomeGuidePdf(student)
    } catch { setError("Não foi possível gerar o guia de boas-vindas.") }
    finally { setBusy(false) }
  }

  if (loading && !firstLoadCompleted) {
    return <SectionLoadingScreen title="Carregando matrículas..." description="Sincronizando convites e solicitações para conferência..." />
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

        <Card className="border-amber-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <AlertTriangle className="h-5 w-5 text-amber-600" /> Acompanhamento de frequência
            </CardTitle>
            <p className="text-sm text-slate-600">Alunos com faltas registradas em três semanas consecutivas, de acordo com os dias e horários de treino. Dias sem chamada não contam como ausência.</p>
          </CardHeader>
          <CardContent className="space-y-3">
            {absenceLoading ? <p className="text-sm text-slate-600">Consultando chamadas...</p>
              : absenceError ? <p role="alert" className="text-sm text-red-600">{absenceError}</p>
              : absentStudents.length === 0 ? <p className="text-sm text-slate-600">Nenhum aluno atingiu o critério de três semanas consecutivas de faltas registradas.</p>
              : <>
                <p className="text-sm font-semibold text-amber-800">{absentStudents.length} aluno(s) precisam de contato com a família</p>
                {absentStudents.map(student => (
                  <div key={student.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3">
                    <div>
                      <Link href={`/students/${student.id}`} className="font-semibold text-blue-700 hover:underline">{student.name}</Link>
                      <p className="text-sm text-slate-600">Responsável: {student.responsible || "Não informado"}</p>
                      <p className="text-xs text-amber-800">Três semanas consecutivas com faltas registradas</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {student.fatherPhone && <Button asChild size="sm" variant="outline"><a href={absenceWhatsAppLink(student, student.fatherPhone)} target="_blank" rel="noopener noreferrer"><MessageCircle className="mr-1.5 h-4 w-4" /> WhatsApp pai</a></Button>}
                      {student.motherPhone && student.motherPhone.replace(/\D/g, "") !== student.fatherPhone.replace(/\D/g, "") && <Button asChild size="sm" variant="outline"><a href={absenceWhatsAppLink(student, student.motherPhone)} target="_blank" rel="noopener noreferrer"><MessageCircle className="mr-1.5 h-4 w-4" /> WhatsApp mãe</a></Button>}
                      {!student.fatherPhone && !student.motherPhone && <span className="text-xs text-red-600">Sem telefone cadastrado</span>}
                    </div>
                  </div>
                ))}
              </>}
          </CardContent>
        </Card>

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
                    {row.status === "pending" && <Button asChild size="sm"><Link href={"/enrollments/" + row.id}><CheckCircle2 className="mr-2 h-4 w-4" /> Abrir conferência</Link></Button>}
                    {row.status === "approved" && row.student_id && <>
                      <Button size="sm" variant="outline" disabled={busy} onClick={() => downloadPdf(row.student_id!)}><FileText className="mr-2 h-4 w-4" /> Baixar guia</Button>
                      <Button asChild size="sm" variant="outline"><Link href={`/students/${row.student_id}`}>Ver aluno</Link></Button>
                    </>}
                    {(row.status === "invited" || row.status === "pending") && <Button size="sm" variant="outline" disabled={busy} onClick={() => cancel(row)}><XCircle className="mr-2 h-4 w-4" /> Cancelar</Button>}
                  </div>
                </CardContent>
              </Card>
            ))}
        </div>

      </main>
    </div>
  )
}
