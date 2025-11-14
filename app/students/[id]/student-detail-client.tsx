"use client"

import type React from "react"

import { useStudents } from "@/lib/hooks/use-students"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { PaymentStatusBadge } from "@/components/payment-status-badge"
import { formatCurrency } from "@/lib/utils/currency"
import { ArrowLeft, DollarSign, Calendar, User, FileText, Trash2, Camera, Eye } from "lucide-react"
import Link from "next/link"
import { notFound } from "next/navigation"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import Image from "next/image"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import type { ClassSchedule, WeekDay, Student } from "@/lib/types"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { AppHeader } from "@/components/app-header"
import { AppFooter } from "@/components/app-footer"

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
    classSchedule: "18:00-19:30" as ClassSchedule,
    classDays: [] as WeekDay[],
    photo: "",
  })

  const [photoPreview, setPhotoPreview] = useState<string>("/placeholder.svg?height=200&width=200")

  const weekDays: WeekDay[] = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta"]

  useEffect(() => {
    const loadStudent = async () => {
      setIsLoadingStudent(true)
      console.log("[v0] StudentDetailClient - Looking for student with ID:", id)
      const fetchedStudent = await getStudent(id)
      console.log("[v0] StudentDetailClient - Student found:", fetchedStudent ? fetchedStudent.name : "NOT FOUND")
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
          classSchedule: (fetchedStudent.classSchedule || "18:00-19:30") as ClassSchedule,
          classDays: (fetchedStudent.classDays || []) as WeekDay[],
          photo: fetchedStudent.photo || "",
        })
        setPhotoPreview(fetchedStudent.photo || "/placeholder.svg?height=200&width=200")
      }
    }
    loadStudent()
  }, [id, getStudent])

  if (isLoadingStudent) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <AppHeader />
        <main className="container mx-auto px-4 py-8 flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Carregando dados do aluno...</p>
          </div>
        </main>
        <AppFooter />
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
        setPhotoPreview(result)
        setEditForm({ ...editForm, photo: result })
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSaveEdit = () => {
    updateStudent(id, {
      name: editForm.name,
      rg: editForm.rg,
      birthDate: editForm.birthDate,
      responsible: editForm.responsible,
      responsibleCpf: editForm.responsibleCpf,
      responsibleEmail: editForm.responsibleEmail,
      fatherPhone: editForm.fatherPhone,
      motherPhone: editForm.motherPhone,
      monthlyValue: Number.parseFloat(editForm.monthlyValue),
      classSchedule: editForm.classSchedule,
      classDays: editForm.classDays,
      photo: editForm.photo,
    })

    toast({
      title: "Informações atualizadas",
      description: "Os dados do aluno foram salvos com sucesso.",
    })

    setShowEditDialog(false)
  }

  const toggleClassDay = (day: WeekDay) => {
    setEditForm((prev) => ({
      ...prev,
      classDays: prev.classDays.includes(day) ? prev.classDays.filter((d) => d !== day) : [...prev.classDays, day],
    }))
  }

  const handleViewReceipt = (receipt?: string | File) => {
    if (receipt) {
      setSelectedReceipt(receipt)
      setShowReceiptModal(true)
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <AppHeader />

      <main className="container mx-auto px-4 py-8 flex-1">
        <div className="mb-8">
          <Button asChild variant="ghost" className="mb-4">
            <Link href="/students">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar para Lista de Alunos
            </Link>
          </Button>
        </div>

        <div className="grid gap-6 lg:grid-cols-3 mb-8">
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
                    <p className="font-medium text-foreground text-sm">{student.responsibleEmail}</p>
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
                  <p className="text-2xl font-bold text-foreground">{formatCurrency(student.monthlyValue)}</p>
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
                <CardDescription>Registro completo de todos os pagamentos mensais</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-[500px] overflow-y-auto">
                  {student.payments.map((payment, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex items-center gap-4 flex-1">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <DollarSign className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-foreground">{payment.month}</p>
                          <p className="text-sm text-muted-foreground">
                            {payment.value > 0 ? formatCurrency(payment.value) : "Isento"}
                          </p>
                          {payment.status === "Pago" && (
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

      <AppFooter />

      {showEditDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <Card className="w-full max-w-3xl my-8">
            <CardHeader>
              <CardTitle>Editar Informações do Aluno</CardTitle>
              <CardDescription>Atualize os dados do aluno e do responsável</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 max-h-[70vh] overflow-y-auto">
              <div className="flex flex-col items-center gap-4 pb-6 border-b">
                <div className="relative h-32 w-32 rounded-full overflow-hidden bg-muted border-4 border-primary/20">
                  <Image src={photoPreview || "/placeholder.svg"} alt="Preview" fill className="object-cover" />
                </div>
                <Button type="button" variant="outline" size="sm" asChild>
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
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold">Dados do Aluno</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="edit-name">Nome Completo</Label>
                    <Input
                      id="edit-name"
                      value={editForm.name}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-rg">RG</Label>
                    <Input
                      id="edit-rg"
                      value={editForm.rg}
                      onChange={(e) => setEditForm({ ...editForm, rg: e.target.value })}
                    />
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
                  <div className="space-y-2">
                    <Label htmlFor="edit-monthlyValue">Mensalidade (R$)</Label>
                    <Input
                      id="edit-monthlyValue"
                      type="number"
                      step="0.01"
                      value={editForm.monthlyValue}
                      onChange={(e) => setEditForm({ ...editForm, monthlyValue: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold">Dados do Responsável</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="edit-responsible">Nome Completo</Label>
                    <Input
                      id="edit-responsible"
                      value={editForm.responsible}
                      onChange={(e) => setEditForm({ ...editForm, responsible: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-responsibleCpf">CPF</Label>
                    <Input
                      id="edit-responsibleCpf"
                      value={editForm.responsibleCpf}
                      onChange={(e) => setEditForm({ ...editForm, responsibleCpf: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-responsibleEmail">Email</Label>
                    <Input
                      id="edit-responsibleEmail"
                      type="email"
                      value={editForm.responsibleEmail}
                      onChange={(e) => setEditForm({ ...editForm, responsibleEmail: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-fatherPhone">Telefone do Pai</Label>
                    <Input
                      id="edit-fatherPhone"
                      value={editForm.fatherPhone}
                      onChange={(e) => setEditForm({ ...editForm, fatherPhone: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-motherPhone">Telefone da Mãe</Label>
                    <Input
                      id="edit-motherPhone"
                      value={editForm.motherPhone}
                      onChange={(e) => setEditForm({ ...editForm, motherPhone: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold">Informações da Turma</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="edit-classSchedule">Horário</Label>
                    <Select
                      value={editForm.classSchedule}
                      onValueChange={(value) => setEditForm({ ...editForm, classSchedule: value as ClassSchedule })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="18:00-19:30">Primeiro Horário (18:00 - 19:30)</SelectItem>
                        <SelectItem value="19:30-21:00">Segundo Horário (19:30 - 21:00)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Dias da Semana</Label>
                  <div className="flex flex-wrap gap-4">
                    {weekDays.map((day) => (
                      <div key={day} className="flex items-center space-x-2">
                        <Checkbox
                          id={`edit-${day}`}
                          checked={editForm.classDays.includes(day)}
                          onCheckedChange={() => toggleClassDay(day)}
                        />
                        <Label htmlFor={`edit-${day}`} className="cursor-pointer">
                          {day}
                        </Label>
                      </div>
                    ))}
                  </div>
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

      {showDeleteDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Confirmar Exclusão</CardTitle>
              <CardDescription>
                Tem certeza que deseja excluir {student.name}? Esta ação não pode ser desfeita e todos os dados serão
                perdidos permanentemente.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
                Cancelar
              </Button>
              <Button variant="destructive" onClick={handleDelete}>
                Excluir Permanentemente
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {showReceiptModal && selectedReceipt && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto border-2">
            <CardHeader>
              <CardTitle>Comprovante de Pagamento</CardTitle>
              <CardDescription>Visualização do comprovante anexado</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {typeof selectedReceipt === "string" ? (
                selectedReceipt.startsWith("data:") ? (
                  <img
                    src={selectedReceipt || "/placeholder.svg"}
                    alt="Receipt"
                    className="w-full rounded-lg border max-h-[500px] object-contain"
                  />
                ) : (
                  <img
                    src={selectedReceipt || "/placeholder.svg"}
                    alt="Receipt"
                    className="w-full rounded-lg border max-h-[500px] object-contain"
                  />
                )
              ) : (
                <div className="text-center p-8 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-3" />
                  <p>Arquivo: {selectedReceipt.name}</p>
                </div>
              )}
            </CardContent>
            <div className="flex gap-3 justify-end p-6 border-t">
              <Button onClick={() => setShowReceiptModal(false)}>Fechar</Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
