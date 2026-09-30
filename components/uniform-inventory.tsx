"use client"

import { useEffect, useMemo, useState } from "react"
import { getBrowserClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Package, Plus, Search, Shirt, TriangleAlert, UserRoundCheck } from "lucide-react"

type KitType = "Jogador" | "Goleiro"
type Kit = { id:string; kit_type:KitType; model_name:string; size:string; shirt_number:number; quantity:number; minimum_stock:number }
type Delivery = { id:string; uniform_kit_id:string; student_id:string; quantity:number; delivered_at:string; students?: { name:string } | null }
type Student = { id:string; name:string }

const TYPES: KitType[] = ["Jogador","Goleiro"]

export function UniformInventory() {
  const supabase = useMemo(() => getBrowserClient(), [])
  const { toast } = useToast()
  const [kits,setKits]=useState<Kit[]>([])
  const [deliveries,setDeliveries]=useState<Delivery[]>([])
  const [students,setStudents]=useState<Student[]>([])
  const [loading,setLoading]=useState(true)
  const [saving,setSaving]=useState(false)
  const [search,setSearch]=useState("")
  const [type,setType]=useState<KitType>("Jogador")
  const [model,setModel]=useState("Kit padrão")
  const [size,setSize]=useState("")
  const [number,setNumber]=useState("")
  const [quantity,setQuantity]=useState("1")
  const [minimum,setMinimum]=useState("1")
  const [deliveryKit,setDeliveryKit]=useState("")
  const [student,setStudent]=useState("")
  const [studentSearch,setStudentSearch]=useState("")

  const load=async()=>{
    setLoading(true)
    const [k,d,s]=await Promise.all([
      supabase.from("uniform_kits").select("*").order("kit_type").order("size").order("shirt_number"),
      supabase.from("uniform_deliveries").select("id,uniform_kit_id,student_id,quantity,delivered_at,students(name)").order("created_at",{ascending:false}),
      supabase.from("students").select("id,name").eq("is_active",true).order("name")
    ])
    if(k.error||d.error||s.error) toast({title:"Erro ao carregar uniformes",description:k.error?.message||d.error?.message||s.error?.message,variant:"destructive"})
    else { setKits(k.data as Kit[]); setDeliveries(d.data as unknown as Delivery[]); setStudents(s.data as Student[]) }
    setLoading(false)
  }
  useEffect(()=>{void load()},[])

  const deliveredByKit=useMemo(()=>deliveries.reduce((m,d)=>{m[d.uniform_kit_id]=(m[d.uniform_kit_id]||0)+d.quantity;return m},{} as Record<string,number>),[deliveries])
  const available=(k:Kit)=>Math.max(0,k.quantity-(deliveredByKit[k.id]||0))
  const total=kits.reduce((n,k)=>n+k.quantity,0)
  const delivered=deliveries.reduce((n,d)=>n+d.quantity,0)
  const availableTotal=Math.max(0,total-delivered)
  const toOrder=kits.reduce((n,k)=>n+Math.max(0,k.minimum_stock-available(k)),0)
  const byType=(t:KitType)=>kits.filter(k=>k.kit_type===t).reduce((n,k)=>n+available(k),0)
  const filtered=kits.filter(k=>`${k.kit_type} ${k.model_name} ${k.size} ${k.shirt_number}`.toLowerCase().includes(search.toLowerCase()))
  const filteredStudents=students.filter(s=>s.name.toLowerCase().includes(studentSearch.toLowerCase())).slice(0,12)

  const addKit=async()=>{
    const q=Number(quantity), min=Number(minimum), num=Number(number)
    if(!size.trim()||!number.trim()||!Number.isInteger(q)||q<1||!Number.isInteger(min)||min<0||!Number.isInteger(num)||num<0){
      toast({title:"Confira o cadastro",description:"Preencha tamanho, número, quantidade e estoque mínimo corretamente.",variant:"destructive"});return
    }
    setSaving(true)
    const existing=kits.find(k=>k.kit_type===type&&k.model_name.trim().toLowerCase()===model.trim().toLowerCase()&&k.size.trim().toLowerCase()===size.trim().toLowerCase()&&k.shirt_number===num)
    const result=existing
      ? await supabase.from("uniform_kits").update({quantity:existing.quantity+q,minimum_stock:min,updated_at:new Date().toISOString()}).eq("id",existing.id)
      : await supabase.from("uniform_kits").insert({kit_type:type,model_name:model.trim()||"Kit padrão",size:size.trim(),shirt_number:num,quantity:q,minimum_stock:min})
    setSaving(false)
    if(result.error){toast({title:"Não foi possível salvar",description:result.error.message,variant:"destructive"});return}
    toast({title:existing?"Estoque atualizado":"Kit cadastrado",description:`${q} kit(s) adicionados ao estoque.`})
    setSize("");setNumber("");setQuantity("1");await load()
  }

  const deliver=async()=>{
    const kit=kits.find(k=>k.id===deliveryKit)
    const aluno=students.find(s=>s.id===student)
    if(!kit||!aluno){toast({title:"Selecione kit e aluno",variant:"destructive"});return}
    if(available(kit)<1){toast({title:"Kit sem estoque disponível",variant:"destructive"});return}
    setSaving(true)
    const {error}=await supabase.from("uniform_deliveries").insert({uniform_kit_id:kit.id,student_id:aluno.id,quantity:1})
    setSaving(false)
    if(error){toast({title:"Não foi possível registrar a entrega",description:error.message,variant:"destructive"});return}
    toast({title:"Entrega registrada",description:`${aluno.name} recebeu o kit ${kit.kit_type}, tam. ${kit.size}, nº ${kit.shirt_number}.`})
    setDeliveryKit("");setStudent("");setStudentSearch("");await load()
  }

  if(loading)return <div className="flex min-h-[45vh] items-center justify-center"><div className="text-center"><div className="mx-auto mb-3 h-10 w-10 animate-spin rounded-full border-4 border-primary/20 border-t-primary"/><p className="text-sm text-muted-foreground">Carregando estoque...</p></div></div>

  return <div className="mx-auto w-full max-w-7xl space-y-6 pb-10">
    <header><p className="text-sm font-semibold text-primary">Controle de estoque</p><h1 className="text-2xl font-bold sm:text-3xl">Uniformes</h1><p className="mt-1 text-sm text-muted-foreground">Controle os kits de camiseta + short por tipo, tamanho e número da camisa.</p></header>

    <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <Card><CardContent className="p-4"><Package className="mb-2 h-5 w-5 text-primary"/><p className="text-xs text-muted-foreground">Disponíveis</p><p className="text-2xl font-bold">{availableTotal}</p></CardContent></Card>
      <Card><CardContent className="p-4"><UserRoundCheck className="mb-2 h-5 w-5 text-primary"/><p className="text-xs text-muted-foreground">Entregues</p><p className="text-2xl font-bold">{delivered}</p></CardContent></Card>
      <Card><CardContent className="p-4"><Shirt className="mb-2 h-5 w-5 text-primary"/><p className="text-xs text-muted-foreground">Total cadastrado</p><p className="text-2xl font-bold">{total}</p></CardContent></Card>
      <Card className={toOrder>0?"border-amber-400/60":""}><CardContent className="p-4"><TriangleAlert className="mb-2 h-5 w-5 text-amber-600"/><p className="text-xs text-muted-foreground">Precisam pedir</p><p className="text-2xl font-bold">{toOrder}</p></CardContent></Card>
    </section>

    <section className="grid gap-3 sm:grid-cols-2">{TYPES.map(t=><Card key={t}><CardContent className="flex items-center justify-between p-4"><div><p className="text-sm font-semibold">{t}</p><p className="text-xs text-muted-foreground">kits disponíveis</p></div><span className="text-2xl font-bold">{byType(t)}</span></CardContent></Card>)}</section>

    <div className="grid gap-6 lg:grid-cols-2">
      <Card><CardHeader><CardTitle className="flex items-center gap-2"><Plus className="h-5 w-5"/>Cadastrar / adicionar kits</CardTitle><CardDescription>O kit representa sempre camiseta + short.</CardDescription></CardHeader><CardContent className="grid gap-4 sm:grid-cols-2">
        <div><Label>Tipo</Label><Select value={type} onValueChange={v=>setType(v as KitType)}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent>{TYPES.map(t=><SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select></div>
        <div><Label>Nome / modelo</Label><Input value={model} onChange={e=>setModel(e.target.value)} placeholder="Ex.: Kit jogador azul"/></div>
        <div><Label>Tamanho</Label><Input value={size} onChange={e=>setSize(e.target.value)} placeholder="Ex.: 16, P, M, G"/></div>
        <div><Label>Número da camisa</Label><Input type="number" min="0" value={number} onChange={e=>setNumber(e.target.value)} placeholder="Ex.: 10"/></div>
        <div><Label>Quantidade para adicionar</Label><Input type="number" min="1" value={quantity} onChange={e=>setQuantity(e.target.value)}/></div>
        <div><Label>Estoque mínimo</Label><Input type="number" min="0" value={minimum} onChange={e=>setMinimum(e.target.value)}/></div>
        <Button className="sm:col-span-2" onClick={addKit} disabled={saving}>{saving?"Salvando...":"Adicionar ao estoque"}</Button>
      </CardContent></Card>

      <Card><CardHeader><CardTitle className="flex items-center gap-2"><UserRoundCheck className="h-5 w-5"/>Saída / entrega</CardTitle><CardDescription>Registre um kit entregue a um aluno.</CardDescription></CardHeader><CardContent className="space-y-4">
        <div><Label>Kit</Label><Select value={deliveryKit} onValueChange={setDeliveryKit}><SelectTrigger><SelectValue placeholder="Selecione um kit disponível"/></SelectTrigger><SelectContent>{kits.filter(k=>available(k)>0).map(k=><SelectItem key={k.id} value={k.id}>{k.kit_type} • {k.model_name} • Tam. {k.size} • Nº {k.shirt_number} ({available(k)} disp.)</SelectItem>)}</SelectContent></Select></div>
        <div><Label>Buscar aluno</Label><Input value={studentSearch} onChange={e=>{setStudentSearch(e.target.value);setStudent("")}} placeholder="Digite o nome do aluno"/></div>
        {studentSearch&&<div className="max-h-44 overflow-auto rounded-xl border">{filteredStudents.map(s=><button key={s.id} type="button" onClick={()=>{setStudent(s.id);setStudentSearch(s.name)}} className={`block w-full border-b px-3 py-2 text-left text-sm last:border-0 hover:bg-muted ${student===s.id?"bg-primary/10 font-semibold":""}`}>{s.name}</button>)}</div>}
        <Button className="w-full" onClick={deliver} disabled={saving||!deliveryKit||!student}>{saving?"Registrando...":"Registrar entrega"}</Button>
      </CardContent></Card>
    </div>

    <Card><CardHeader><CardTitle>Estoque detalhado</CardTitle><CardDescription>Tamanho, numeração, disponibilidade e necessidade de reposição.</CardDescription></CardHeader><CardContent>
      <div className="relative mb-4"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"/><Input className="pl-9" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar tipo, modelo, tamanho ou número..."/></div>
      <div className="space-y-2">{filtered.length?filtered.map(k=>{const a=available(k),need=Math.max(0,k.minimum_stock-a);return <div key={k.id} className="grid grid-cols-[1fr_auto] gap-3 rounded-2xl border p-3 sm:grid-cols-[1.4fr_.7fr_.7fr_.7fr_.8fr] sm:items-center">
        <div><p className="font-semibold">{k.kit_type} • {k.model_name}</p><p className="text-xs text-muted-foreground sm:hidden">Tam. {k.size} • Nº {k.shirt_number}</p></div>
        <div className="hidden text-sm sm:block">Tam. <b>{k.size}</b></div><div className="hidden text-sm sm:block">Nº <b>{k.shirt_number}</b></div>
        <div className="text-right sm:text-left"><p className="text-sm font-bold">{a} disp.</p><p className="text-xs text-muted-foreground">mín. {k.minimum_stock}</p></div>
        <div className="col-span-2 sm:col-span-1">{need>0?<span className="inline-flex rounded-full bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-800">Pedir {need}</span>:<span className="inline-flex rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-800">Estoque OK</span>}</div>
      </div>}):<p className="py-8 text-center text-sm text-muted-foreground">Nenhum kit encontrado.</p>}</div>
    </CardContent></Card>

    {deliveries.length>0&&<Card><CardHeader><CardTitle>Entregas recentes</CardTitle></CardHeader><CardContent className="space-y-2">{deliveries.slice(0,10).map(d=>{const k=kits.find(x=>x.id===d.uniform_kit_id);return <div key={d.id} className="flex items-center justify-between gap-3 rounded-xl border p-3"><div><p className="text-sm font-semibold">{d.students?.name||"Aluno"}</p><p className="text-xs text-muted-foreground">{k?`${k.kit_type} • Tam. ${k.size} • Nº ${k.shirt_number}`:"Kit"}</p></div><span className="text-xs text-muted-foreground">{new Date(d.delivered_at+"T12:00:00").toLocaleDateString("pt-BR")}</span></div>})}</CardContent></Card>}
  </div>
}
