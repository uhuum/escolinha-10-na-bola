"use client"

import { useEffect, useMemo, useState, type FormEvent } from "react"
import Image from "next/image"
import { ClipboardCheck, ArrowRight, CheckCircle2, ShieldCheck, CalendarDays, Clock3, FileCheck2, RefreshCw } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
import { getBrowserClient } from "@/lib/supabase/client"
import { hashInvitationToken, onlyDigits, type EnrollmentFormData } from "@/lib/enrollment"
import { formatCPF, formatRG, formatPhone } from "@/lib/formatters"

const blank: EnrollmentFormData = {
  name: "", document: "", documentType: "CPF", birthDate: "", responsible: "", responsibleCpf: "",
  phone: "", fatherPhone: "", motherPhone: "", email: "", emergencyName: "", emergencyPhone: "", healthNote: "", dueDay: 10,
}

type FormStatus = "loading" | "invited" | "pending" | "approved" | "cancelled" | "expired" | "invalid"

export default function EnrollmentPage() {
  const supabase = useMemo(() => getBrowserClient(), [])
  const [status, setStatus] = useState<FormStatus>("loading")
  const [tokenHash, setTokenHash] = useState("")
  const [data, setData] = useState<EnrollmentFormData>(blank)
  const [accepted, setAccepted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [checking, setChecking] = useState(false)

  // The random invitation secret stays in the URL fragment and is never sent to the server.
  // Only its SHA-256 digest is passed to the restricted status/submission procedures.
  const refreshStatus = async (hash: string) => {
    const { data: result, error: requestError } = await supabase.rpc("enrollment_public_status", {
      p_token_hash: hash,
    })
    if (requestError) throw requestError
    const nextStatus = result?.status
    return (["invited", "pending", "approved", "cancelled", "expired"].includes(nextStatus)
      ? nextStatus
      : "invalid") as FormStatus
  }

  useEffect(() => {
    let active = true
    let currentHash = ""
    const check = async () => {
      try {
        const token = window.location.hash.replace(/^#/, "").trim()
        if (!/^[a-f0-9]{64}$/.test(token)) {
          if (active) setStatus("invalid")
          return
        }
        currentHash = await hashInvitationToken(token)
        const next = await refreshStatus(currentHash)
        if (!active) return
        setTokenHash(currentHash)
        setStatus(next)
      } catch {
        if (active) { setError("Não foi possível consultar o convite. Tente atualizar a página."); setStatus("invalid") }
      }
    }

    void check()
    // Returning to the link or app automatically refreshes the status.
    const refreshIfVisible = async () => {
      if (!active || !currentHash || document.visibilityState !== "visible") return
      try {
        const next = await refreshStatus(currentHash)
        if (active) setStatus(next)
      } catch { /* Keep the last confirmed status until connectivity returns. */ }
    }
    const onFocus = () => { void refreshIfVisible() }
    window.addEventListener("focus", onFocus)
    document.addEventListener("visibilitychange", onFocus)
    const interval = window.setInterval(() => { void refreshIfVisible() }, 30000)
    return () => {
      active = false
      window.clearInterval(interval)
      window.removeEventListener("focus", onFocus)
      document.removeEventListener("visibilitychange", onFocus)
    }
  }, [supabase])

  const checkAgain = async () => {
    if (!tokenHash || checking) return
    setChecking(true)
    setError("")
    try { setStatus(await refreshStatus(tokenHash)) }
    catch { setError("Não foi possível atualizar o status. Tente novamente em instantes.") }
    finally { setChecking(false) }
  }

  const update = (key: keyof EnrollmentFormData, value: string | number) => {
    setData((previous) => ({ ...previous, [key]: value }))
  }

  const updateDocumentType = (type: "RG" | "CPF") => {
    setData((previous) => ({ ...previous, documentType: type, document: "" }))
  }

  const updateDocument = (value: string) => {
    update("document", data.documentType === "RG" ? formatRG(value) : formatCPF(value))
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (submitting || !accepted) return
    setError("")
    const cpf = onlyDigits(data.responsibleCpf)
    const phone = onlyDigits(data.phone)
    const emergencyPhone = onlyDigits(data.emergencyPhone)
    const fatherPhone = onlyDigits(data.fatherPhone || "")
    const motherPhone = onlyDigits(data.motherPhone || "")
    const document = data.documentType === "RG"
      ? data.document.trim().toUpperCase()
      : onlyDigits(data.document)
    const documentValid = data.documentType === "CPF"
      ? onlyDigits(document).length === 11
      : document.replace(/[^0-9X]/g, "").length >= 7

    if (!data.name.trim() || !data.responsible.trim() || !data.birthDate || !documentValid ||
      cpf.length !== 11 || phone.length < 10 || (emergencyPhone && emergencyPhone.length < 10) ||
      (fatherPhone && fatherPhone.length < 10) || (motherPhone && motherPhone.length < 10) ||
      data.dueDay < 1 || data.dueDay > 28) {
      setError("Confira os documentos, telefones e demais campos obrigatórios.")
      return
    }
    if (new Date(data.birthDate + "T12:00:00") > new Date()) {
      setError("A data de nascimento não pode ser futura.")
      return
    }

    setSubmitting(true)
    try {
      const { error: submitError } = await supabase.rpc("submit_enrollment", {
        p_token_hash: tokenHash,
        p_privacy_version: "2026-10",
        p_payload: { ...data, document, responsibleCpf: cpf, phone, fatherPhone, motherPhone, emergencyPhone },
      })
      if (submitError) throw submitError
      setStatus("pending")
      setData(blank)
    } catch {
      setError("Não foi possível enviar a ficha. Verifique se o convite ainda está válido e tente novamente.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-[#0a1835] text-white">
        <div className="mx-auto flex max-w-2xl items-center gap-3 px-5 py-4">
          <Image src="/logo-ceap.png" width={54} height={54} alt="10 na Bola" className="object-contain" />
          <div>
            <p className="text-lg font-bold">10 na Bola</p>
            <p className="text-xs text-slate-300">Escolinha de Futebol · Matrícula online</p>
          </div>
        </div>
        <div className="h-1 bg-red-600" />
      </header>

      <main className="mx-auto max-w-2xl px-4 py-8">
        {status === "loading" ? (
          <p className="py-20 text-center text-slate-600">Verificando seu convite de matrícula...</p>
        ) : status !== "invited" ? (
          <Card className="border-slate-200">
            <CardContent className="space-y-4 py-10 text-center">

              {status === "pending" ? <Clock3 className="mx-auto h-14 w-14 text-amber-600" /> :
                status === "approved" ? <FileCheck2 className="mx-auto h-14 w-14 text-green-600" /> :
                <ShieldCheck className="mx-auto h-12 w-12 text-slate-400" />}
              {(status === "pending" || status === "approved") && (
                <span className={status === "approved" ? "mx-auto rounded-full bg-green-100 px-4 py-1 text-sm font-semibold text-green-800" : "mx-auto rounded-full bg-amber-100 px-4 py-1 text-sm font-semibold text-amber-800"}>
                  {status === "pending" ? "STATUS: EM ANÁLISE" : "STATUS: APROVADA"}
                </span>
              )}
              <h1 className="text-2xl font-bold text-slate-900">
                {status === "pending" ? "Matrícula em análise" :
                  status === "approved" ? "Matrícula aprovada!" :
                  status === "expired" ? "Convite expirado" :
                  status === "cancelled" ? "Convite cancelado" : "Convite não encontrado"}
              </h1>
              <p className="text-slate-600">
                {status === "pending" ? "Recebemos sua ficha de matrícula. Seus dados estão aguardando conferência e aprovação do administrativo da 10 na Bola. Não é necessário preencher novamente." :
                  status === "approved" ? "Sua solicitação foi aprovada pelo administrativo da 10 na Bola. Entre em contato com a escolinha para receber orientações sobre os treinos." :
                  "Peça ao administrativo da 10 na Bola um novo link para preencher a ficha."}
              </p>
              {(status === "pending" || status === "approved") && <>
                <p className="text-xs text-slate-500">Salve este link para acompanhar a matrícula. O status também será atualizado automaticamente enquanto esta página estiver aberta.</p>
                <Button type="button" variant="outline" disabled={checking} onClick={checkAgain}><RefreshCw className="mr-2 h-4 w-4" />{checking ? "Consultando..." : "Atualizar status"}</Button>
              </>}
              {error && <p role="alert" className="text-sm text-red-600">{error}</p>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="mb-6 space-y-2">
              <span className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-800"><ClipboardCheck className="h-4 w-4" /> Solicitação de matrícula</span>
              <h1 className="text-3xl font-bold tracking-tight text-slate-900">Seja bem-vindo à 10 na Bola!</h1>
              <p className="text-slate-600">Preencha os dados do aluno e do responsável. Não é necessário imprimir ou assinar nada.</p>
            </div>
            <form onSubmit={handleSubmit} className="space-y-5">
              <Card>
                <CardHeader><CardTitle className="text-lg">1. Dados do aluno</CardTitle></CardHeader>
                <CardContent className="grid gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-2"><Label htmlFor="name">Nome completo *</Label><Input id="name" required maxLength={120} autoComplete="name" value={data.name} onChange={(e) => update("name", e.target.value)} className="mt-1" /></div>
                  <div>
                    <Label htmlFor="document">Documento do aluno *</Label>
                    <div className="mt-1 flex gap-2">
                      <select aria-label="Tipo de documento" value={data.documentType || "CPF"} onChange={(e) => updateDocumentType(e.target.value as "RG" | "CPF")} className="h-10 w-24 rounded-md border border-input bg-white px-2 text-sm">
                        <option value="CPF">CPF</option>
                        <option value="RG">RG</option>
                      </select>
                      <Input id="document" required inputMode={data.documentType === "RG" ? "text" : "numeric"} maxLength={data.documentType === "RG" ? 14 : 14} placeholder={data.documentType === "RG" ? "12.345.678-9" : "000.000.000-00"} value={data.document} onChange={(e) => updateDocument(e.target.value)} className="flex-1" />
                    </div>
                  </div>
                  <div><Label htmlFor="birth">Data de nascimento *</Label><Input id="birth" type="date" required value={data.birthDate} onChange={(e) => update("birthDate", e.target.value)} className="mt-1" /></div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle className="text-lg">2. Dados do responsável</CardTitle></CardHeader>
                <CardContent className="grid gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-2"><Label htmlFor="responsible">Nome completo do responsável *</Label><Input id="responsible" required maxLength={120} value={data.responsible} onChange={(e) => update("responsible", e.target.value)} className="mt-1" /></div>
                  <div><Label htmlFor="cpf">CPF do responsável *</Label><Input id="cpf" required inputMode="numeric" maxLength={14} placeholder="000.000.000-00" value={data.responsibleCpf} onChange={(e) => update("responsibleCpf", formatCPF(e.target.value))} className="mt-1" /></div>
                  <div><Label htmlFor="phone">Telefone / WhatsApp *</Label><Input id="phone" required type="tel" inputMode="tel" maxLength={15} placeholder="(11) 99999-9999" value={data.phone} onChange={(e) => update("phone", formatPhone(e.target.value))} className="mt-1" /></div>
                  <div><Label htmlFor="fatherPhone">Telefone do pai (opcional)</Label><Input id="fatherPhone" type="tel" maxLength={15} placeholder="(11) 99999-9999" value={data.fatherPhone || ""} onChange={(e) => update("fatherPhone", formatPhone(e.target.value))} className="mt-1" /></div>
                  <div><Label htmlFor="motherPhone">Telefone da mãe (opcional)</Label><Input id="motherPhone" type="tel" maxLength={15} placeholder="(11) 99999-9999" value={data.motherPhone || ""} onChange={(e) => update("motherPhone", formatPhone(e.target.value))} className="mt-1" /></div>
                  <div className="sm:col-span-2"><Label htmlFor="email">E-mail do responsável *</Label><Input id="email" required type="email" maxLength={150} value={data.email} onChange={(e) => update("email", e.target.value)} className="mt-1" /></div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle className="text-lg">3. Informações complementares</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div><Label htmlFor="emergencyName">Contato de emergência (nome)</Label><Input id="emergencyName" maxLength={120} value={data.emergencyName} onChange={(e) => update("emergencyName", e.target.value)} className="mt-1" /></div>
                    <div><Label htmlFor="emergencyPhone">Telefone de emergência</Label><Input id="emergencyPhone" type="tel" maxLength={15} placeholder="(11) 99999-9999" value={data.emergencyPhone} onChange={(e) => update("emergencyPhone", formatPhone(e.target.value))} className="mt-1" /></div>
                  </div>
                  <div><Label htmlFor="healthNote">Informação importante de saúde para os treinos (opcional)</Label><Textarea id="healthNote" maxLength={500} rows={3} placeholder="Informe somente o necessário para a segurança do aluno." value={data.healthNote} onChange={(e) => update("healthNote", e.target.value)} className="mt-1" /></div>
                  <div>
                    <Label htmlFor="dueDay" className="flex items-center gap-2"><CalendarDays className="h-4 w-4" /> Dia preferido para vencimento da mensalidade *</Label>
                    <select id="dueDay" className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={data.dueDay} onChange={(e) => update("dueDay", Number(e.target.value))}>
                      {Array.from({ length: 28 }, (_, index) => index + 1).map((day) => <option key={day} value={day}>Dia {day}</option>)}
                    </select>
                    <p className="mt-1 text-xs text-slate-500">Sujeito à confirmação do administrativo.</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-blue-100 bg-blue-50/50">
                <CardContent className="space-y-4 pt-6">
                  <div className="flex gap-3 text-sm text-slate-700"><ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-blue-700" />
                    <p>Seus dados e os dados do aluno serão utilizados pela 10 na Bola para analisar e administrar a matrícula, organizar os treinos e realizar contatos administrativos. Os campos de saúde são opcionais e devem conter apenas informações necessárias à segurança nos treinos.</p>
                  </div>
                  <label htmlFor="accepted" className="flex cursor-pointer items-start gap-3 text-sm">
                    <Checkbox id="accepted" checked={accepted} onCheckedChange={(checked) => setAccepted(checked === true)} aria-label="Confirmar informações e ciência sobre uso dos dados" className="mt-0.5" />
                    <span>Confirmo que sou responsável pelo aluno, que os dados informados estão corretos e que li a explicação sobre o uso dos dados. *</span>
                  </label>
                </CardContent>
              </Card>
              {error && <p role="alert" className="text-sm font-medium text-red-600">{error}</p>}
              <Button type="submit" disabled={submitting || !accepted} className="h-12 w-full bg-red-600 text-base font-semibold hover:bg-red-700">
                {submitting ? "Enviando ficha..." : "Enviar ficha de matrícula"} <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <p className="text-center text-xs text-slate-500">O envio não confirma a matrícula automaticamente. Aguarde a aprovação do administrativo.</p>
            </form>
          </>
        )}
      </main>
    </div>
  )
}
