"use client"

import type React from "react"

import { useStudents } from "@/lib/hooks/use-students"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { PaymentStatusBadge } from "@/components/payment-status-badge"
import { formatCurrency } from "@/lib/utils/currency"
import { ArrowLeft, DollarSign, Calendar, User, FileText, Trash2, Camera, Eye, Plus } from "lucide-react"
import Link from "next/link"
import { notFound } from "next/navigation"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import Image from "next/image"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import type { ClassSchedule, WeekDay, Student, DayScheduleConfig } from "@/lib/types"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { AppHeader } from "@/components/app-header"
import { formatRG, formatCPF, formatPhone } from "@/lib/formatters"
import { PhotoCropModal } from "@/components/photo-crop-modal"
import { formatPaymentPeriod, sortPaymentsByDueDate, filterPaymentsUpToCurrentMonth } from "@/lib/utils/payment"
import { formatDueDate } from "@/lib/utils/date"

export function StudentDetailClient({ id }: { id: string }) {
  const { getStudent, deleteStudent, updateStudent } = useStudents()
  const router = useRouter()
  const { toast } = useToast()
  const [student, setStudent] = useState<Student | null>(null)
  const [isLoadingStudent, setIsLoadingStudent] = useState(true)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showReceiptModal, setShowReceiptModal] = useState(false)
  const [selectedReceipt, setSelectedReceipt] = useState<string | File | undefined>()

  const [showCropModal, setShowCropModal] = useState(false)
  const [tempPhotoForCrop, setTempPhotoForCrop] = useState<string>("")

  const [editForm, setEditForm] = useState({
    name: "",
    rg: "",
    birthDate: "",
    responsible: "",
    responsibleCpf: "",
    responsibleEmail: "",
    fatherPhone: "",
    motherPhone: "",
    monthlyValue: "100",
    isScholarship: false,
  })

  const [scheduleConfigs, setScheduleConfigs] = useState<DayScheduleConfig[]>([
    { day: "Segunda", schedule: "18:00-19:30" },
  ])

  const [photoPreview, setPhotoPreview] = useState<string>("/placeholder.svg?height=200&width=200")

  const weekDays: WeekDay[] = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta"]

  useEffect(() => {
    const loadStudent = async () => {
      setIsLoadingStudent(true)
      const fetchedStudent = await getStudent(id)
      setStudent(fetchedStudent)
      setIsLoadingStudent(false)

      if (fetchedStudent) {
        setEditForm({
          name: fetchedStudent.name,
          rg: fetchedStudent.rg || "",
          birthDate: fetchedStudent.birthDate || "",
          responsible: fetchedStudent.responsible,
          responsibleCpf: fetchedStudent.responsibleCpf || "",
          responsibleEmail: fetchedStudent.responsibleEmail || "",
          fatherPhone: fetchedStudent.fatherPhone || "",
          motherPhone: fetchedStudent.motherPhone || "",
          monthlyValue: fetchedStudent.monthlyValue.toString(),
          isScholarship: fetchedStudent.isScholarship || false,
        })
        setPhotoPreview(fetchedStudent.photo || "/placeholder.svg?height=200&width=200")

        if (fetchedStudent.scheduleConfigs && fetchedStudent.scheduleConfigs.length > 0) {
          setScheduleConfigs(fetchedStudent.scheduleConfigs)
        } else if (fetchedStudent.classDays && fetchedStudent.classDays.length > 0) {
          const configs: DayScheduleConfig[] = fetchedStudent.classDays.map((day) => ({
            day,
            schedule: (fetchedStudent.classSchedule || "18:00-19:30") as ClassSchedule,
          }))
          setScheduleConfigs(configs)
        }
      }
    }
    loadStudent()
  }, [id, getStudent])

  const handleDelete = () => {
    deleteStudent(id)
    toast({
      title: "Aluno excluído",
      description: `${student.name} foi removido do sistema.`,
    })
    router.push("/students")
  }

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        const result = reader.result as string
        setTempPhotoForCrop(result)
        setShowCropModal(true)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleCropComplete = (croppedImage: string) => {
    setPhotoPreview(croppedImage)
    setShowCropModal(false)
    setTempPhotoForCrop("")
    toast({
      title: "Foto ajustada",
      description: "Sua foto foi cortada com sucesso.",
    })
  }

  const addScheduleConfig = () => {
    const usedDays = scheduleConfigs.map((c) => c.day)
    const availableDay = weekDays.find((d) => !usedDays.includes(d))

    if (!availableDay) {
      toast({
        title: "Erro",
        description: "Todos os dias já foram configurados.",
        variant: "destructive",
      })
      return
    }

    setScheduleConfigs([...scheduleConfigs, { day: availableDay, schedule: "18:00-19:30" }])
  }

  const removeScheduleConfig = (index: number) => {
    if (scheduleConfigs.length > 1) {
      setScheduleConfigs(scheduleConfigs.filter((_, i) => i !== index))
    }
  }

  const updateConfigDay = (index: number, day: WeekDay) => {
    const isDayUsed = scheduleConfigs.some((config, i) => i !== index && config.day === day)

    if (isDayUsed) {
      toast({
        title: "Dia já utilizado",
        description: `${day} já está configurado. Escolha outro dia.`,
        variant: "destructive",
      })
      return
    }

    const newConfigs = [...scheduleConfigs]
    newConfigs[index].day = day
    setScheduleConfigs(newConfigs)
  }

  const updateConfigSchedule = (index: number, schedule: ClassSchedule) => {
    const newConfigs = [...scheduleConfigs]
    newConfigs[index].schedule = schedule
    setScheduleConfigs(newConfigs)
  }

  const handleSaveEdit = () => {
    const allDays: WeekDay[] = [...new Set(scheduleConfigs.map((c) => c.day))]
    const primarySchedule = scheduleConfigs[0]?.schedule || "18:00-19:30"

    updateStudent(id, {
      name: editForm.name,
      rg: editForm.rg,
      birthDate: editForm.birthDate,
      responsible: editForm.responsible,
      responsibleCpf: editForm.responsibleCpf,
      responsibleEmail: editForm.responsibleEmail,
      fatherPhone: editForm.fatherPhone,
      motherPhone: editForm.motherPhone,
      monthlyValue: editForm.isScholarship ? 0 : Number.parseFloat(editForm.monthlyValue),
      isScholarship: editForm.isScholarship,
      classSchedule: primarySchedule,
      classDays: allDays,
      scheduleConfigs: scheduleConfigs,
      photo: photoPreview,
    })

    toast({
      title: "Informações atualizadas",
      description: "Os dados do aluno foram salvos com sucesso.",
    })

    setShowEditDialog(false)
  }

  const handleViewReceipt = (receipt?: string | File) => {
    if (receipt) {
      setSelectedReceipt(receipt)
      setShowReceiptModal(true)
    }
  }

  if (isLoadingStudent) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <AppHeader />
        <main className="flex-1 container mx-auto px-4 py-8 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Carregando dados do aluno...</p>
          </div>
        </main>
      </div>
    )
  }

  if (!student) {
    notFound()
  }

  const totalPaid = student.payments.reduce((sum, payment) => {
    if (payment.status === "Pago") return sum + payment.value
    return sum
  }, 0)

  const totalExpected = student.payments.reduce((sum, payment) => {
    if (payment.status !== "Bolsista" && payment.status !== "AFASTADO") {
      return sum + student.monthlyValue
    }
    return sum
  }, 0)

  const pendingPayments = student.payments.filter((p) => p.status === "Não Pagou" || p.status === "Cobrado").length

  const filteredPayments = filterPaymentsUpToCurrentMonth(student.payments)
  const sortedPayments = sortPaymentsByDueDate(filteredPayments, "asc")

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <AppHeader />

      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="mb-6">
          <Button asChild variant="ghost" className="mb-4">
            <Link href="/students">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar para Lista de Alunos
            </Link>
          </Button>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Informações do Aluno
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center text-center mb-6">
                <div className="relative h-32 w-32 rounded-full overflow-hidden bg-primary/10 mb-4 border-4 border-primary/20">
                  <Image
                    src={student.photo || "/placeholder.svg?height=200&width=200&query=student"}
                    alt={student.name}
                    fill
                    className="object-cover"
                  />
                </div>
                <h2 className="text-2xl font-bold text-foreground mb-1">{student.name}</h2>
                {student.isScholarship && (
                  <span className="text-xs px-3 py-1 rounded-full bg-accent text-accent-foreground mb-1">Bolsista</span>
                )}
                {!student.isActive && (
                  <span className="text-xs px-3 py-1 rounded-full bg-muted text-muted-foreground">Inativo</span>
                )}
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Responsável</p>
                  <p className="font-medium text-foreground">{student.responsible}</p>
                </div>

                {student.responsibleEmail && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Email</p>
                    <p className="font-medium text-foreground text-sm break-all">{student.responsibleEmail}</p>
                  </div>
                )}

                {student.fatherPhone && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Telefone do Pai</p>
                    <p className="font-medium text-foreground">{student.fatherPhone}</p>
                  </div>
                )}

                {student.motherPhone && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Telefone da Mãe</p>
                    <p className="font-medium text-foreground">{student.motherPhone}</p>
                  </div>
                )}

                <div>
                  <p className="text-sm text-muted-foreground mb-1">Mensalidade</p>
                  <p className="text-2xl font-bold text-foreground">
                    {student.isScholarship ? "Bolsista" : formatCurrency(student.monthlyValue)}
                  </p>
                </div>

                {student.rg && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">RG</p>
                    <p className="font-medium text-foreground">{student.rg}</p>
                  </div>
                )}

                {student.responsibleCpf && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">CPF do Responsável</p>
                    <p className="font-medium text-foreground">{student.responsibleCpf}</p>
                  </div>
                )}

                {student.birthDate && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Data de Nascimento</p>
                    <p className="font-medium text-foreground">{student.birthDate}</p>
                  </div>
                )}

                {student.scheduleConfigs && student.scheduleConfigs.length > 0 ? (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Dias e Horários de Aula</p>
                    <div className="space-y-2">
                      {student.scheduleConfigs.map((config: any, idx: number) => (
                        <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-primary/5 border">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-primary" />
                            <span className="font-medium text-foreground">{config.day}</span>
                          </div>
                          <span className="text-sm px-2 py-1 rounded bg-primary/10 text-primary font-medium">
                            {config.schedule}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <>
                    {student.classSchedule && (
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Horário da Turma</p>
                        <p className="font-medium text-foreground">{student.classSchedule}</p>
                      </div>
                    )}

                    {student.classDays && student.classDays.length > 0 && (
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Dias de Aula</p>
                        <div className="flex flex-wrap gap-1">
                          {student.classDays.map((day) => (
                            <span key={day} className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary">
                              {day}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>

              <div className="mt-6 pt-6 border-t space-y-2">
                <Button className="w-full bg-transparent" variant="outline" onClick={() => setShowEditDialog(true)}>
                  <FileText className="mr-2 h-4 w-4" />
                  Editar Informações
                </Button>
                <Button className="w-full" variant="destructive" onClick={() => setShowDeleteDialog(true)}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Excluir Aluno
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="lg:col-span-2 space-y-6">
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total Pago</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground">{formatCurrency(totalPaid)}</div>
                  <p className="text-xs text-muted-foreground mt-1">De {formatCurrency(totalExpected)} esperado</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Pagamentos Pendentes</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-destructive">{pendingPayments}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {pendingPayments > 0 ? "Requer atenção" : "Tudo em dia"}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Taxa de Pagamento</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground">
                    {totalExpected > 0 ? `${((totalPaid / totalExpected) * 100).toFixed(0)}%` : "N/A"}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Histórico completo</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Histórico de Pagamentos
                </CardTitle>
                <CardDescription>
                  Registro completo de todos os pagamentos mensais ordenados por data de vencimento
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-[500px] overflow-y-auto">
                  {sortedPayments.map((payment, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex items-center gap-4 flex-1">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <DollarSign className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-foreground">{formatPaymentPeriod(payment)}</p>
                          <p className="text-sm text-muted-foreground">
                            {payment.value > 0 ? formatCurrency(payment.value) : "Isento"}
                            {payment.dueDate && (
                              <span className="ml-2 text-xs text-muted-foreground">
                                • Venc: {formatDueDate(payment.dueDate)}
                              </span>
                            )}
                          </p>
                          {payment.status === "Pago" && payment.paidAt && (
                            <p className="text-xs text-accent font-medium mt-1">
                              Pago em {new Date(payment.paidAt).toLocaleDateString("pt-BR")}
                            </p>
                          )}
                          {payment.status === "Pago" && !payment.paidAt && (
                            <p className="text-xs text-accent font-medium mt-1">Pagamento Confirmado</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <PaymentStatusBadge status={payment.status} />
                        {payment.receipt && payment.status === "Pago" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleViewReceipt(payment.receipt)}
                            className="gap-1"
                          >
                            <Eye className="h-4 w-4" />
                            Ver Comprovante
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {showReceiptModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto border-2">
            <CardHeader>
              <CardTitle>Comprovante de Pagamento</CardTitle>
              <CardDescription>Visualização do comprovante anexado</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {typeof selectedReceipt === "string" ? (
                <img
                  src={selectedReceipt || "/placeholder.svg"}
                  alt="Receipt"
                  className="w-full rounded-lg border max-h-[500px] object-contain"
                />
              ) : (
                <div className="text-center p-8 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-3" />
                  <p>Arquivo: {selectedReceipt?.name}</p>
                </div>
              )}
            </CardContent>
            <div className="flex gap-3 justify-end p-6 border-t">
              <Button onClick={() => setShowReceiptModal(false)}>Fechar</Button>
            </div>
          </Card>
        </div>
      )}

      {showDeleteDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="text-destructive">Confirmar Exclusão</CardTitle>
              <CardDescription>
                Tem certeza que deseja excluir o aluno <strong>{student.name}</strong>? Esta ação não pode ser desfeita.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
                Cancelar
              </Button>
              <Button variant="destructive" onClick={handleDelete}>
                Excluir
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {showEditDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <Card className="w-full max-w-4xl my-8">
            <CardHeader>
              <CardTitle>Editar Informações do Aluno</CardTitle>
              <CardDescription>Atualize os dados do aluno e do responsável</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 max-h-[70vh] overflow-y-auto">
              {/* Foto do Aluno */}
              <div className="space-y-4 pb-6 border-b">
                <h3 className="font-semibold flex items-center gap-2">
                  <Camera className="h-4 w-4" />
                  Foto do Aluno
                </h3>
                <div className="flex flex-col items-center gap-4">
                  <div className="relative h-32 w-32 rounded-full overflow-hidden bg-muted border-4 border-primary/20">
                    <Image src={photoPreview || "/placeholder.svg"} alt="Preview" fill className="object-cover" />
                  </div>
                  <Button type="button" variant="outline" size="sm" asChild className="bg-transparent">
                    <label htmlFor="edit-photo-upload" className="cursor-pointer">
                      <Camera className="mr-2 h-4 w-4" />
                      Alterar Foto
                      <input
                        id="edit-photo-upload"
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoChange}
                        className="hidden"
                      />
                    </label>
                  </Button>
                  <p className="text-xs text-muted-foreground text-center">
                    Formatos aceitos: JPG, PNG, GIF (máx. 5MB)
                  </p>
                </div>
              </div>

              {/* Dados do Aluno */}
              <div className="space-y-4 pb-6 border-b">
                <h3 className="font-semibold flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Dados do Aluno
                </h3>
                <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="edit-name">Nome Completo *</Label>
                    <Input
                      id="edit-name"
                      value={editForm.name}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      placeholder="Nome completo do aluno"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-rg">RG</Label>
                    <Input
                      id="edit-rg"
                      value={editForm.rg}
                      onChange={(e) => setEditForm({ ...editForm, rg: formatRG(e.target.value) })}
                      placeholder="12.345.678-9"
                      maxLength={14}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-birthDate">Data de Nascimento</Label>
                  <Input
                    id="edit-birthDate"
                    type="date"
                    value={editForm.birthDate}
                    onChange={(e) => setEditForm({ ...editForm, birthDate: e.target.value })}
                  />
                </div>
              </div>

              {/* Dados do Responsável */}
              <div className="space-y-4 pb-6 border-b">
                <h3 className="font-semibold">Dados do Responsável</h3>
                <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="edit-responsible">Nome Completo *</Label>
                    <Input
                      id="edit-responsible"
                      value={editForm.responsible}
                      onChange={(e) => setEditForm({ ...editForm, responsible: e.target.value })}
                      placeholder="Nome do responsável"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-responsibleCpf">CPF *</Label>
                    <Input
                      id="edit-responsibleCpf"
                      value={editForm.responsibleCpf}
                      onChange={(e) => setEditForm({ ...editForm, responsibleCpf: formatCPF(e.target.value) })}
                      placeholder="123.456.789-00"
                      maxLength={14}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-responsibleEmail">E-mail</Label>
                  <Input
                    id="edit-responsibleEmail"
                    type="email"
                    value={editForm.responsibleEmail}
                    onChange={(e) => setEditForm({ ...editForm, responsibleEmail: e.target.value })}
                    placeholder="email@exemplo.com"
                  />
                </div>
                <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="edit-fatherPhone">Telefone do Pai</Label>
                    <Input
                      id="edit-fatherPhone"
                      value={editForm.fatherPhone}
                      onChange={(e) => setEditForm({ ...editForm, fatherPhone: formatPhone(e.target.value) })}
                      placeholder="(11) 98765-4321"
                      maxLength={15}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-motherPhone">Telefone da Mãe</Label>
                    <Input
                      id="edit-motherPhone"
                      value={editForm.motherPhone}
                      onChange={(e) => setEditForm({ ...editForm, motherPhone: formatPhone(e.target.value) })}
                      placeholder="(11) 98765-4321"
                      maxLength={15}
                    />
                  </div>
                </div>
              </div>

              {/* Informações da Turma */}
              <div className="space-y-4">
                <h3 className="font-semibold">Informações da Turma</h3>

                <div className="flex items-center space-x-3 p-4 rounded-lg border-2 border-dashed bg-accent/5">
                  <Checkbox
                    id="edit-isScholarship"
                    checked={editForm.isScholarship}
                    onCheckedChange={(checked) => setEditForm({ ...editForm, isScholarship: checked as boolean })}
                  />
                  <div className="flex-1">
                    <Label htmlFor="edit-isScholarship" className="cursor-pointer text-sm font-medium">
                      Aluno Bolsista
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Marque se o aluno possui bolsa de estudos (mensalidade será R$ 0,00)
                    </p>
                  </div>
                </div>

                {!editForm.isScholarship && (
                  <div className="space-y-2">
                    <Label htmlFor="edit-monthlyValue">Valor da Mensalidade (R$)</Label>
                    <Input
                      id="edit-monthlyValue"
                      type="number"
                      step="0.01"
                      value={editForm.monthlyValue}
                      onChange={(e) => setEditForm({ ...editForm, monthlyValue: e.target.value })}
                      placeholder="100.00"
                      className="max-w-xs"
                    />
                  </div>
                )}

                <div className="space-y-3">
                  <Label className="text-sm font-medium">Dias e Horários de Aula</Label>

                  {scheduleConfigs.map((config, index) => (
                    <div key={index} className="flex flex-col sm:flex-row gap-3 p-4 rounded-lg border bg-card">
                      <div className="flex items-center gap-2 mb-2 sm:mb-0">
                        <span className="text-xs font-semibold text-muted-foreground whitespace-nowrap">
                          {index === 0 ? "Primeiro Dia" : `${index + 1}º Dia`}
                        </span>
                      </div>

                      <div className="flex-1 grid grid-cols-2 gap-3">
                        <Select value={config.day} onValueChange={(value) => updateConfigDay(index, value as WeekDay)}>
                          <SelectTrigger className="h-10 text-sm">
                            <SelectValue placeholder="Dia" />
                          </SelectTrigger>
                          <SelectContent>
                            {weekDays.map((day) => (
                              <SelectItem key={day} value={day} className="text-sm">
                                {day}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        <Select
                          value={config.schedule}
                          onValueChange={(value) => updateConfigSchedule(index, value as ClassSchedule)}
                        >
                          <SelectTrigger className="h-10 text-sm">
                            <SelectValue placeholder="Horário" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="18:00-19:30" className="text-sm">
                              18:00 - 19:30
                            </SelectItem>
                            <SelectItem value="19:30-21:00" className="text-sm">
                              19:30 - 21:00
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {scheduleConfigs.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeScheduleConfig(index)}
                          className="h-10 w-10 p-0 text-destructive hover:text-destructive shrink-0"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}

                  {scheduleConfigs.length < 5 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addScheduleConfig}
                      className="w-full sm:w-auto bg-transparent"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Adicionar Outro Dia
                    </Button>
                  )}

                  <p className="text-xs text-muted-foreground">
                    Cada dia pode ter apenas um horário. Ex: Terça às 18:00-19:30 e Quinta às 19:30-21:00.
                  </p>
                </div>
              </div>
            </CardContent>
            <div className="flex gap-3 justify-end p-6 border-t">
              <Button variant="outline" onClick={() => setShowEditDialog(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSaveEdit}>Salvar Alterações</Button>
            </div>
          </Card>
        </div>
      )}

      <PhotoCropModal
        isOpen={showCropModal}
        imageSrc={tempPhotoForCrop}
        onCropComplete={handleCropComplete}
        onCancel={() => {
          setShowCropModal(false)
          setTempPhotoForCrop("")
        }}
      />
    </div>
  )
}
