"use client"
import { useEffect, useState } from "react"
import { ArrowRight, ArrowLeft, Check, CheckCircle2, ShieldCheck } from "lucide-react"
import { enrollmentSchema } from "@/lib/enrollment/validation"

const empty = { name: "", documentType: "CPF" as "CPF" | "RG", document: "", birthDate: "", responsible: "", responsibleCpf: "", email: "", phone: "", emergencyName: "", emergencyRelationship: "", emergencyPhone: "", dueDay: 10, healthNotes: "", confirmed: false }
const control = "mt-2 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-3 text-base text-slate-900 outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-100"

export function EnrollmentForm({ token }: { token: string }) {
  const [state, setState] = useState<"loading" | "open" | "received" | "error">("loading")
  const [data, setData] = useState(empty)
  const [step, setStep] = useState(0)
  const [error, setError] = useState("")
  const [busy, setBusy] = useState(false)
  const [website, setWebsite] = useState("")
  const change = (key: keyof typeof empty, value: string | number | boolean) => setData((v) => ({ ...v, [key]: value }))
  useEffect(() => {
    const controller = new AbortController()
    async function check() {
      try {
        const r = await fetch("/api/enrollment", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token, action: "check" }), signal: controller.signal })
        const result = await r.json()
        if (!r.ok) throw new Error(result.error)
        setState(result.status === "received" ? "received" : "open")
      } catch (e) {
        if (controller.signal.aborted) return
        setError(e instanceof Error ? e.message : "Não foi possível abrir o link.")
        setState("error")
      }
    }
    void check()
    return () => controller.abort()
  }, [token])
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError("")
    if (step < 2) { setStep(step + 1); window.scrollTo({ top: 0, behavior: "smooth" }); return }
    const parsed = enrollmentSchema.safeParse(data)
    if (!parsed.success) {
      const issue = parsed.error.issues[0]
      setError(issue.message)
      const key = String(issue.path[0])
      setStep(["name", "document", "documentType", "birthDate"].includes(key) ? 0 : key === "confirmed" ? 2 : 1)
      return
    }
    setBusy(true)
    try {
      const r = await fetch("/api/enrollment", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token, action: "submit", data: parsed.data, website }) })
      const result = await r.json()
      if (!r.ok) throw new Error(result.error)
      setData(empty); setState("received")
      window.scrollTo({ top: 0, behavior: "smooth" })
    } catch (e) { setError(e instanceof Error ? e.message : "Não foi possível enviar. Tente novamente.") }
    finally { setBusy(false) }
  }
  function field(key: keyof typeof empty, label: string, type = "text", autoComplete = "off", maxLength = 150) {
    return <label className="block text-sm font-semibold text-slate-700" key={key} htmlFor={key}>{label}<input id={key} name={key} className={control} type={type} autoComplete={autoComplete} maxLength={maxLength} required value={String(data[key])} onChange={(e) => change(key, e.target.value)} /></label>
  }
  return <main className="min-h-screen bg-[#f3f5f9] pb-12 text-slate-900">
    <header className="bg-[#071e46] px-5 pt-9 pb-16 text-white"><div className="mx-auto max-w-2xl"><div className="flex items-center gap-3"><div className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-xl font-black italic text-[#071e46]">10</div><div><div className="text-lg font-extrabold tracking-wide">10 NA BOLA</div><div className="text-xs tracking-widest text-blue-200">ESCOLA DE FUTEBOL</div></div></div><div className="mt-8 h-1 w-10 rounded-full bg-red-500" /><h1 className="mt-4 text-3xl font-bold sm:text-4xl">O próximo treino começa aqui.</h1><p className="mt-3 max-w-lg text-blue-100">Preencha a ficha do aluno. Nossa equipe vai conferir os dados e combinar os detalhes da matrícula com você.</p></div></header>
    <div className="mx-auto -mt-8 max-w-2xl px-4">
      {state === "loading" && <div role="status" className="rounded-2xl bg-white p-10 text-center shadow-sm">Abrindo sua ficha...</div>}
      {state === "error" && <div className="rounded-2xl bg-white p-8 shadow-sm"><h2 className="text-xl font-bold">Não foi possível abrir a ficha</h2><p role="alert" className="mt-3 text-slate-600">{error}</p><button className="mt-6 rounded-xl bg-[#071e46] px-5 py-3 text-white" onClick={() => window.location.reload()}>Tentar novamente</button></div>}
      {state === "received" && <section className="rounded-2xl bg-white p-8 text-center shadow-sm"><CheckCircle2 className="mx-auto h-14 w-14 text-emerald-600" /><h2 className="mt-5 text-2xl font-bold">Ficha recebida!</h2><p className="mt-3 text-slate-600">O administrativo vai conferir as informações e entrar em contato para confirmar turma, dias, horários e mensalidade.</p><div className="mt-6 rounded-xl bg-blue-50 p-4 text-sm text-blue-950">O envio da ficha ainda não confirma a matrícula. Você não precisa preencher novamente.</div></section>}
      {state === "open" && <form onSubmit={submit} className="overflow-hidden rounded-2xl bg-white shadow-sm">
        <ol aria-label="Etapas da matrícula" className="flex border-b border-slate-100 px-5 py-5 sm:px-8">{["Aluno", "Responsável", "Conferência"].map((label, i) => <li key={label} aria-current={step === i ? "step" : undefined} className={`flex flex-1 items-center gap-2 text-xs font-semibold sm:text-sm ${i === step ? "text-[#071e46]" : "text-slate-400"}`}><span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${i <= step ? "bg-[#071e46] text-white" : "bg-slate-100"}`}>{i < step ? <Check className="h-4 w-4" /> : i + 1}</span>{label}</li>)}</ol>
        <div className="p-5 sm:p-8">
          <div className="mb-6"><p className="text-xs font-bold uppercase tracking-widest text-red-600">Etapa {step + 1} de 3</p><h2 className="mt-2 text-2xl font-bold">{["Quem vai entrar em campo?", "Com quem podemos falar?", "Está tudo certinho?"][step]}</h2><p className="mt-2 text-sm text-slate-500">{step === 2 ? "Confira as informações antes de enviar." : "Todos os campos são obrigatórios, exceto as observações de saúde."}</p></div>
          {error && <p role="alert" className="mb-5 rounded-xl bg-red-50 p-4 text-sm text-red-800">{error}</p>}
          {step === 0 && <div className="grid gap-5">{field("name", "Nome completo do aluno", "text", "section-student name")}{field("birthDate", "Data de nascimento", "date", "section-student bday")}<div className="grid gap-4 sm:grid-cols-[120px_1fr]"><label className="text-sm font-semibold text-slate-700">Documento<select aria-label="Tipo de documento" className={control} value={data.documentType} onChange={(e) => change("documentType", e.target.value)}><option>CPF</option><option>RG</option></select></label>{field("document", data.documentType === "CPF" ? "CPF do aluno (ou CIN)" : "RG do aluno", "text", "off", 25)}</div></div>}
          {step === 1 && <div className="grid gap-5">{field("responsible", "Nome completo do responsável", "text", "section-guardian name")}{field("responsibleCpf", "CPF do responsável", "text", "off", 18)}{field("phone", "Telefone do responsável, com DDD", "tel", "section-guardian tel", 20)}{field("email", "E-mail do responsável", "email", "section-guardian email", 200)}<div className="mt-3 border-t border-slate-100 pt-6"><h3 className="mb-5 font-bold">Contato de emergência</h3><div className="grid gap-5">{field("emergencyName", "Nome completo do contato")}{field("emergencyRelationship", "Vínculo com o aluno (ex.: avó, tio)", "text", "off", 60)}{field("emergencyPhone", "Telefone de emergência, com DDD", "tel", "off", 20)}</div></div><label className="text-sm font-semibold text-slate-700">Dia de preferência para pagamento<select className={control} value={data.dueDay} onChange={(e) => change("dueDay", Number(e.target.value))}>{Array.from({ length: 28 }, (_, i) => <option key={i + 1} value={i + 1}>Dia {i + 1}</option>)}</select><span className="mt-2 block text-xs font-normal text-slate-500">A data será confirmada pelo administrativo.</span></label><label className="text-sm font-semibold text-slate-700">Cuidados de saúde para os treinos <span className="font-normal text-slate-500">(opcional)</span><textarea className={control} rows={3} maxLength={2000} value={data.healthNotes} onChange={(e) => change("healthNotes", e.target.value)} placeholder="Informe apenas cuidados, alergias ou restrições relevantes aos treinos." /><span className="mt-2 block text-xs font-normal text-slate-500">Estas observações ficam disponíveis ao administrativo.</span></label></div>}
          {step === 2 && <div><dl className="divide-y divide-slate-100 rounded-xl border border-slate-200 px-4">{[["Aluno", data.name], ["Nascimento", data.birthDate.split("-").reverse().join("/")], [data.documentType, data.document], ["Responsável", data.responsible], ["CPF do responsável", data.responsibleCpf], ["Telefone", data.phone], ["E-mail", data.email], ["Emergência", `${data.emergencyName} (${data.emergencyRelationship}) · ${data.emergencyPhone}`], ["Pagamento", `Preferência: dia ${data.dueDay}`], ["Cuidados nos treinos", data.healthNotes || "Não informado"]].map(([label, value]) => <div className="py-3" key={label}><dt className="text-xs text-slate-500">{label}</dt><dd className="mt-1 break-words text-sm font-medium">{value}</dd></div>)}</dl><div className="mt-6 rounded-xl bg-slate-50 p-4 text-sm leading-relaxed text-slate-600"><ShieldCheck className="mb-2 h-5 w-5 text-[#071e46]" /><p>A 10 na Bola usará estes dados para analisar a matrícula, manter o cadastro e entrar em contato sobre as atividades. As observações de saúde servem para orientar os cuidados nos treinos. Para corrigir informações ou solicitar esclarecimentos sobre o uso dos dados, fale com o administrativo.</p></div><label className="mt-6 flex items-start gap-3 text-sm leading-relaxed"><input type="checkbox" required className="mt-1 h-5 w-5 shrink-0 accent-[#071e46]" checked={data.confirmed} onChange={(e) => change("confirmed", e.target.checked)} /><span>Sou responsável pelo aluno, confirmo que os dados estão corretos e estou ciente do uso das informações descrito acima.</span></label><p className="mt-3 text-xs text-slate-500">Não é necessário assinar. A matrícula será confirmada pelo administrativo.</p></div>}
          <input aria-hidden="true" tabIndex={-1} autoComplete="off" className="hidden" name="website" value={website} onChange={(e) => setWebsite(e.target.value)} />
          <div className="mt-8 flex gap-3">{step > 0 && <button type="button" disabled={busy} className="flex items-center gap-2 rounded-xl border border-slate-300 px-4 py-3 font-semibold disabled:opacity-50" onClick={() => { setStep(step - 1); setError("") }}><ArrowLeft className="h-4 w-4" />Voltar</button>}<button type="submit" disabled={busy} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#071e46] px-5 py-3.5 font-semibold text-white hover:bg-blue-950 disabled:opacity-50">{busy ? "Enviando..." : step === 2 ? "Enviar ficha" : "Continuar"}{!busy && <ArrowRight className="h-4 w-4" />}</button></div>
        </div>
      </form>}
      <p className="mt-7 text-center text-xs text-slate-500">Escola de Futebol 10 na Bola · Cadastro de matrícula</p>
    </div>
  </main>
}
