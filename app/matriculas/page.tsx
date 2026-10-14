"use client"
import { useCallback, useEffect, useRef, useState } from "react"
import Link from "next/link"
import { ClipboardList, Copy, Download, Link2, RefreshCw } from "lucide-react"
import { AppHeader } from "@/components/app-header"
import { Button } from "@/components/ui/button"
import { approvalSchema, schedules, weekDays, type EnrollmentRequest, type ApprovalData } from "@/lib/enrollment/validation"
import { generateEnrollmentPdf } from "@/lib/utils/enrollment-pdf"

const statusNames = { pending: "Pendentes", invited: "Convites", approved: "Aprovadas", cancelled: "Encerradas" }
const inputClass = "mt-1 w-full rounded-lg border border-slate-300 bg-white p-3 text-base text-slate-900 focus:ring-2 focus:ring-blue-200"
const date = (value: string) => new Date(value).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo", dateStyle: "short", timeStyle: "short" })

export default function EnrollmentsPage() {
  const [status, setStatus] = useState<keyof typeof statusNames>("pending")
  const [page, setPage] = useState(0)
  const [rows, setRows] = useState<EnrollmentRequest[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [notice, setNotice] = useState("")
  const [busy, setBusy] = useState(false)
  const [newInvite, setNewInvite] = useState(false)
  const [label, setLabel] = useState("")
  const [invite, setInvite] = useState<{ url: string; expiresAt: string } | null>(null)
  const [selected, setSelected] = useState<EnrollmentRequest | null>(null)
  const [approval, setApproval] = useState<ApprovalData>({ category: "", monthlyValue: 0, dueDay: 10, scheduleConfigs: [] })
  const [amount, setAmount] = useState("")
  const sequence = useRef(0)
  const load = useCallback(async () => {
    const request = ++sequence.current
    setLoading(true); setError("")
    try {
      const r = await fetch(`/api/enrollments?status=${status}&page=${page}`, { cache: "no-store" })
      const result = await r.json()
      if (!r.ok) throw new Error(result.error)
      if (request !== sequence.current) return
      setRows(result.requests); setTotal(result.total)
    } catch (e) { if (request === sequence.current) { setRows([]); setError(e instanceof Error ? e.message : "Falha ao carregar matrículas.") } }
    finally { if (request === sequence.current) setLoading(false) }
  }, [status, page])
  useEffect(() => { void load(); return () => { sequence.current++ } }, [load])
  async function createInvite(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setError(""); setNotice("")
    try {
      const r = await fetch("/api/enrollments", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ label }) })
      const result = await r.json()
      if (!r.ok) throw new Error(result.error)
      setInvite({ url: new URL(result.path, window.location.origin).href, expiresAt: result.expiresAt })
      await load()
    } catch (e) { setError(e instanceof Error ? e.message : "Falha ao criar convite.") }
    finally { setBusy(false) }
  }
  async function copy(value: string) {
    try { await navigator.clipboard.writeText(value); setNotice("Copiado! Agora você pode enviar pelo WhatsApp.") }
    catch { setError("Não foi possível copiar automaticamente. Selecione e copie o link abaixo.") }
  }
  async function approve(e: React.FormEvent) {
    e.preventDefault()
    if (!selected) return
    const parsed = approvalSchema.safeParse({ ...approval, monthlyValue: Number(amount) })
    if (!parsed.success) { setError(parsed.error.issues[0].message); return }
    setBusy(true); setError(""); setNotice("")
    try {
      const r = await fetch(`/api/enrollments/${selected.id}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "approve", approval: parsed.data }) })
      const result = await r.json()
      if (!r.ok) throw new Error(result.error)
      setSelected({ ...selected, status: "approved", student_id: result.studentId, approval: parsed.data })
      setNotice("Matrícula aprovada. Aluno e mensalidades cadastrados. A confirmação em PDF está disponível abaixo.")
      await load()
    } catch (e) { setError(e instanceof Error ? e.message : "Falha ao aprovar matrícula.") }
    finally { setBusy(false) }
  }
  async function cancel(row: EnrollmentRequest) {
    if (!window.confirm(`Encerrar a ficha “${row.label}”? O link deixará de aceitar envios.`)) return
    setBusy(true); setError("")
    try {
      const r = await fetch(`/api/enrollments/${row.id}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "cancel" }) })
      const result = await r.json()
      if (!r.ok) throw new Error(result.error)
      setSelected(null); await load(); setNotice("Ficha encerrada.")
    } catch (e) { setError(e instanceof Error ? e.message : "Falha ao encerrar ficha.") }
    finally { setBusy(false) }
  }
  async function pdf(row: EnrollmentRequest) {
    if (!row.payload || !row.approval || !row.student_id) return
    setBusy(true); setError("")
    try {
      const p = row.payload; const a = row.approval
      await generateEnrollmentPdf({ id: row.student_id, name: p.name, rg: p.document, birthDate: p.birthDate, responsible: p.responsible, responsibleCpf: p.responsibleCpf, responsibleEmail: p.email, fatherPhone: p.phone, motherPhone: p.emergencyPhone, monthlyValue: a.monthlyValue, isActive: true, isScholarship: a.monthlyValue === 0, scheduleConfigs: a.scheduleConfigs, classSchedule: a.scheduleConfigs[0].schedule, classDays: a.scheduleConfigs.map((s) => s.day), payments: [], paymentDueDay: a.dueDay, enrollmentCategory: a.category })
    } catch { setError("Não foi possível gerar o PDF. Tente novamente.") }
    finally { setBusy(false) }
  }
  const p = selected?.payload
  return <div className="min-h-screen bg-slate-50 text-slate-900"><AppHeader /><main className="mx-auto max-w-6xl px-4 py-8 sm:px-8">
    <div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-widest text-red-600">Secretaria • 10 na Bola</p><h1 className="mt-2 text-3xl font-bold">Matrículas por link</h1><p className="mt-2 text-sm text-slate-500">Envie a ficha. Confira os dados. Confirme a matrícula.</p></div><Button className="gap-2 bg-[#071e46]" onClick={() => { setNewInvite(true); setInvite(null); setLabel(""); setNotice("") }}><Link2 className="h-4 w-4" />Nova matrícula por link</Button></div>
    {notice && <div role="status" className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">{notice}</div>}
    {error && <div role="alert" className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-900">{error}</div>}
    {newInvite && <section className="mt-6 rounded-2xl border bg-white p-6"><div className="flex justify-between gap-3"><h2 className="text-lg font-bold">Convite para a família</h2><button className="text-sm text-slate-600 underline" onClick={() => setNewInvite(false)}>Fechar</button></div>{!invite ? <form className="mt-4 flex flex-wrap items-end gap-3" onSubmit={createInvite}><label className="min-w-0 flex-1 text-sm font-medium">Identificação interna do convite<input className={inputClass} required maxLength={100} value={label} placeholder="Ex.: família do aluno" onChange={(e) => setLabel(e.target.value)} /></label><Button disabled={busy} type="submit" className="h-12 bg-[#071e46]">{busy ? "Criando..." : "Gerar link"}</Button><p className="w-full text-xs text-slate-500">Um link por aluno, válido por 14 dias. Não coloque CPF nesta identificação.</p></form> : <div className="mt-4"><p className="text-sm text-slate-600">Link criado. Copie antes de fechar esta tela. Válido até {date(invite.expiresAt)}.</p><label className="mt-3 block text-sm font-medium">Link da ficha<textarea readOnly aria-label="Link da ficha" className={`${inputClass} min-h-24 break-all text-sm`} value={invite.url} onFocus={(e) => e.target.select()} /></label><div className="mt-3 flex flex-wrap gap-3"><Button variant="outline" className="gap-2" onClick={() => void copy(invite.url)}><Copy className="h-4 w-4" />Copiar link</Button><Button className="bg-[#071e46]" onClick={() => void copy(`Olá! Para solicitar a matrícula na Escola de Futebol 10 na Bola, preencha a ficha pelo link abaixo. Não precisa imprimir ou assinar. Após o envio, nosso administrativo vai conferir as informações e confirmar os detalhes com você.\n\n${invite.url}`)}>Copiar mensagem para WhatsApp</Button></div></div>}</section>}
    <div className="mt-8 flex flex-wrap items-center gap-2">{Object.entries(statusNames).map(([key, title]) => <button key={key} disabled={busy} className={`rounded-full px-4 py-2 text-sm font-medium ${status === key ? "bg-[#071e46] text-white" : "border bg-white text-slate-600"}`} onClick={() => { setStatus(key as typeof status); setPage(0); setSelected(null) }}>{title}</button>)}<Button variant="ghost" aria-label="Atualizar matrículas" disabled={loading || busy} onClick={() => void load()}><RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /></Button></div>
    <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(260px,1fr)_minmax(0,1.6fr)]"><section className="min-w-0"><div className="overflow-hidden rounded-2xl border bg-white">{loading ? <p role="status" className="p-8 text-center text-sm text-slate-500">Carregando matrículas...</p> : rows.length === 0 ? <div className="p-10 text-center"><ClipboardList className="mx-auto h-9 w-9 text-slate-300" /><p className="mt-4 text-sm text-slate-500">{error ? "A lista não foi carregada." : "Nenhuma ficha nesta lista."}</p></div> : rows.map((row) => <button key={row.id} className={`block w-full border-b p-5 text-left last:border-0 hover:bg-slate-50 ${selected?.id === row.id ? "bg-blue-50" : ""}`} onClick={() => { setSelected(row); setError(""); setAmount(""); setApproval({ category: "", monthlyValue: 0, dueDay: row.payload?.dueDay || 10, scheduleConfigs: [] }) }}><p className="break-words font-semibold">{row.payload?.name || row.label}</p><p className="mt-1 text-xs text-slate-500">{row.payload?.responsible || "Aguardando preenchimento"}</p><p className="mt-3 text-xs text-slate-500">{row.submitted_at ? `Recebida em ${date(row.submitted_at)}` : `Criado em ${date(row.created_at)}`}</p>{row.status === "invited" && <p className="mt-1 text-xs text-amber-700">{new Date(row.expires_at).getTime() < Date.now() ? "Link expirado" : `Válido até ${date(row.expires_at)}`}</p>}</button>)}</div><div className="mt-3 flex items-center justify-between gap-3 text-xs text-slate-500"><Button size="sm" variant="outline" disabled={page === 0 || loading} onClick={() => setPage(page - 1)}>Anterior</Button><span>{total} fichas · página {page + 1}</span><Button size="sm" variant="outline" disabled={(page + 1) * 25 >= total || loading} onClick={() => setPage(page + 1)}>Próxima</Button></div></section>
    <section className="min-w-0 rounded-2xl border bg-white p-5 sm:p-7">{!selected ? <div className="py-12 text-center text-sm text-slate-500">Selecione uma ficha para conferir os dados.</div> : <><div className="flex flex-wrap justify-between gap-2"><h2 className="text-xl font-bold">{p ? "Conferir ficha" : selected.label}</h2><span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium">{statusNames[selected.status]}</span></div>{p ? <><dl className="mt-5 grid gap-4 sm:grid-cols-2">{[["Aluno", p.name], ["Nascimento", p.birthDate.split("-").reverse().join("/")], [p.documentType, p.document], ["Responsável", p.responsible], ["CPF do responsável", p.responsibleCpf], ["E-mail", p.email], ["Contato principal", p.phone], ["Emergência", `${p.emergencyName} (${p.emergencyRelationship}) · ${p.emergencyPhone}`], ["Vencimento solicitado", `Dia ${p.dueDay}`]].map(([label, value]) => <div key={label} className="min-w-0"><dt className="text-xs text-slate-500">{label}</dt><dd className="mt-1 break-words text-sm font-medium">{value}</dd></div>)}</dl><div className="mt-5 rounded-xl bg-slate-50 p-4"><p className="text-xs font-semibold text-slate-500">Cuidados nos treinos • acesso administrativo</p><p className="mt-2 whitespace-pre-wrap break-words text-sm">{p.healthNotes || "Não informado."}</p></div></> : <p className="mt-4 text-sm text-slate-600">O link aguarda o preenchimento. Se não tiver mais o link, encerre este convite e gere um novo.</p>}
    {selected.status === "pending" && <form onSubmit={approve} className="mt-7 border-t pt-6"><h3 className="font-bold">Definir a matrícula</h3><div className="mt-4 grid gap-4 sm:grid-cols-2"><label className="text-sm font-medium">Categoria<select required className={inputClass} value={approval.category} onChange={(e) => setApproval({ ...approval, category: e.target.value })}><option value="">Selecione</option>{Array.from({ length: 9 }, (_, i) => `Sub-${String(i + 8).padStart(2, "0")}`).map((c) => <option key={c}>{c}</option>)}</select></label><label className="text-sm font-medium">Mensalidade (R$)<input required type="number" min={0} max={10000} step={1} className={inputClass} value={amount} onChange={(e) => setAmount(e.target.value)} /><span className="text-xs font-normal text-slate-500">Use 0 para bolsista.</span></label><label className="text-sm font-medium">Vencimento confirmado<select className={inputClass} value={approval.dueDay} onChange={(e) => setApproval({ ...approval, dueDay: Number(e.target.value) })}>{Array.from({ length: 28 }, (_, i) => <option key={i + 1} value={i + 1}>Dia {i + 1}</option>)}</select></label></div><fieldset className="mt-5"><legend className="mb-3 text-sm font-semibold">Dias e horários de treino</legend><div className="space-y-3">{weekDays.map((day) => { const config = approval.scheduleConfigs.find((s) => s.day === day); return <div key={day} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3"><label className="flex items-center gap-2 text-sm"><input type="checkbox" className="h-4 w-4" checked={!!config} onChange={(e) => setApproval({ ...approval, scheduleConfigs: e.target.checked ? [...approval.scheduleConfigs, { day, schedule: schedules[0] }] : approval.scheduleConfigs.filter((s) => s.day !== day) })} />{day}</label>{config && <select aria-label={`Horário de ${day}`} className="rounded-md border p-2 text-sm" value={config.schedule} onChange={(e) => setApproval({ ...approval, scheduleConfigs: approval.scheduleConfigs.map((s) => s.day === day ? { ...s, schedule: e.target.value as typeof s.schedule } : s) })}>{schedules.map((s) => <option key={s} value={s}>{s.replace("-", " às ")}</option>)}</select>}</div> })}</div></fieldset><p className="mt-4 text-xs leading-relaxed text-slate-500">A aprovação cria o aluno e as mensalidades desde o mês atual até dezembro do próximo ano, com o vencimento acima. Confira os dados e as condições combinadas com a família antes de confirmar.</p><Button className="mt-5 w-full bg-[#071e46]" type="submit" disabled={busy}>{busy ? "Aprovando..." : "Confirmar matrícula e cadastrar aluno"}</Button></form>}
    {selected.status === "approved" && <div className="mt-6 rounded-xl bg-emerald-50 p-4"><h3 className="font-semibold text-emerald-900">Matrícula confirmada</h3>{selected.approval && <p className="mt-2 text-sm text-emerald-900">{selected.approval.category} · R$ {selected.approval.monthlyValue.toFixed(2)} por mês · vencimento dia {selected.approval.dueDay}</p>}<div className="mt-4 flex flex-wrap gap-2"><Button disabled={busy || !selected.student_id} className="gap-2 bg-[#071e46]" onClick={() => void pdf(selected)}><Download className="h-4 w-4" />Baixar confirmação em PDF</Button>{selected.student_id && <Button asChild variant="outline"><Link href={`/students/${selected.student_id}`}>Abrir aluno</Link></Button>}</div></div>}
    {["pending", "invited"].includes(selected.status) && <button disabled={busy} className="mt-6 text-sm text-red-700 underline disabled:opacity-50" onClick={() => void cancel(selected)}>Encerrar ficha sem cadastrar</button>}</>}</section></div>
    </main></div>
}
