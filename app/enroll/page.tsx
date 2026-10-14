"use client"

import { useEffect, useMemo, useState, type FormEvent } from "react"
import Image from "next/image"
import { ClipboardCheck, ArrowRight, CheckCircle2, ShieldCheck, CalendarDays } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
import { getBrowserClient } from "@/lib/supabase/client"
import { hashInvitationToken, onlyDigits, type EnrollmentFormData } from "@/lib/enrollment"

const blank: EnrollmentFormData = {
  name: "", document: "", birthDate: "", responsible: "", responsibleCpf: "",
  phone: "", email: "", emergencyName: "", emergencyPhone: "", healthNote: "", dueDay: 10,
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

  useEffect(() => {
    let active = true
    const check = async () => {
      try {
        const token = window.location.hash.replace(/^#/, "").trim()
        if (!/^[a-f0-9]{64}$/.test(token)) {
          if (active) setStatus("invalid")
          return
        }
        const hash = await hashInvitationToken(token)
        const { data: result, error: requestError } = await supabase.rpc("enrollment_public_status", { p_token_hash: hash })
        if (!active) return
        if (requestError) throw requestError
        setTokenHash(hash)
        setStatus((["invited", "pending", "approved", "cancelled", "expired"].includes(result?.status) ? result.status : "invalid") as FormStatus)
      } catch {
        if (active) { setError("Não foi possível consultar o convite. Tente atualizar a página."); setStatus("invalid") }
      }
    }
    void check()
    return () => { active = false }
  }, [supabase])

  const update = (key: keyof EnrollmentFormData, value: string | number) => {
    setData((previous) => ({ ...previous, [key]: value }))
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (submitting || !accepted) return
    setError("")
    const cpf = onlyDigits(data.responsibleCpf)
    const phone = onlyDigits(data.phone)
    const emergencyPhone = onlyDigits(data.emergencyPhone)
    const document = data.document.trim()

    if (!data.name.trim() || !data.responsible.trim() || !data.birthDate || document.length < 7 ||
      cpf.length !== 11 || phone.length < 10 || (emergencyPhone && emergencyPhone.length < 10) ||
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
        p_payload: { ...data, document, responsibleCpf: cpf, phone, emergencyPhone },
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
              <CheckCircle2 className={status === "pending" || status === "approved" ? "mx-auto h-12 w-12 text-green-600" : "mx-auto h-12 w-12 text-slate-400"} />
              <h1 className="text-2xl font-bold text-slate-900">
                {status === "pending" ? "Ficha enviada com sucesso!" :
                  status === "approved" ? "Matrícula aprovada" :
                  status === "expired" ? "Convite expirado" :
                  status === "cancelled" ? "Convite cancelado" : "Convite não encontrado"}
              </h1>
              <p className="text-slate-600">
                {status === "pending" ? "Recebemos os dados. O administrativo irá conferir as informações e confirmar a matrícula." :
                  status === "approved" ? "O administrativo já aprovou esta solicitação." :
                  "Peça ao administrativo da 10 na Bola um novo link para preencher a ficha."}
              </p>
              {error && <p className="text-sm text-red-600">{error}</p>}
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
                  <div><Label htmlFor="document">CPF ou RG novo do aluno *</Label><Input id="document" required maxLength={24} value={data.document} onChange={(e) => update("document", e.target.value)} className="mt-1" /></div>
                  <div><Label htmlFor="birth">Data de nascimento *</Label><Input id="birth" type="date" required value={data.birthDate} onChange={(e) => update("birthDate", e.target.value)} className="mt-1" /></div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle className="text-lg">2. Dados do responsável</CardTitle></CardHeader>
                <CardContent className="grid gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-2"><Label htmlFor="responsible">Nome completo do responsável *</Label><Input id="responsible" required maxLength={120} value={data.responsible} onChange={(e) => update("responsible", e.target.value)} className="mt-1" /></div>
                  <div><Label htmlFor="cpf">CPF do responsável *</Label><Input id="cpf" required inputMode="numeric" maxLength={14} value={data.responsibleCpf} onChange={(e) => update("responsibleCpf", e.target.value)} className="mt-1" /></div>
                  <div><Label htmlFor="phone">Telefone / WhatsApp *</Label><Input id="phone" required type="tel" maxLength={20} value={data.phone} onChange={(e) => update("phone", e.target.value)} className="mt-1" /></div>
                  <div className="sm:col-span-2"><Label htmlFor="email">E-mail do responsável *</Label><Input id="email" required type="email" maxLength={150} value={data.email} onChange={(e) => update("email", e.target.value)} className="mt-1" /></div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle className="text-lg">3. Informações complementares</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div><Label htmlFor="emergencyName">Contato de emergência (nome)</Label><Input id="emergencyName" maxLength={120} value={data.emergencyName} onChange={(e) => update("emergencyName", e.target.value)} className="mt-1" /></div>
                    <div><Label htmlFor="emergencyPhone">Telefone de emergência</Label><Input id="emergencyPhone" type="tel" maxLength={20} value={data.emergencyPhone} onChange={(e) => update("emergencyPhone", e.target.value)} className="mt-1" /></div>
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
