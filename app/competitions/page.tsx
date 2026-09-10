"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { AppHeader } from "@/components/app-header"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/lib/contexts/auth-context"
import { useCompetitions, type Competition, type CompetitionPaymentType, type CompetitionType } from "@/lib/hooks/use-competitions"
import { useStudents } from "@/lib/hooks/use-students"
import type { Student } from "@/lib/types"
import { ArrowLeft, Banknote, CalendarDays, CheckCircle2, CircleDollarSign, Edit, Flag, MapPin, MessageCircle, Plus, Search, Trash2, Trophy, UserPlus, Users, WalletCards, XCircle } from "lucide-react"

const PIX_KEY = "43.602.144/0001-20"
const money = (value: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value)
const dateBR = (value: string) => {
  if (!value) return "—"
  const [year, month, day] = value.slice(0, 10).split("-")
  return `${day}/${month}/${year}`
}
const normalize = (value?: string) => (value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
const studentMatches = (student: Student, query: string) => {
  const q = normalize(query.trim())
  if (!q) return true
  return [student.name, student.responsible, student.rg].some((value) => normalize(value).includes(q))
}
const phoneDigits = (student: Student) => (student.motherPhone || student.fatherPhone || "").replace(/\D/g, "")

export default function CompetitionsPage() {
  const { user, isLoading: authLoading } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const { students, isLoading: studentsLoading } = useStudents({ includePayments: false, lightweightPhotos: true })
  const { competitions, participants, isLoading, createCompetition, updateCompetition, deleteCompetition, addParticipants, removeParticipant, setPaymentStatus } = useCompetitions()

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [addOpen, setAddOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [paymentOpen, setPaymentOpen] = useState(false)
  const [paymentParticipantId, setPaymentParticipantId] = useState<string | null>(null)
  const [paymentType, setPaymentType] = useState<CompetitionPaymentType>("pix")
  const [search, setSearch] = useState("")
  const [participantSearch, setParticipantSearch] = useState("")
  const [newSearch, setNewSearch] = useState("")
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set())
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ name: "", type: "Campeonato" as CompetitionType, eventDate: "", feeValue: "30", category: "", opponent: "", location: "", notes: "" })

  useEffect(() => {
    if (!authLoading && user?.role !== "admin") router.replace(user?.role === "coach" ? "/trainer/dashboard" : "/login")
  }, [authLoading, router, user])

  const activeStudents = useMemo(() => students.filter((student) => student.isActive && !student.archivedAt), [students])
  const selectedCompetition = competitions.find((item) => item.id === selectedId) || null
  const selectedParticipants = participants.filter((item) => item.competitionId === selectedId)
  const studentById = useMemo(() => new Map(students.map((student) => [student.id, student])), [students])
  const participantStudentIds = useMemo(() => new Set(selectedParticipants.map((item) => item.studentId)), [selectedParticipants])
  const availableStudents = activeStudents.filter((student) => !participantStudentIds.has(student.id) && studentMatches(student, newSearch))
  const createStudents = activeStudents.filter((student) => studentMatches(student, newSearch))
  const filteredParticipants = selectedParticipants.filter((participant) => {
    const student = studentById.get(participant.studentId)
    return student ? studentMatches(student, participantSearch) : false
  })
  const filteredCompetitions = competitions.filter((competition) => normalize(competition.name).includes(normalize(search)) || normalize(competition.opponent).includes(normalize(search)) || normalize(competition.category).includes(normalize(search)))

  const resetForm = () => {
    setForm({ name: "", type: "Campeonato", eventDate: "", feeValue: "30", category: "", opponent: "", location: "", notes: "" })
    setSelectedStudents(new Set())
    setNewSearch("")
  }

  const openEdit = (competition: Competition) => {
    setForm({ name: competition.name, type: competition.type, eventDate: competition.eventDate, feeValue: String(competition.feeValue), category: competition.category || "", opponent: competition.opponent || "", location: competition.location || "", notes: competition.notes || "" })
    setEditOpen(true)
  }

  const submitCreate = async () => {
    if (!form.name.trim() || !form.eventDate || Number(form.feeValue) < 0) {
      toast({ title: "Preencha os campos obrigatórios", description: "Informe nome, data e uma taxa válida.", variant: "destructive" })
      return
    }
    setSaving(true)
    try {
      const created = await createCompetition({ ...form, feeValue: Number(form.feeValue), studentIds: Array.from(selectedStudents) })
      setCreateOpen(false)
      resetForm()
      setSelectedId(created.id)
      toast({ title: "Competição criada", description: `${created.name} foi criada com ${selectedStudents.size} participante(s).` })
    } catch (error) {
      console.error(error)
      toast({ title: "Não foi possível criar", description: "Confira os dados e tente novamente.", variant: "destructive" })
    } finally { setSaving(false) }
  }

  const submitEdit = async () => {
    if (!selectedCompetition || !form.name.trim() || !form.eventDate) return
    setSaving(true)
    try {
      await updateCompetition(selectedCompetition.id, { ...form, feeValue: Number(form.feeValue) })
      setEditOpen(false)
      toast({ title: "Competição atualizada" })
    } catch (error) {
      console.error(error)
      toast({ title: "Erro ao atualizar", variant: "destructive" })
    } finally { setSaving(false) }
  }

  const submitAddParticipants = async () => {
    if (!selectedCompetition || selectedStudents.size === 0) return
    setSaving(true)
    try {
      await addParticipants(selectedCompetition.id, Array.from(selectedStudents))
      toast({ title: "Participantes adicionados", description: `${selectedStudents.size} aluno(s) incluído(s).` })
      setSelectedStudents(new Set())
      setAddOpen(false)
    } catch (error) {
      console.error(error)
      toast({ title: "Erro ao adicionar participantes", variant: "destructive" })
    } finally { setSaving(false) }
  }

  const toggleStudent = (id: string) => setSelectedStudents((current) => {
    const next = new Set(current)
    next.has(id) ? next.delete(id) : next.add(id)
    return next
  })

  const openWhatsApp = async (participantId: string) => {
    const participant = participants.find((item) => item.id === participantId)
    if (!participant || !selectedCompetition) return
    const student = studentById.get(participant.studentId)
    if (!student) return
    const message = `Olá, ${student.responsible || "responsável"}! Tudo bem?\n\nVerificamos que ainda não identificamos o pagamento da taxa de participação do(a) aluno(a) ${student.name} em ${selectedCompetition.type === "Campeonato" ? "no campeonato" : "no amistoso"} *${selectedCompetition.name}*, no valor de *${money(selectedCompetition.feeValue)}*.\n\nPara realizar o pagamento via PIX:\nChave CNPJ: ${PIX_KEY}\n\nCaso o pagamento já tenha sido efetuado, por gentileza, nos envie o comprovante para darmos baixa no sistema.\n\nAtenciosamente,\nAdministração 10 na Bola`
    try { await setPaymentStatus(participantId, "Cobrado") } catch (error) { console.error(error) }
    const phone = phoneDigits(student)
    window.open(`https://wa.me/${phone ? (phone.startsWith("55") ? phone : `55${phone}`) : ""}?text=${encodeURIComponent(message)}`, "_blank", "noopener,noreferrer")
  }

  if (authLoading || isLoading || studentsLoading || user?.role !== "admin") {
    return <div className="min-h-screen flex items-center justify-center"><div className="text-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" /><p className="text-muted-foreground">Carregando competições...</p></div></div>
  }

  if (selectedCompetition) {
    const paid = selectedParticipants.filter((item) => item.paymentStatus === "Pago").length
    const charged = selectedParticipants.filter((item) => item.paymentStatus === "Cobrado").length
    const pending = selectedParticipants.length - paid
    const expected = selectedParticipants.length * selectedCompetition.feeValue
    const received = paid * selectedCompetition.feeValue
    return (
      <div className="min-h-screen bg-background"><AppHeader /><main className="container mx-auto px-3 sm:px-4 lg:px-8 py-5 sm:py-8">
        <Button variant="ghost" className="mb-4 gap-2" onClick={() => { setSelectedId(null); setParticipantSearch("") }}><ArrowLeft className="h-4 w-4" />Voltar para competições</Button>
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-6">
          <div><div className="flex flex-wrap items-center gap-2 mb-2"><Badge variant="outline">{selectedCompetition.type}</Badge><Badge className={selectedCompetition.status === "Aberto" ? "bg-emerald-600" : "bg-slate-600"}>{selectedCompetition.status}</Badge></div><h1 className="text-2xl sm:text-4xl font-bold">{selectedCompetition.name}</h1><div className="mt-2 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground"><span className="flex items-center gap-1"><CalendarDays className="h-4 w-4" />{dateBR(selectedCompetition.eventDate)}</span>{selectedCompetition.category && <span className="flex items-center gap-1"><Flag className="h-4 w-4" />{selectedCompetition.category}</span>}{selectedCompetition.location && <span className="flex items-center gap-1"><MapPin className="h-4 w-4" />{selectedCompetition.location}</span>}</div></div>
          <div className="flex flex-wrap gap-2"><Button variant="outline" onClick={() => openEdit(selectedCompetition)}><Edit className="h-4 w-4 mr-2" />Editar</Button><Button onClick={() => { setSelectedStudents(new Set()); setNewSearch(""); setAddOpen(true) }}><UserPlus className="h-4 w-4 mr-2" />Adicionar participante</Button></div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Participantes</p><p className="text-2xl font-bold">{selectedParticipants.length}</p></CardContent></Card>
          <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Pagos</p><p className="text-2xl font-bold text-emerald-600">{paid}</p></CardContent></Card>
          <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Pendentes</p><p className="text-2xl font-bold text-amber-600">{pending}</p><p className="text-xs text-muted-foreground">{charged} já cobrados</p></CardContent></Card>
          <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Recebido / previsto</p><p className="text-lg font-bold">{money(received)}</p><p className="text-xs text-muted-foreground">de {money(expected)}</p></CardContent></Card>
        </div>

        <Card><CardHeader><CardTitle className="flex items-center gap-2"><Users className="h-5 w-5" />Participantes e pagamentos</CardTitle><CardDescription>Controle quem participa, quem já pagou e quem precisa ser cobrado.</CardDescription></CardHeader><CardContent>
          <div className="relative mb-4"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input className="pl-9" placeholder="Pesquisar por aluno, responsável ou RG..." value={participantSearch} onChange={(e) => setParticipantSearch(e.target.value)} /></div>
          {filteredParticipants.length === 0 ? <div className="py-12 text-center text-muted-foreground"><Users className="h-12 w-12 mx-auto mb-3 opacity-30" /><p>Nenhum participante encontrado.</p></div> : <div className="space-y-3">{filteredParticipants.map((participant) => {
            const student = studentById.get(participant.studentId); if (!student) return null
            return <div key={participant.id} className="rounded-xl border p-3 sm:p-4 flex flex-col xl:flex-row xl:items-center gap-3 justify-between">
              <div className="flex items-center gap-3 min-w-0"><Avatar className="h-11 w-11"><AvatarImage src={student.thumbnailUrl || student.photo} /><AvatarFallback>{student.name.charAt(0)}</AvatarFallback></Avatar><div className="min-w-0"><p className="font-semibold truncate">{student.name}</p><p className="text-xs sm:text-sm text-muted-foreground truncate">Responsável: {student.responsible || "Não informado"}{student.rg ? ` • RG: ${student.rg}` : ""}</p></div></div>
              <div className="flex flex-wrap items-center gap-2"><Badge variant={participant.paymentStatus === "Pago" ? "default" : "secondary"} className={participant.paymentStatus === "Pago" ? "bg-emerald-600" : participant.paymentStatus === "Cobrado" ? "bg-amber-100 text-amber-900 hover:bg-amber-100" : ""}>{participant.paymentStatus}</Badge><span className="font-semibold text-sm mr-1">{money(selectedCompetition.feeValue)}</span>{participant.paymentStatus !== "Pago" && <><Button size="sm" variant="outline" className="text-emerald-700" onClick={() => { setPaymentParticipantId(participant.id); setPaymentType("pix"); setPaymentOpen(true) }}><CheckCircle2 className="h-4 w-4 mr-1" />Dar baixa</Button><Button size="sm" variant="outline" onClick={() => void openWhatsApp(participant.id)}><MessageCircle className="h-4 w-4 mr-1" />WhatsApp</Button></>}{participant.paymentStatus === "Pago" && <Button size="sm" variant="outline" onClick={() => void setPaymentStatus(participant.id, "Não Pago")}><XCircle className="h-4 w-4 mr-1" />Desfazer baixa</Button>}<Button size="icon" variant="ghost" className="text-destructive" onClick={() => { if (confirm(`Remover ${student.name} desta competição?`)) void removeParticipant(participant.id) }}><Trash2 className="h-4 w-4" /></Button></div>
            </div>
          })}</div>}
        </CardContent></Card>

        <div className="mt-6 flex flex-wrap justify-between gap-3"><Button variant="outline" onClick={() => void updateCompetition(selectedCompetition.id, { status: selectedCompetition.status === "Aberto" ? "Encerrado" : "Aberto" })}>{selectedCompetition.status === "Aberto" ? "Encerrar competição" : "Reabrir competição"}</Button><Button variant="destructive" onClick={async () => { if (!confirm(`Excluir ${selectedCompetition.name}? Todos os participantes e baixas desta competição serão removidos.`)) return; await deleteCompetition(selectedCompetition.id); setSelectedId(null); toast({ title: "Competição excluída" }) }}><Trash2 className="h-4 w-4 mr-2" />Excluir competição</Button></div>
      </main>

      <Dialog open={paymentOpen} onOpenChange={setPaymentOpen}><DialogContent><DialogHeader><DialogTitle>Dar baixa na taxa</DialogTitle><DialogDescription>Selecione como o pagamento foi recebido.</DialogDescription></DialogHeader><Select value={paymentType} onValueChange={(value) => setPaymentType(value as CompetitionPaymentType)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="pix">PIX</SelectItem><SelectItem value="dinheiro">Dinheiro</SelectItem></SelectContent></Select><DialogFooter><Button variant="outline" onClick={() => setPaymentOpen(false)}>Cancelar</Button><Button onClick={async () => { if (!paymentParticipantId) return; await setPaymentStatus(paymentParticipantId, "Pago", paymentType); setPaymentOpen(false); toast({ title: "Pagamento confirmado", description: `Taxa registrada em ${paymentType === "pix" ? "PIX" : "dinheiro"}.` }) }}>Confirmar pagamento</Button></DialogFooter></DialogContent></Dialog>
      <CompetitionFormDialog open={editOpen} onOpenChange={setEditOpen} form={form} setForm={setForm} saving={saving} onSubmit={submitEdit} title="Editar competição" />
      <StudentPickerDialog open={addOpen} onOpenChange={setAddOpen} students={availableStudents} search={newSearch} setSearch={setNewSearch} selected={selectedStudents} toggle={toggleStudent} onSubmit={submitAddParticipants} saving={saving} title="Adicionar participantes" />
      </div>
    )
  }

  return <div className="min-h-screen bg-background"><AppHeader /><main className="container mx-auto px-3 sm:px-4 lg:px-8 py-5 sm:py-8">
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-7"><div><div className="flex items-center gap-3"><Trophy className="h-8 w-8 text-primary" /><h1 className="text-2xl sm:text-4xl font-bold">Competições</h1></div><p className="text-muted-foreground mt-1 sm:ml-11">Campeonatos, amistosos, participantes e taxas em um só lugar.</p></div><Button size="lg" onClick={() => { resetForm(); setCreateOpen(true) }}><Plus className="h-5 w-5 mr-2" />Nova competição</Button></div>
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6"><Card><CardContent className="p-4"><Trophy className="h-5 w-5 text-primary mb-2" /><p className="text-xs text-muted-foreground">Competições</p><p className="text-2xl font-bold">{competitions.length}</p></CardContent></Card><Card><CardContent className="p-4"><Users className="h-5 w-5 text-primary mb-2" /><p className="text-xs text-muted-foreground">Participações</p><p className="text-2xl font-bold">{participants.length}</p></CardContent></Card><Card><CardContent className="p-4"><CheckCircle2 className="h-5 w-5 text-emerald-600 mb-2" /><p className="text-xs text-muted-foreground">Taxas pagas</p><p className="text-2xl font-bold">{participants.filter((p) => p.paymentStatus === "Pago").length}</p></CardContent></Card><Card><CardContent className="p-4"><WalletCards className="h-5 w-5 text-amber-600 mb-2" /><p className="text-xs text-muted-foreground">Taxas pendentes</p><p className="text-2xl font-bold">{participants.filter((p) => p.paymentStatus !== "Pago").length}</p></CardContent></Card></div>
    <div className="relative mb-5"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input className="pl-9" placeholder="Pesquisar competição, adversário ou categoria..." value={search} onChange={(e) => setSearch(e.target.value)} /></div>
    {filteredCompetitions.length === 0 ? <Card><CardContent className="py-16 text-center"><Trophy className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-30" /><h2 className="text-xl font-semibold">Nenhuma competição cadastrada</h2><p className="text-muted-foreground mt-1 mb-5">Crie o primeiro campeonato ou amistoso e selecione os participantes.</p><Button onClick={() => { resetForm(); setCreateOpen(true) }}><Plus className="h-4 w-4 mr-2" />Criar competição</Button></CardContent></Card> : <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">{filteredCompetitions.map((competition) => {
      const rows = participants.filter((p) => p.competitionId === competition.id); const paid = rows.filter((p) => p.paymentStatus === "Pago").length; const received = paid * competition.feeValue; const expected = rows.length * competition.feeValue
      return <Card key={competition.id} className="cursor-pointer hover:border-primary/50 hover:shadow-md transition-all" onClick={() => setSelectedId(competition.id)}><CardHeader className="pb-3"><div className="flex items-start justify-between gap-3"><div><Badge variant="outline" className="mb-2">{competition.type}</Badge><CardTitle className="text-xl">{competition.name}</CardTitle></div><Badge className={competition.status === "Aberto" ? "bg-emerald-600" : "bg-slate-600"}>{competition.status}</Badge></div><CardDescription>{dateBR(competition.eventDate)}{competition.category ? ` • ${competition.category}` : ""}</CardDescription></CardHeader><CardContent><div className="grid grid-cols-3 gap-2 text-center mb-4"><div className="rounded-lg bg-muted p-2"><p className="text-lg font-bold">{rows.length}</p><p className="text-[11px] text-muted-foreground">Participantes</p></div><div className="rounded-lg bg-emerald-50 p-2"><p className="text-lg font-bold text-emerald-700">{paid}</p><p className="text-[11px] text-muted-foreground">Pagos</p></div><div className="rounded-lg bg-amber-50 p-2"><p className="text-lg font-bold text-amber-700">{rows.length - paid}</p><p className="text-[11px] text-muted-foreground">Pendentes</p></div></div><div className="flex items-center justify-between border-t pt-3"><div><p className="text-xs text-muted-foreground">Taxa por aluno</p><p className="font-bold">{money(competition.feeValue)}</p></div><div className="text-right"><p className="text-xs text-muted-foreground">Recebido</p><p className="font-bold">{money(received)} <span className="text-xs font-normal text-muted-foreground">/ {money(expected)}</span></p></div></div></CardContent></Card>
    })}</div>}
  </main>
  <Dialog open={createOpen} onOpenChange={(open) => { setCreateOpen(open); if (!open) resetForm() }}><DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto"><DialogHeader><DialogTitle>Nova competição</DialogTitle><DialogDescription>Cadastre os dados e selecione os alunos que vão participar.</DialogDescription></DialogHeader><CompetitionFields form={form} setForm={setForm} /><div className="border-t pt-5"><div className="flex items-center justify-between mb-3"><div><Label className="text-base">Participantes</Label><p className="text-xs text-muted-foreground">{selectedStudents.size} selecionado(s)</p></div>{createStudents.length > 0 && <Button type="button" variant="ghost" size="sm" onClick={() => setSelectedStudents(new Set(createStudents.map((s) => s.id)))}>Selecionar exibidos</Button>}</div><StudentPicker students={createStudents} search={newSearch} setSearch={setNewSearch} selected={selectedStudents} toggle={toggleStudent} /></div><DialogFooter><Button variant="outline" onClick={() => setCreateOpen(false)}>Cancelar</Button><Button disabled={saving} onClick={() => void submitCreate()}>{saving ? "Salvando..." : "Criar competição"}</Button></DialogFooter></DialogContent></Dialog>
  </div>
}

function CompetitionFields({ form, setForm }: { form: any; setForm: (value: any) => void }) {
  return <div className="grid sm:grid-cols-2 gap-4"><div className="sm:col-span-2"><Label>Nome *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ex.: Copa Santo Amaro Kids" /></div><div><Label>Tipo *</Label><Select value={form.type} onValueChange={(value) => setForm({ ...form, type: value })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Campeonato">Campeonato</SelectItem><SelectItem value="Amistoso">Amistoso</SelectItem></SelectContent></Select></div><div><Label>Data *</Label><Input type="date" value={form.eventDate} onChange={(e) => setForm({ ...form, eventDate: e.target.value })} /></div><div><Label>Taxa por aluno (R$) *</Label><Input type="number" min="0" step="1" value={form.feeValue} onChange={(e) => setForm({ ...form, feeValue: e.target.value })} /></div><div><Label>Categoria</Label><Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="Ex.: Sub-11" /></div><div><Label>Adversário</Label><Input value={form.opponent} onChange={(e) => setForm({ ...form, opponent: e.target.value })} placeholder="Opcional" /></div><div><Label>Local</Label><Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="Opcional" /></div><div className="sm:col-span-2"><Label>Observações</Label><Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Informações importantes sobre a competição" /></div></div>
}

function StudentPicker({ students, search, setSearch, selected, toggle }: { students: Student[]; search: string; setSearch: (v: string) => void; selected: Set<string>; toggle: (id: string) => void }) {
  return <><div className="relative mb-3"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input className="pl-9" placeholder="Nome do aluno, responsável ou RG..." value={search} onChange={(e) => setSearch(e.target.value)} /></div><div className="max-h-[310px] overflow-y-auto space-y-2 pr-1">{students.length === 0 ? <p className="py-8 text-center text-muted-foreground">Nenhum aluno encontrado.</p> : students.map((student) => <button type="button" key={student.id} onClick={() => toggle(student.id)} className={`w-full text-left flex items-center gap-3 rounded-xl border p-3 transition-colors ${selected.has(student.id) ? "border-primary bg-primary/5" : "hover:bg-muted/50"}`}><Checkbox checked={selected.has(student.id)} onCheckedChange={() => toggle(student.id)} onClick={(e) => e.stopPropagation()} /><Avatar className="h-10 w-10"><AvatarImage src={student.thumbnailUrl || student.photo} /><AvatarFallback>{student.name.charAt(0)}</AvatarFallback></Avatar><div className="min-w-0"><p className="font-medium truncate">{student.name}</p><p className="text-xs text-muted-foreground truncate">{student.responsible || "Responsável não informado"}{student.rg ? ` • RG ${student.rg}` : ""}</p></div></button>)}</div></>
}

function StudentPickerDialog({ open, onOpenChange, students, search, setSearch, selected, toggle, onSubmit, saving, title }: any) {
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="max-w-2xl"><DialogHeader><DialogTitle>{title}</DialogTitle><DialogDescription>Pesquise por nome, responsável ou RG e selecione os alunos.</DialogDescription></DialogHeader><StudentPicker students={students} search={search} setSearch={setSearch} selected={selected} toggle={toggle} /><DialogFooter><span className="text-sm text-muted-foreground mr-auto self-center">{selected.size} selecionado(s)</span><Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button><Button disabled={saving || selected.size === 0} onClick={() => void onSubmit()}>{saving ? "Salvando..." : "Adicionar"}</Button></DialogFooter></DialogContent></Dialog>
}

function CompetitionFormDialog({ open, onOpenChange, form, setForm, saving, onSubmit, title }: any) {
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="max-w-2xl"><DialogHeader><DialogTitle>{title}</DialogTitle><DialogDescription>Atualize os dados da competição.</DialogDescription></DialogHeader><CompetitionFields form={form} setForm={setForm} /><DialogFooter><Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button><Button disabled={saving} onClick={() => void onSubmit()}>{saving ? "Salvando..." : "Salvar alterações"}</Button></DialogFooter></DialogContent></Dialog>
}
