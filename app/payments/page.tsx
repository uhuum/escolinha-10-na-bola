"use client"

import { useState, useEffect } from "react"
import { useStudents } from "@/lib/hooks/use-students"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { PaymentStatusBadge } from "@/components/payment-status-badge"
import { formatCurrency } from "@/lib/utils/currency"
import {
  DollarSign,
  Check,
  AlertCircle,
  CalendarIcon,
  Upload,
  FileText,
  Eye,
  Edit,
  Trash2,
  BarChart3,
  Flag,
  Lock,
  Users,
  Phone,
  X,
} from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { AppHeader } from "@/components/app-header"
import Image from "next/image"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { getAllMonths, getCurrentDay, getCurrentMonthName, getCurrentMonthIndex } from "@/lib/utils/date"
import { Badge } from "@/components/ui/badge"

export default function PaymentsPage() {
  const {
    students,
    updatePaymentStatus,
    postponePayment,
    attachReceipt,
    updateMonthlyValue,
    deleteReceipt,
    getMonthlyReport,
  } = useStudents()
  const { toast } = useToast()
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonthName())
  const [showPendingModal, setShowPendingModal] = useState(false)

  const months = getAllMonths()
  const currentMonthIndex = getCurrentMonthIndex()

  const activeStudents = students.filter((s) => s.isActive)

  const studentsWithPayments = activeStudents
    .map((student) => {
      const payment = student.payments.find((p) => p.month === selectedMonth)
      return { student, payment, shouldShow: true }
    })
    .filter((item) => item.shouldShow)

  useEffect(() => {
    const currentDay = getCurrentDay()

    studentsWithPayments.forEach(({ student, payment }) => {
      if (student.monthlyValue === 0 || student.isScholarship) return

      if (payment && payment.status !== "Pago" && payment.status !== "Adiado") {
        if (currentDay >= 1 && currentDay <= 10) {
          if (payment.status !== "Em Aberto" && payment.status !== "Cobrado") {
            updatePaymentStatus(student.id, selectedMonth, "Em Aberto")
          }
        } else if (currentDay >= 11) {
          if (payment.status === "Em Aberto") {
            updatePaymentStatus(student.id, selectedMonth, "Não Pagou")
          }
        }
      }
    })
  }, [selectedMonth, studentsWithPayments, updatePaymentStatus])

  const paidCount = studentsWithPayments.filter((s) => s.payment?.status === "Pago").length
  const pendingStudents = studentsWithPayments.filter(
    (s) =>
      !s.student.isScholarship &&
      s.student.monthlyValue > 0 &&
      (s.payment?.status === "Não Pagou" || s.payment?.status === "Cobrado" || s.payment?.status === "Em Aberto"),
  )
  const pendingCount = pendingStudents.length
  const scholarshipCount = studentsWithPayments.filter(
    (s) => s.student.isScholarship || s.student.monthlyValue === 0,
  ).length

  const totalExpected = studentsWithPayments.reduce((sum, { student, payment }) => {
    if (student.monthlyValue > 0 && !student.isScholarship) {
      return sum + (payment?.value || student.monthlyValue)
    }
    return sum
  }, 0)

  const [showPostponeDialog, setShowPostponeDialog] = useState(false)
  const [showReceiptDialog, setShowReceiptDialog] = useState(false)
  const [showEditValueDialog, setShowEditValueDialog] = useState(false)
  const [showMonthlyReport, setShowMonthlyReport] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null)
  const [postponeDate, setPostponeDate] = useState<Date>()
  const [receiptFile, setReceiptFile] = useState<File | null>(null)
  const [newMonthlyValue, setNewMonthlyValue] = useState("")

  const handlePostpone = (studentId: string) => {
    setSelectedStudent(studentId)
    setShowPostponeDialog(true)
  }

  const confirmPostpone = () => {
    if (selectedStudent && postponeDate) {
      postponePayment(selectedStudent, selectedMonth, postponeDate.toISOString())
      toast({
        title: "Pagamento adiado",
        description: `Nova data: ${format(postponeDate, "dd/MM/yyyy", { locale: ptBR })}`,
      })
      setShowPostponeDialog(false)
      setSelectedStudent(null)
      setPostponeDate(undefined)
    }
  }

  const handleUploadReceipt = (studentId: string) => {
    setSelectedStudent(studentId)
    setShowReceiptDialog(true)
  }

  const confirmReceiptUpload = () => {
    if (selectedStudent && receiptFile) {
      const reader = new FileReader()
      reader.onload = () => {
        const base64String = reader.result as string
        attachReceipt(selectedStudent, selectedMonth, base64String)
        toast({
          title: "Pagamento confirmado",
          description: "Comprovante anexado e pagamento marcado como pago",
        })
        setShowReceiptDialog(false)
        setSelectedStudent(null)
        setReceiptFile(null)
      }
      reader.readAsDataURL(receiptFile)
    } else {
      toast({
        title: "Erro",
        description: "Por favor, selecione um comprovante",
        variant: "destructive",
      })
    }
  }

  const handleEditValue = (studentId: string, currentValue: number) => {
    setSelectedStudent(studentId)
    setNewMonthlyValue(currentValue.toString())
    setShowEditValueDialog(true)
  }

  const confirmEditValue = () => {
    if (selectedStudent && newMonthlyValue) {
      const value = Number.parseFloat(newMonthlyValue)
      updateMonthlyValue(selectedStudent, selectedMonth, value)
      toast({
        title: "Valor atualizado",
        description: `Mensalidade de ${selectedMonth} atualizada para ${formatCurrency(value)}`,
      })
      setShowEditValueDialog(false)
      setSelectedStudent(null)
      setNewMonthlyValue("")
    }
  }

  const handleDeleteReceipt = (studentId: string) => {
    deleteReceipt(studentId, selectedMonth)
    toast({
      title: "Comprovante removido",
      description: "O comprovante foi excluído e o status revertido para Não Pagou",
    })
  }

  const handleMarkAsCharged = (studentId: string) => {
    updatePaymentStatus(studentId, selectedMonth, "Cobrado")
    const student = students.find((s) => s.id === studentId)
    toast({
      title: "Marcado como Cobrado",
      description: `${student?.name} foi marcado como cobrado em ${format(new Date(), "dd/MM/yyyy", { locale: ptBR })}.`,
    })
  }

  const viewReceipt = (receipt?: string | File) => {
    if (!receipt) return

    if (typeof receipt === "string") {
      window.open(receipt, "_blank")
    } else if (receipt instanceof File) {
      const url = URL.createObjectURL(receipt)
      window.open(url, "_blank")
    }
  }

  const monthlyReport = getMonthlyReport(selectedMonth)

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <AppHeader />

      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12 flex-1">
        <div className="mb-6 sm:mb-8 lg:mb-10">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mb-2 sm:mb-3 text-balance">
            Gerenciamento de Pagamentos
          </h2>
          <p className="text-sm sm:text-base lg:text-lg text-muted-foreground text-pretty">
            Controle pagamentos via comprovante. Upload automático marca como "Pago". Após dia 10 sem comprovante = "Não
            Pagou".
          </p>
        </div>

        <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 mb-6 sm:mb-8 lg:mb-10">
          <Card className="border-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm sm:text-base font-semibold">Selecionar Mês</CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger className="h-10 sm:h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {months.map((month) => (
                    <SelectItem key={month} value={month}>
                      {month}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          <Card className="border-2 hover:border-accent/50 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">Pagos</CardTitle>
              <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-lg bg-accent/10">
                <Check className="h-4 w-4 sm:h-5 sm:w-5 text-accent" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mb-1">{paidCount}</div>
              <p className="text-xs sm:text-sm text-muted-foreground">
                {((paidCount / (activeStudents.length - scholarshipCount)) * 100 || 0).toFixed(0)}% dos pagantes
              </p>
            </CardContent>
          </Card>

          <Card
            className="border-2 hover:border-destructive/50 transition-colors cursor-pointer"
            onClick={() => setShowPendingModal(true)}
          >
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">Pendentes</CardTitle>
              <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-lg bg-destructive/10">
                <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-destructive" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-destructive mb-1">{pendingCount}</div>
              <p className="text-xs sm:text-sm text-muted-foreground">Clique para ver detalhes</p>
            </CardContent>
          </Card>

          <Card className="border-2 hover:border-blue-500/50 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">Bolsistas</CardTitle>
              <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-lg bg-blue-500/10">
                <Users className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-blue-500 mb-1">{scholarshipCount}</div>
              <p className="text-xs sm:text-sm text-muted-foreground">Alunos com bolsa</p>
            </CardContent>
          </Card>

          <Card className="border-2 hover:border-primary/50 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">Total Esperado</CardTitle>
              <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-lg bg-primary/10">
                <DollarSign className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold text-foreground mb-1">{formatCurrency(totalExpected)}</div>
              <p className="text-xs sm:text-sm text-muted-foreground">Mês de {selectedMonth}</p>
            </CardContent>
          </Card>
        </div>

        <Card className="border-2 mb-6 sm:mb-8">
          <CardHeader>
            <CardTitle className="text-lg sm:text-xl">Lista de Pagamentos - {selectedMonth}</CardTitle>
            <CardDescription className="text-sm sm:text-base">
              Gerencie pagamentos através de comprovantes. Apenas upload de comprovante marca como "Pago".
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 sm:space-y-4">
              {studentsWithPayments.map(({ student, payment }) => {
                const isScholarship = student.isScholarship || student.monthlyValue === 0
                const isPaid = payment?.status === "Pago"
                const isNotPaid = payment?.status === "Não Pagou"
                const isCharged = payment?.status === "Cobrado"

                return (
                  <div
                    key={student.id}
                    className="flex flex-col gap-3 sm:gap-4 p-4 sm:p-5 rounded-xl border-2 bg-card hover:border-primary/30 transition-colors"
                  >
                    <div className="flex items-start gap-3 sm:gap-4">
                      <div className="relative h-14 w-14 sm:h-16 sm:w-16 lg:h-20 lg:w-20 rounded-full overflow-hidden bg-primary/10 border-2 border-primary/20 flex-shrink-0">
                        <Image
                          src={student.photo || "/placeholder.svg?height=80&width=80&query=student"}
                          alt={student.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-foreground text-sm sm:text-base truncate">{student.name}</p>
                        <p className="text-xs sm:text-sm text-muted-foreground truncate">{student.responsible}</p>
                        <p className="text-xs sm:text-sm font-medium text-foreground mt-1">
                          {isScholarship ? (
                            <span className="text-blue-500">Bolsista</span>
                          ) : (
                            formatCurrency(payment?.value || student.monthlyValue)
                          )}
                        </p>
                        {payment?.postponedTo && (
                          <p className="text-xs text-blue-600 dark:text-blue-400 mt-1 font-medium">
                            Adiado: {format(new Date(payment.postponedTo), "dd/MM/yyyy", { locale: ptBR })}
                          </p>
                        )}
                        {isPaid && payment?.receipt && (
                          <p className="text-xs text-accent mt-1 font-medium flex items-center gap-1">
                            <FileText className="h-3 w-3" />
                            Comprovante anexado
                          </p>
                        )}
                        {isCharged && payment?.chargedAt && (
                          <p className="text-xs text-orange-600 dark:text-orange-400 mt-1 font-medium">
                            Cobrado em: {format(new Date(payment.chargedAt), "dd/MM/yyyy", { locale: ptBR })}
                          </p>
                        )}
                      </div>
                      <div className="flex-shrink-0">
                        {isScholarship ? (
                          <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20">Bolsista</Badge>
                        ) : (
                          payment && <PaymentStatusBadge status={payment.status} />
                        )}
                      </div>
                    </div>

                    {!isScholarship && (
                      <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEditValue(student.id, payment?.value || student.monthlyValue)}
                          className="gap-1 text-xs sm:text-sm h-8 sm:h-9"
                        >
                          <Edit className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                          <span>Editar</span>
                        </Button>

                        {isNotPaid ? (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleMarkAsCharged(student.id)}
                              className="gap-1 text-xs sm:text-sm h-8 sm:h-9"
                              title="Sinaliza que você entrou em contato"
                            >
                              <Flag className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                              <span>Cobrado</span>
                            </Button>
                            <Button
                              size="sm"
                              disabled
                              variant="outline"
                              className="gap-1 opacity-50 bg-transparent text-xs sm:text-sm h-8 sm:h-9"
                              title="Bloqueado até alteração de status"
                            >
                              <Lock className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                              <span>Upload</span>
                            </Button>
                          </>
                        ) : isPaid && payment?.receipt ? (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => viewReceipt(payment.receipt)}
                              className="gap-1 text-xs sm:text-sm h-8 sm:h-9"
                            >
                              <Eye className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                              <span>Ver</span>
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDeleteReceipt(student.id)}
                              className="gap-1 text-destructive hover:text-destructive text-xs sm:text-sm h-8 sm:h-9"
                            >
                              <Trash2 className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                              <span>Remover</span>
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button
                              size="sm"
                              onClick={() => handlePostpone(student.id)}
                              variant="outline"
                              className="gap-1 text-xs sm:text-sm h-8 sm:h-9"
                            >
                              <CalendarIcon className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                              <span>Adiar</span>
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handleUploadReceipt(student.id)}
                              className="gap-1 text-xs sm:text-sm h-8 sm:h-9"
                            >
                              <Upload className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                              <span>Enviar</span>
                            </Button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          <Button
            variant="outline"
            className="gap-2 bg-transparent text-sm sm:text-base h-10 sm:h-11"
            onClick={() => {
              studentsWithPayments.forEach(({ student, payment }) => {
                if (payment?.status === "Em Aberto" && !student.isScholarship) {
                  updatePaymentStatus(student.id, selectedMonth, "Cobrado")
                }
              })
              toast({
                title: "Status atualizado",
                description: "Todos os pagamentos em aberto foram marcados como Cobrado",
              })
            }}
          >
            <AlertCircle className="h-4 w-4" />
            <span className="hidden sm:inline">Marcar Abertos como Cobrado</span>
            <span className="sm:hidden">Marcar Cobrado</span>
          </Button>
          <Button
            variant="outline"
            className="gap-2 bg-transparent text-sm sm:text-base h-10 sm:h-11"
            onClick={() => setShowMonthlyReport(true)}
          >
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">Gerar Relatório do Mês</span>
            <span className="sm:hidden">Relatório</span>
          </Button>
        </div>
      </main>

      {showPendingModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl border-2 max-h-[90vh] overflow-hidden flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between border-b">
              <div>
                <CardTitle className="text-xl flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-destructive" />
                  Pagamentos Pendentes - {selectedMonth}
                </CardTitle>
                <CardDescription>{pendingCount} alunos com pagamento pendente</CardDescription>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setShowPendingModal(false)}>
                <X className="h-5 w-5" />
              </Button>
            </CardHeader>
            <CardContent className="p-0 overflow-y-auto flex-1">
              <div className="divide-y">
                {pendingStudents.map(({ student, payment }) => (
                  <div key={student.id} className="p-4 hover:bg-accent/5 transition-colors">
                    <div className="flex items-start gap-4">
                      <div className="relative h-12 w-12 rounded-full overflow-hidden bg-primary/10 border-2 border-primary/20 flex-shrink-0">
                        <Image
                          src={student.photo || "/placeholder.svg?height=48&width=48&query=student"}
                          alt={student.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <p className="font-semibold text-foreground truncate">{student.name}</p>
                          <PaymentStatusBadge status={payment?.status || "Em Aberto"} />
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">Responsável: {student.responsible}</p>
                        <div className="flex flex-wrap gap-2 text-xs">
                          {student.fatherPhone && (
                            <a
                              href={`tel:${student.fatherPhone.replace(/\D/g, "")}`}
                              className="flex items-center gap-1 px-2 py-1 rounded bg-accent/10 hover:bg-accent/20 transition-colors"
                            >
                              <Phone className="h-3 w-3" />
                              Pai: {student.fatherPhone}
                            </a>
                          )}
                          {student.motherPhone && (
                            <a
                              href={`tel:${student.motherPhone.replace(/\D/g, "")}`}
                              className="flex items-center gap-1 px-2 py-1 rounded bg-accent/10 hover:bg-accent/20 transition-colors"
                            >
                              <Phone className="h-3 w-3" />
                              Mãe: {student.motherPhone}
                            </a>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-sm font-medium">
                            {formatCurrency(payment?.value || student.monthlyValue)}
                          </span>
                          {payment?.chargedAt && (
                            <span className="text-xs text-orange-600">
                              Cobrado em {format(new Date(payment.chargedAt), "dd/MM", { locale: ptBR })}
                            </span>
                          )}
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          handleMarkAsCharged(student.id)
                        }}
                        disabled={payment?.status === "Cobrado"}
                        className="shrink-0"
                      >
                        <Flag className="h-4 w-4 mr-1" />
                        {payment?.status === "Cobrado" ? "Cobrado" : "Marcar Cobrado"}
                      </Button>
                    </div>
                  </div>
                ))}
                {pendingStudents.length === 0 && (
                  <div className="p-8 text-center text-muted-foreground">
                    <Check className="h-12 w-12 mx-auto mb-3 text-accent opacity-50" />
                    <p>Nenhum pagamento pendente neste mês!</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {showPostponeDialog && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md border-2">
            <CardHeader>
              <CardTitle className="text-xl">Adiar Pagamento</CardTitle>
              <CardDescription className="text-base">Selecione a nova data para o pagamento</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal bg-transparent">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {postponeDate ? format(postponeDate, "dd/MM/yyyy", { locale: ptBR }) : "Selecionar data"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar mode="single" selected={postponeDate} onSelect={setPostponeDate} locale={ptBR} />
                </PopoverContent>
              </Popover>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setShowPostponeDialog(false)} className="flex-1">
                  Cancelar
                </Button>
                <Button onClick={confirmPostpone} className="flex-1" disabled={!postponeDate}>
                  Confirmar
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {showReceiptDialog && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md border-2">
            <CardHeader>
              <CardTitle className="text-xl">Anexar Comprovante</CardTitle>
              <CardDescription className="text-base">
                Selecione o comprovante de pagamento (imagem ou PDF)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="receipt">Arquivo</Label>
                <Input
                  id="receipt"
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => setReceiptFile(e.target.files?.[0] || null)}
                />
              </div>
              {receiptFile && <p className="text-sm text-muted-foreground">Arquivo selecionado: {receiptFile.name}</p>}
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowReceiptDialog(false)
                    setReceiptFile(null)
                  }}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button onClick={confirmReceiptUpload} className="flex-1" disabled={!receiptFile}>
                  Confirmar Pagamento
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {showEditValueDialog && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md border-2">
            <CardHeader>
              <CardTitle className="text-xl">Editar Valor da Mensalidade</CardTitle>
              <CardDescription className="text-base">Altere o valor apenas para este mês</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="newValue">Novo Valor (R$)</Label>
                <Input
                  id="newValue"
                  type="number"
                  step="0.01"
                  value={newMonthlyValue}
                  onChange={(e) => setNewMonthlyValue(e.target.value)}
                  placeholder="100.00"
                />
              </div>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowEditValueDialog(false)
                    setNewMonthlyValue("")
                  }}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button onClick={confirmEditValue} className="flex-1" disabled={!newMonthlyValue}>
                  Salvar
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {showMonthlyReport && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-lg border-2">
            <CardHeader>
              <CardTitle className="text-xl">Relatório de {selectedMonth}</CardTitle>
              <CardDescription>Resumo financeiro do mês</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-accent/10">
                  <p className="text-sm text-muted-foreground">Total Recebido</p>
                  <p className="text-2xl font-bold text-accent">{formatCurrency(monthlyReport.totalReceived)}</p>
                </div>
                <div className="p-4 rounded-lg bg-destructive/10">
                  <p className="text-sm text-muted-foreground">Pendente</p>
                  <p className="text-2xl font-bold text-destructive">{formatCurrency(monthlyReport.pendingAmount)}</p>
                </div>
              </div>
              {monthlyReport.defaultedStudents.length > 0 && (
                <div>
                  <p className="font-semibold mb-2">Alunos Inadimplentes:</p>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {monthlyReport.defaultedStudents.map((student) => (
                      <div key={student.id} className="flex justify-between items-center p-2 rounded bg-muted">
                        <span className="text-sm">{student.name}</span>
                        <span className="text-sm font-medium">{formatCurrency(student.monthlyValue)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <Button onClick={() => setShowMonthlyReport(false)} className="w-full">
                Fechar
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
