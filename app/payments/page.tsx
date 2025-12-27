"use client"

import { useState, useEffect, useMemo } from "react"
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
  Search,
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
import { LoadingStudents } from "@/components/loading-students"

export default function PaymentsPage() {
  const {
    students,
    isLoading,
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
  const [searchFilter, setSearchFilter] = useState("")

  const months = getAllMonths()
  const currentMonthIndex = getCurrentMonthIndex()

  const activeStudents = students.filter((s) => s.isActive)

  const studentsWithPayments = useMemo(() => {
    return activeStudents
      .map((student) => {
        const payment = student.payments.find((p) => p.month === selectedMonth)
        return { student, payment, shouldShow: true }
      })
      .filter((item) => {
        if (!searchFilter) return item.shouldShow
        const query = searchFilter.toLowerCase()
        return item.student.name.toLowerCase().includes(query) || item.student.responsible.toLowerCase().includes(query)
      })
  }, [activeStudents, selectedMonth, searchFilter])

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

  if (isLoading) {
    return <LoadingStudents message="Carregando pagamentos..." />
  }

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
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle className="text-lg sm:text-xl">Lista de Pagamentos - {selectedMonth}</CardTitle>
                <CardDescription className="text-sm sm:text-base">
                  Gerencie pagamentos através de comprovantes. Apenas upload de comprovante marca como "Pago".
                </CardDescription>
              </div>
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar aluno por nome..."
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  className="pl-9 pr-9"
                />
                {searchFilter && (
                  <button
                    onClick={() => setSearchFilter("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {searchFilter && (
              <p className="text-sm text-muted-foreground mb-4">
                Mostrando {studentsWithPayments.length} resultado(s) para "{searchFilter}"
              </p>
            )}
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

              {studentsWithPayments.length === 0 && (
                <div className="text-center py-12">
                  <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">Nenhum aluno encontrado</h3>
                  <p className="text-muted-foreground">
                    {searchFilter ? `Nenhum resultado para "${searchFilter}"` : "Não há alunos cadastrados"}
                  </p>
                  {searchFilter && (
                    <Button variant="outline" onClick={() => setSearchFilter("")} className="mt-4">
                      Limpar busca
                    </Button>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          <Button
            variant="outline"
            className="gap-2 bg-transparent text-sm sm:text-base"
            onClick={() => setShowMonthlyReport(true)}
          >
            <BarChart3 className="h-4 w-4" />
            Relatório Mensal
          </Button>
        </div>
      </main>

      {/* Postpone Dialog */}
      {showPostponeDialog && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md border-2">
            <CardHeader>
              <CardTitle className="text-lg sm:text-xl">Adiar Pagamento</CardTitle>
              <CardDescription className="text-sm sm:text-base">Selecione a nova data para o pagamento</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal bg-transparent">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {postponeDate ? format(postponeDate, "PPP", { locale: ptBR }) : "Selecione uma data"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={postponeDate}
                    onSelect={setPostponeDate}
                    initialFocus
                    locale={ptBR}
                  />
                </PopoverContent>
              </Popover>
              <div className="flex gap-3 justify-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowPostponeDialog(false)
                    setSelectedStudent(null)
                    setPostponeDate(undefined)
                  }}
                  className="text-sm sm:text-base"
                >
                  Cancelar
                </Button>
                <Button onClick={confirmPostpone} disabled={!postponeDate} className="text-sm sm:text-base">
                  Confirmar
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Receipt Upload Dialog */}
      {showReceiptDialog && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md border-2">
            <CardHeader>
              <CardTitle className="text-lg sm:text-xl">Enviar Comprovante</CardTitle>
              <CardDescription className="text-sm sm:text-base">
                Anexe o comprovante de pagamento para marcar como pago
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="receipt" className="text-sm sm:text-base">
                  Comprovante
                </Label>
                <Input
                  id="receipt"
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => setReceiptFile(e.target.files?.[0] || null)}
                  className="text-sm"
                />
              </div>
              <div className="flex gap-3 justify-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowReceiptDialog(false)
                    setSelectedStudent(null)
                    setReceiptFile(null)
                  }}
                  className="text-sm sm:text-base"
                >
                  Cancelar
                </Button>
                <Button onClick={confirmReceiptUpload} className="text-sm sm:text-base">
                  Confirmar Pagamento
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Edit Value Dialog */}
      {showEditValueDialog && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md border-2">
            <CardHeader>
              <CardTitle className="text-lg sm:text-xl">Editar Mensalidade</CardTitle>
              <CardDescription className="text-sm sm:text-base">
                Altere o valor da mensalidade para este mês
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="newValue" className="text-sm sm:text-base">
                  Novo Valor (R$)
                </Label>
                <Input
                  id="newValue"
                  type="number"
                  value={newMonthlyValue}
                  onChange={(e) => setNewMonthlyValue(e.target.value)}
                  placeholder="0.00"
                  className="text-sm"
                />
              </div>
              <div className="flex gap-3 justify-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowEditValueDialog(false)
                    setSelectedStudent(null)
                    setNewMonthlyValue("")
                  }}
                  className="text-sm sm:text-base"
                >
                  Cancelar
                </Button>
                <Button onClick={confirmEditValue} className="text-sm sm:text-base">
                  Salvar
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Monthly Report Dialog */}
      {showMonthlyReport && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-lg border-2">
            <CardHeader>
              <CardTitle className="text-lg sm:text-xl">Relatório Mensal - {selectedMonth}</CardTitle>
              <CardDescription className="text-sm sm:text-base">Resumo financeiro do mês</CardDescription>
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
                      <div key={student.id} className="flex justify-between text-sm p-2 rounded bg-muted">
                        <span>{student.name}</span>
                        <span className="text-destructive">{formatCurrency(student.monthlyValue)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div className="flex justify-end">
                <Button onClick={() => setShowMonthlyReport(false)} className="text-sm sm:text-base">
                  Fechar
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Pending Students Modal */}
      {showPendingModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl border-2 max-h-[80vh] overflow-hidden flex flex-col">
            <CardHeader className="flex-shrink-0">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg sm:text-xl flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-destructive" />
                    Alunos Pendentes - {selectedMonth}
                  </CardTitle>
                  <CardDescription className="text-sm sm:text-base">
                    {pendingCount} aluno(s) com pagamento pendente
                  </CardDescription>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setShowPendingModal(false)}>
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="overflow-y-auto flex-1">
              <div className="space-y-3">
                {pendingStudents.map(({ student, payment }) => (
                  <div
                    key={student.id}
                    className="flex items-center justify-between p-4 rounded-xl border-2 bg-card hover:border-destructive/30 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative h-12 w-12 rounded-full overflow-hidden bg-primary/10 border-2 border-primary/20 flex-shrink-0">
                        <Image
                          src={student.photo || "/placeholder.svg?height=48&width=48&query=student"}
                          alt={student.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">{student.name}</p>
                        <p className="text-sm text-muted-foreground">{student.responsible}</p>
                        <div className="flex items-center gap-2 mt-1">
                          {student.fatherPhone && (
                            <a
                              href={`tel:${student.fatherPhone}`}
                              className="text-xs text-primary hover:underline flex items-center gap-1"
                            >
                              <Phone className="h-3 w-3" />
                              Pai
                            </a>
                          )}
                          {student.motherPhone && (
                            <a
                              href={`tel:${student.motherPhone}`}
                              className="text-xs text-primary hover:underline flex items-center gap-1"
                            >
                              <Phone className="h-3 w-3" />
                              Mãe
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-destructive">
                        {formatCurrency(payment?.value || student.monthlyValue)}
                      </p>
                      {payment && <PaymentStatusBadge status={payment.status} />}
                    </div>
                  </div>
                ))}
                {pendingStudents.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Check className="h-12 w-12 mx-auto mb-3 text-accent" />
                    <p>Nenhum pagamento pendente</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
