"use client"

import { useEffect, useMemo, useState } from "react"
import { getBrowserClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ChevronDown, ChevronUp, Hash, Package, Plus, Search, Shirt, Trash2, TriangleAlert, UserRoundCheck } from "lucide-react"

type KitType = "Jogador" | "Goleiro"
type Kit = { id: string; kit_type: KitType; model_name: string; size: string; shirt_number: number; quantity: number; minimum_stock: number }
type Delivery = { id: string; uniform_kit_id: string; student_id: string; quantity: number; delivered_at: string; students?: { name: string } | null }
type Student = { id: string; name: string }
type NumberRow = { number: string; quantity: string }
const TYPES: KitType[] = ["Jogador", "Goleiro"]

export function UniformInventory() {
  const supabase = useMemo(() => getBrowserClient(), [])
  const { toast } = useToast()
  const [kits, setKits] = useState<Kit[]>([])
  const [deliveries, setDeliveries] = useState<Delivery[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState("")
  const [type, setType] = useState<KitType>("Jogador")
  const [model, setModel] = useState("Kit padrão")
  const [size, setSize] = useState("")
  const [minimum, setMinimum] = useState("1")
  const [rows, setRows] = useState<NumberRow[]>([{ number: "", quantity: "1" }])
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const [deliveryKit, setDeliveryKit] = useState("")
  const [student, setStudent] = useState("")
  const [studentSearch, setStudentSearch] = useState("")

  const load = async () => {
    setLoading(true)
    const [k, d, s] = await Promise.all([
      supabase.from("uniform_kits").select("*").order("kit_type").order("size").order("shirt_number"),
      supabase.from("uniform_deliveries").select("id,uniform_kit_id,student_id,quantity,delivered_at,students(name)").order("created_at", { ascending: false }),
      supabase.from("students").select("id,name").eq("is_active", true).order("name"),
    ])
    if (k.error || d.error || s.error) toast({ title: "Erro ao carregar uniformes", description: k.error?.message || d.error?.message || s.error?.message, variant: "destructive" })
    else { setKits(k.data as Kit[]); setDeliveries(d.data as unknown as Delivery[]); setStudents(s.data as Student[]) }
    setLoading(false)
  }

  useEffect(() => { void load() }, [])

  const deliveredByKit = useMemo(() => deliveries.reduce((map, d) => {
    map[d.uniform_kit_id] = (map[d.uniform_kit_id] || 0) + d.quantity
    return map
  }, {} as Record<string, number>), [deliveries])

  const available = (kit: Kit) => Math.max(0, kit.quantity - (deliveredByKit[kit.id] || 0))
  const groupKey = (kit: Kit) => `${kit.kit_type}||${kit.model_name}||${kit.size}`
  const groups = useMemo(() => {
    const map = new Map<string, Kit[]>()
    kits.forEach((kit) => {
      const id = groupKey(kit)
      map.set(id, [...(map.get(id) || []), kit])
    })
    return [...map.entries()].map(([id, items]) => ({
      id,
      items,
      type: items[0].kit_type,
      model: items[0].model_name,
      size: items[0].size,
      minimum: Math.max(...items.map((kit) => kit.minimum_stock)),
      available: items.reduce((sum, kit) => sum + available(kit), 0),
    }))
  }, [kits, deliveredByKit])

  const total = kits.reduce((sum, kit) => sum + kit.quantity, 0)
  const delivered = deliveries.reduce((sum, item) => sum + item.quantity, 0)
  const availableTotal = Math.max(0, total - delivered)
  const belowMinimum = groups.filter((group) => group.minimum > 0 && group.available < group.minimum).length
  const byType = (value: KitType) => groups.filter((group) => group.type === value).reduce((sum, group) => sum + group.available, 0)
  const filtered = groups.filter((group) => `${group.type} ${group.model} ${group.size} ${group.items.map((kit) => kit.shirt_number).join(" ")}`.toLowerCase().includes(search.toLowerCase()))
  const filteredStudents = students.filter((item) => item.name.toLowerCase().includes(studentSearch.toLowerCase())).slice(0, 12)
  const formTotal = rows.reduce((sum, row) => sum + (Number(row.quantity) || 0), 0)

  const addRow = () => setRows((current) => [...current, { number: "", quantity: "1" }])
  const changeRow = (index: number, field: keyof NumberRow, value: string) => setRows((current) => current.map((row, i) => i === index ? { ...row, [field]: value } : row))
  const removeRow = (index: number) => setRows((current) => current.length === 1 ? current : current.filter((_, i) => i !== index))

  const addKit = async () => {
    const min = Number(minimum)
    if (!size.trim() || !Number.isInteger(min) || min < 0 || rows.some((row) => !row.number.trim() || !Number.isInteger(Number(row.number)) || Number(row.number) < 0 || !Number.isInteger(Number(row.quantity)) || Number(row.quantity) < 1)) {
      toast({ title: "Confira o cadastro", description: "Preencha tamanho, numerações e quantidades corretamente.", variant: "destructive" })
      return
    }
    const numbers = rows.map((row) => Number(row.number))
    if (new Set(numbers).size !== numbers.length) {
      toast({ title: "Numeração repetida", description: "Cada número deve aparecer apenas uma vez.", variant: "destructive" })
      return
    }
    setSaving(true)
    const name = model.trim() || "Kit padrão"
    for (const row of rows) {
      const number = Number(row.number)
      const quantity = Number(row.quantity)
      const existing = kits.find((kit) => kit.kit_type === type && kit.model_name.trim().toLowerCase() === name.toLowerCase() && kit.size.trim().toLowerCase() === size.trim().toLowerCase() && kit.shirt_number === number)
      const result = existing
        ? await supabase.from("uniform_kits").update({ quantity: existing.quantity + quantity, minimum_stock: min, updated_at: new Date().toISOString() }).eq("id", existing.id)
        : await supabase.from("uniform_kits").insert({ kit_type: type, model_name: name, size: size.trim(), shirt_number: number, quantity, minimum_stock: min })
      if (result.error) {
        setSaving(false)
        toast({ title: "Não foi possível salvar", description: result.error.message, variant: "destructive" })
        return
      }
    }
    setSaving(false)
    toast({ title: "Estoque cadastrado", description: `${formTotal} kits ${type.toLowerCase()} tamanho ${size} adicionados.` })
    setSize("")
    setRows([{ number: "", quantity: "1" }])
    await load()
  }

  const deliver = async () => {
    const kit = kits.find((item) => item.id === deliveryKit)
    const selectedStudent = students.find((item) => item.id === student)
    if (!kit || !selectedStudent) return
    if (available(kit) < 1) {
      toast({ title: "Essa numeração está sem estoque", variant: "destructive" })
      return
    }
    setSaving(true)
    const { error } = await supabase.from("uniform_deliveries").insert({ uniform_kit_id: kit.id, student_id: selectedStudent.id, quantity: 1 })
    setSaving(false)
    if (error) {
      toast({ title: "Não foi possível registrar a entrega", description: error.message, variant: "destructive" })
      return
    }
    toast({ title: "Entrega registrada", description: `${selectedStudent.name} recebeu ${kit.kit_type}, tam. ${kit.size}, nº ${kit.shirt_number}.` })
    setDeliveryKit("")
    setStudent("")
    setStudentSearch("")
    await load()
  }

  if (loading) return <div className="flex min-h-[45vh] items-center justify-center"><div className="text-center"><div className="mx-auto mb-3 h-10 w-10 animate-spin rounded-full border-4 border-primary/20 border-t-primary" /><p className="text-sm text-muted-foreground">Carregando estoque...</p></div></div>

  return <div className="mx-auto w-full max-w-7xl space-y-6 pb-10">
    <header><p className="text-sm font-semibold text-primary">Controle de estoque</p><h1 className="text-2xl font-bold sm:text-3xl">Uniformes</h1><p className="mt-1 text-sm text-muted-foreground">Controle os kits por categoria, tamanho e numeração da camisa.</p></header>

    <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <Card><CardContent className="p-4"><Package className="mb-2 h-5 w-5 text-primary" /><p className="text-xs text-muted-foreground">Disponíveis</p><p className="text-2xl font-bold">{availableTotal}</p></CardContent></Card>
      <Card><CardContent className="p-4"><UserRoundCheck className="mb-2 h-5 w-5 text-primary" /><p className="text-xs text-muted-foreground">Entregues</p><p className="text-2xl font-bold">{delivered}</p></CardContent></Card>
      <Card><CardContent className="p-4"><Shirt className="mb-2 h-5 w-5 text-primary" /><p className="text-xs text-muted-foreground">Total cadastrado</p><p className="text-2xl font-bold">{total}</p></CardContent></Card>
      <Card className={belowMinimum > 0 ? "border-amber-400/60" : ""}><CardContent className="p-4"><TriangleAlert className="mb-2 h-5 w-5 text-amber-600" /><p className="text-xs text-muted-foreground">Abaixo do mínimo</p><p className="text-2xl font-bold">{belowMinimum}</p></CardContent></Card>
    </section>

    <section className="grid gap-3 sm:grid-cols-2">
      {TYPES.map((item) => <Card key={item}><CardContent className="flex items-center justify-between p-4"><div><p className="text-sm font-semibold">{item}</p><p className="text-xs text-muted-foreground">kits disponíveis</p></div><span className="text-2xl font-bold">{byType(item)}</span></CardContent></Card>)}
    </section>

    <div className="grid gap-6 xl:grid-cols-[1.15fr_.85fr]">
      <Card>
        <CardHeader className="border-b bg-muted/20"><CardTitle className="flex items-center gap-2 text-lg"><Plus className="h-5 w-5" />Entrada de uniformes</CardTitle><CardDescription>Cadastre o modelo, o tamanho e informe quantas camisas existem de cada número.</CardDescription></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div><Label>Tipo</Label><Select value={type} onValueChange={(value) => setType(value as KitType)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{TYPES.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select></div>
            <div><Label>Tamanho</Label><Input value={size} onChange={(event) => setSize(event.target.value)} placeholder="Ex.: P, M, G, 16" /></div>
            <div><Label>Nome / modelo</Label><Input value={model} onChange={(event) => setModel(event.target.value)} placeholder="Ex.: Kit padrão" /></div>
            <div><Label>Estoque mínimo do tamanho</Label><Input type="number" min="0" value={minimum} onChange={(event) => setMinimum(event.target.value)} /></div>
          </div>
          <div className="rounded-2xl border-2 border-dashed bg-muted/20 p-4">
            <div className="mb-4 flex items-center justify-between gap-3"><div><p className="flex items-center gap-2 font-semibold"><Hash className="h-4 w-4 text-primary" />Numeração das camisas</p><p className="mt-1 text-xs text-muted-foreground">Cada linha representa um número de camisa e sua quantidade</p></div><span className="shrink-0 rounded-xl bg-primary px-3 py-2 text-sm font-bold text-primary-foreground">Total: {formTotal}</span></div>
            <div className="space-y-2">
              {rows.map((row, index) => <div key={index} className="grid grid-cols-[1fr_1fr_auto] gap-2"><Input type="number" min="0" value={row.number} onChange={(event) => changeRow(index, "number", event.target.value)} placeholder="Nº camisa" /><Input type="number" min="1" value={row.quantity} onChange={(event) => changeRow(index, "quantity", event.target.value)} placeholder="Qtd." /><Button type="button" variant="ghost" size="icon" onClick={() => removeRow(index)} disabled={rows.length === 1}><Trash2 className="h-4 w-4" /></Button></div>)}
            </div>
            <Button type="button" variant="outline" className="mt-3 w-full" onClick={addRow}><Plus className="mr-2 h-4 w-4" />Adicionar outra numeração</Button>
          </div>
          <Button className="w-full" onClick={addKit} disabled={saving}>{saving ? "Salvando..." : `Cadastrar ${formTotal} kit${formTotal === 1 ? "" : "s"}`}</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="border-b bg-muted/20"><CardTitle className="flex items-center gap-2 text-lg"><UserRoundCheck className="h-5 w-5" />Entregar uniforme</CardTitle><CardDescription>Registre qual kit, tamanho e número foi entregue ao aluno.</CardDescription></CardHeader>
        <CardContent className="space-y-4">
          <div><Label>Kit e numeração</Label><Select value={deliveryKit} onValueChange={setDeliveryKit}><SelectTrigger><SelectValue placeholder="Selecione o kit" /></SelectTrigger><SelectContent>{kits.filter((kit) => available(kit) > 0).map((kit) => <SelectItem key={kit.id} value={kit.id}>{kit.kit_type} • Tam. {kit.size} • Nº {kit.shirt_number} ({available(kit)} disp.)</SelectItem>)}</SelectContent></Select></div>
          <div><Label>Buscar aluno</Label><Input value={studentSearch} onChange={(event) => { setStudentSearch(event.target.value); setStudent("") }} placeholder="Digite o nome do aluno" /></div>
          {studentSearch && <div className="max-h-44 overflow-auto rounded-xl border">{filteredStudents.map((item) => <button key={item.id} type="button" onClick={() => { setStudent(item.id); setStudentSearch(item.name) }} className={`block w-full border-b px-3 py-2 text-left text-sm last:border-0 hover:bg-muted ${student === item.id ? "bg-primary/10 font-semibold" : ""}`}>{item.name}</button>)}</div>}
          <Button className="w-full" onClick={deliver} disabled={saving || !deliveryKit || !student}>{saving ? "Registrando..." : "Registrar entrega"}</Button>
        </CardContent>
      </Card>
    </div>

    <Card className="overflow-hidden">
      <CardHeader className="border-b bg-muted/20"><div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between"><div><CardTitle className="text-xl">Estoque atual</CardTitle><CardDescription className="mt-1">Organizado por categoria e tamanho. Clique para ver as numerações.</CardDescription></div><div className="text-sm text-muted-foreground"><b className="text-foreground">{availableTotal}</b> kits disponíveis</div></div></CardHeader>
      <CardContent className="p-4 sm:p-6"><div className="relative mb-5"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input className="h-11 pl-9" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar categoria, tamanho ou número..." /></div>
        <div className="grid gap-4">{filtered.length ? filtered.map((group) => { const isOpen=!!expanded[group.id]; const low=group.minimum>0&&group.available<group.minimum; const sorted=[...group.items].sort((a,b)=>a.shirt_number-b.shirt_number); return <div key={group.id} className={`overflow-hidden rounded-2xl border-2 ${low?"border-amber-300":"border-border"}`}>
          <button type="button" className="grid w-full gap-4 p-4 text-left hover:bg-muted/30 sm:grid-cols-[1fr_auto] sm:items-center sm:p-5" onClick={()=>setExpanded(current=>({...current,[group.id]:!current[group.id]}))}><div className="min-w-0"><div className="mb-3 flex flex-wrap items-center gap-2"><span className={`rounded-lg px-3 py-1 text-xs font-bold uppercase ${group.type==="Goleiro"?"bg-amber-100 text-amber-800":"bg-primary/10 text-primary"}`}>{group.type}</span><span className="rounded-lg border bg-background px-3 py-1 text-xs font-bold">TAMANHO {group.size}</span>{group.model!=="Kit padrão"&&<span className="text-sm text-muted-foreground">{group.model}</span>}{low&&<span className="rounded-lg bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800">ESTOQUE BAIXO</span>}</div><div className="flex flex-wrap gap-2">{sorted.map(kit=><span key={kit.id} className="rounded-lg bg-muted px-3 py-2 text-sm"><b>Nº {kit.shirt_number}</b><span className="mx-2 text-muted-foreground">•</span>{available(kit)} {available(kit)===1?"kit":"kits"}</span>)}</div></div><div className="flex items-center justify-between gap-4 sm:justify-end"><div className="min-w-24 rounded-xl bg-primary/5 px-4 py-3 text-center"><p className="text-3xl font-black leading-none text-primary">{group.available}</p><p className="mt-1 text-[10px] font-bold text-muted-foreground">DISPONÍVEIS</p></div>{isOpen?<ChevronUp className="h-5 w-5"/>:<ChevronDown className="h-5 w-5"/>}</div></button>
          {isOpen&&<div className="border-t bg-muted/20 p-4 sm:p-5"><div className="mb-4 flex flex-wrap items-center justify-between gap-2"><p className="font-semibold">Detalhamento das camisas</p><span className="rounded-lg border bg-background px-3 py-1.5 text-sm">Estoque mínimo: <b>{group.minimum}</b></span></div><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{sorted.map(kit=>{const qty=available(kit);return <div key={kit.id} className="rounded-xl border bg-background p-4 shadow-sm"><div className="flex items-start justify-between"><div><p className="text-xs font-semibold uppercase text-muted-foreground">Camisa</p><p className="mt-1 text-2xl font-black">Nº {kit.shirt_number}</p></div><Shirt className="h-5 w-5 text-primary"/></div><div className="mt-4 border-t pt-3"><p className="text-xs text-muted-foreground">Em estoque</p><p className="text-lg font-bold">{qty} {qty===1?"kit":"kits"}</p></div></div>})}</div></div>}
        </div>}) : <div className="rounded-2xl border border-dashed py-12 text-center"><Shirt className="mx-auto mb-3 h-8 w-8 text-muted-foreground"/><p className="font-medium">Nenhum uniforme encontrado</p><p className="mt-1 text-sm text-muted-foreground">Tente outra busca ou cadastre novos kits.</p></div>}</div>
      </CardContent>
    </Card>

    {deliveries.length > 0 && <Card><CardHeader><CardTitle>Entregas recentes</CardTitle></CardHeader><CardContent className="space-y-2">{deliveries.slice(0, 10).map((item) => { const kit = kits.find((value) => value.id === item.uniform_kit_id); return <div key={item.id} className="flex items-center justify-between gap-3 rounded-xl border p-3"><div><p className="text-sm font-semibold">{item.students?.name || "Aluno"}</p><p className="text-xs text-muted-foreground">{kit ? `${kit.kit_type} • Tam. ${kit.size} • Nº ${kit.shirt_number}` : "Kit"}</p></div><span className="text-xs text-muted-foreground">{new Date(item.delivered_at + "T12:00:00").toLocaleDateString("pt-BR")}</span></div> })}</CardContent></Card>}
  </div>
}
