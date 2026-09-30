"use client"

import { useEffect, useMemo, useState } from "react"
import { getBrowserClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Package, Plus, Search, Shirt, TriangleAlert, UserRoundCheck, Trash2, ChevronDown, ChevronUp } from "lucide-react"

type KitType = "Jogador" | "Goleiro"
type Kit = { id:string; kit_type:KitType; model_name:string; size:string; shirt_number:number; quantity:number; minimum_stock:number }
type Delivery = { id:string; uniform_kit_id:string; student_id:string; quantity:number; delivered_at:string; students?: { name:string } | null }
type Student = { id:string; name:string }
type NumberRow = { number:string; quantity:string }

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
  const formTotal=rows.reduce((n,r)=>n+(Number(r.quantity)||0),0)
  const addRow=()=>setRows(r=>[...r,{number:"",quantity:"1"}])
  const changeRow=(i:number,field:keyof NumberRow,value:string)=>setRows(r=>r.map((x,j)=>j===i?{...x,[field]:value}:x))
  const removeRow=(i:number)=>setRows(r=>r.length===1?r:r.filter((_,j)=>j!==i))

  const addKit=async()=>{
    const min=Number(minimum)
    if(!size.trim()||!Number.isInteger(min)||min<0||rows.some(r=>!r.number.trim()||!Number.isInteger(Number(r.number))||Number(r.number)<0||!Number.isInteger(Number(r.quantity))||Number(r.quantity)<1)){toast({title:"Confira o cadastro",description:"Preencha tamanho, numerações e quantidades corretamente.",variant:"destructive"});return}
    const nums=rows.map(r=>Number(r.number));if(new Set(nums).size!==nums.length){toast({title:"Numeração repetida",description:"Cada número deve aparecer apenas uma vez.",variant:"destructive"});return}
    setSaving(true)
    for(const row of rows){const num=Number(row.number),q=Number(row.quantity),name=model.trim()||"Kit padrão";const existing=kits.find(k=>k.kit_type===type&&k.model_name.trim().toLowerCase()===name.toLowerCase()&&k.size.trim().toLowerCase()===size.trim().toLowerCase()&&k.shirt_number===num);const result=existing?await supabase.from("uniform_kits").update({quantity:existing.quantity+q,minimum_stock:min,updated_at:new Date().toISOString()}).eq("id",existing.id):await supabase.from("uniform_kits").insert({kit_type:type,model_name:name,size:size.trim(),shirt_number:num,quantity:q,minimum_stock:min});if(result.error){setSaving(false);toast({title:"Não foi possível salvar",description:result.error.message,variant:"destructive"});return}}
    setSaving(false);toast({title:"Estoque cadastrado",description:`${formTotal} kits ${type.toLowerCase()} tamanho ${size} adicionados.`});setSize("");setRows([{number:"",quantity:"1"}]);await load()
  }      <Card><CardHeader><CardTitle className="flex items-center gap-2"><Plus className="h-5 w-5"/>Cadastrar kits</CardTitle><CardDescription>Cadastre um tamanho e distribua os kits pelas numerações das camisas.</CardDescription></CardHeader><CardContent className="space-y-4"><div className="grid gap-4 sm:grid-cols-2"><div><Label>Tipo</Label><Select value={type} onValueChange={v=>setType(v as KitType)}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent>{TYPES.map(t=><SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select></div><div><Label>Tamanho</Label><Input value={size} onChange={e=>setSize(e.target.value)} placeholder="Ex.: P, M, G, 16"/></div><div><Label>Nome / modelo</Label><Input value={model} onChange={e=>setModel(e.target.value)} placeholder="Ex.: Kit padrão"/></div><div><Label>Estoque mínimo do tamanho</Label><Input type="number" min="0" value={minimum} onChange={e=>setMinimum(e.target.value)}/></div></div><div className="rounded-2xl border bg-muted/20 p-3"><div className="mb-3 flex items-center justify-between"><div><p className="font-semibold">Numeração das camisas</p><p className="text-xs text-muted-foreground">Informe quantos kits existem de cada número</p></div><span className="rounded-full bg-primary/10 px-3 py-1 text-sm font-bold text-primary">{formTotal} kits</span></div><div className="space-y-2">{rows.map((r,i)=><div key={i} className="grid grid-cols-[1fr_1fr_auto] gap-2"><Input type="number" min="0" value={r.number} onChange={e=>changeRow(i,"number",e.target.value)} placeholder="Nº camisa"/><Input type="number" min="1" value={r.quantity} onChange={e=>changeRow(i,"quantity",e.target.value)} placeholder="Qtd."/><Button type="button" variant="ghost" size="icon" onClick={()=>removeRow(i)} disabled={rows.length===1}><Trash2 className="h-4 w-4"/></Button></div>)}</div><Button type="button" variant="outline" className="mt-3 w-full" onClick={addRow}><Plus className="mr-2 h-4 w-4"/>Adicionar outra numeração</Button></div><Button className="w-full" onClick={addKit} disabled={saving}>{saving?"Salvando...":`Cadastrar ${formTotal} kit${formTotal===1?"":"s"}`}</Button></CardContent></Card>    <Card><CardHeader><CardTitle>Estoque por tamanho</CardTitle><CardDescription>Abra um tamanho para conferir quantos kits existem de cada número.</CardDescription></CardHeader><CardContent><div className="relative mb-4"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"/><Input className="pl-9" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar tipo, tamanho ou número..."/></div><div className="space-y-3">{filtered.length?filtered.map(g=>{const isOpen=!!expanded[g.id],low=g.available<g.minimum;return <div key={g.id} className="overflow-hidden rounded-2xl border"><button type="button" className="flex w-full items-center justify-between gap-3 p-4 text-left hover:bg-muted/40" onClick={()=>setExpanded(o=>({...o,[g.id]:!o[g.id]}))}><div><div className="flex flex-wrap items-center gap-2"><span className="font-bold">{g.type}</span><span className="rounded-full bg-muted px-2 py-0.5 text-xs">Tam. {g.size}</span>{g.model!=="Kit padrão"&&<span className="text-xs text-muted-foreground">{g.model}</span>}</div><p className="mt-1 text-xs text-muted-foreground">{[...g.items].sort((x,y)=>x.shirt_number-y.shirt_number).map(k=>`Nº ${k.shirt_number} ×${available(k)}`).join(" • ")}</p></div><div className="flex items-center gap-3"><div className="text-right"><p className="text-xl font-bold">{g.available}</p><p className="text-[11px] text-muted-foreground">kits disponíveis</p></div>{low&&<span className="rounded-full bg-amber-100 px-2 py-1 text-xs font-bold text-amber-800">Baixo</span>}{isOpen?<ChevronUp className="h-5 w-5"/>:<ChevronDown className="h-5 w-5"/>}</div></button>{isOpen&&<div className="border-t bg-muted/10 p-4"><div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{[...g.items].sort((x,y)=>x.shirt_number-y.shirt_number).map(k=><div key={k.id} className="flex items-center justify-between rounded-xl border bg-background p-3"><div><p className="text-xs text-muted-foreground">Camisa</p><p className="text-lg font-bold">Nº {k.shirt_number}</p></div><div className="text-right"><p className="text-lg font-bold">{available(k)}</p><p className="text-xs text-muted-foreground">disponíveis</p></div></div>)}</div><div className="mt-3 flex justify-between border-t pt-3 text-sm"><span>Estoque mínimo do tamanho</span><b>{g.minimum}</b></div></div>}</div>}):<p className="py-8 text-center text-sm text-muted-foreground">Nenhum kit encontrado.</p>}</div></CardContent></Card>
