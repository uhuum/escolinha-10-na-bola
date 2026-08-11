"use client"

import { useState, useEffect, useMemo } from "react"
import { useStudents } from "@/lib/hooks/use-students"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { PaymentStatusBadge } from "@/components/payment-status-badge"
import { ReceiptViewerModal } from "@/components/receipt-viewer-modal"
import { PaymentSplash } from "@/components/payment-splash"
import { formatCurrency } from "@/lib/utils/currency"
import {
  DollarSign,
  Check,
  AlertCircle,
  CalendarIcon,
  Upload,
  Eye,
  Edit,
  Trash2,
  Flag,
  Users,
  X,
  ChevronLeft,
  ChevronRight,
  Banknote,
  QrCode,
  MessageCircle,
  Phone,
  UserX,
  ShieldOff,
  FileText,
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
import {
  getAllMonths,
  getCurrentDay,
  getCurrentMonthName,
  getCurrentMonthIndex,
  getCurrentYear,
  getAvailableYears,
  getMonthNumberFromName,
  formatMonthYearFromNumbers,
  getCurrentMonthNumber,
  getMonthNameFromNumber, // Added for getMonthNameFromNumber
} from "@/lib/utils/date"
import { matchesMonthYearByNumbers } from "@/lib/utils/date"
import { LoadingStudents } from "@/components/loading-students"
import {
  determinePaymentStatus,
  getPendingPaymentsInfo,
  generateWhatsAppMessage,
  BASE_YEAR,
  BASE_MONTH,
} from "@/lib/utils/payment" // Added BASE_YEAR and BASE_MONTH
import type { PaymentType, Student } from "@/lib/types"
import { jsPDF } from "jspdf"
import autoTable from "jspdf-autotable"

const PIX_KEY = "43.602.144/0001-20"

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
    markAsPaidCash,
    exemptPayment,
  } = useStudents()
  const { toast } = useToast()
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const currentMonth = getCurrentMonthNumber()
    const currentYear = getCurrentYear()
    // If current date is before December 2025, show December 2025
    if (currentYear < BASE_YEAR || (currentYear === BASE_YEAR && currentMonth < BASE_MONTH)) {
      return getMonthNameFromNumber(BASE_MONTH)
    }
    return getCurrentMonthName()
  })
  const [selectedYear, setSelectedYear] = useState(() => {
    const currentYear = getCurrentYear()
    if (currentYear < BASE_YEAR) return BASE_YEAR
    return currentYear
  })
  const [showPendingModal, setShowPendingModal] = useState(false)
  const [searchFilter, setSearchFilter] = useState("")
  const [receiptModal, setReceiptModal] = useState<{
    isOpen: boolean
    receipt: string
    studentName: string
    month: string
  }>({
    isOpen: false,
    receipt: "",
    studentName: "",
    month: "",
  })
  const [showWhatsAppDialog, setShowWhatsAppDialog] = useState(false)
  const [whatsAppStudent, setWhatsAppStudent] = useState<Student | null>(null)

  const [showPaymentSplash, setShowPaymentSplash] = useState(false)
  const [paymentSplashData, setPaymentSplashData] = useState<{
    studentName: string
    studentPhoto?: string
    paymentType: PaymentType
  } | null>(null)

  const months = getAllMonths()
  const years = getAvailableYears()
  const currentMonthIndex = getCurrentMonthIndex()
  const selectedMonthNumber = getMonthNumberFromName(selectedMonth)
  const currentMonthNum = getCurrentMonthNumber()
  const currentYearNum = getCurrentYear()
  const currentDay = getCurrentDay()

  const handlePreviousMonth = () => {
    const currentIndex = months.indexOf(selectedMonth)
    if (selectedYear === BASE_YEAR && selectedMonthNumber <= BASE_MONTH) return

    if (currentIndex > 0) {
      setSelectedMonth(months[currentIndex - 1])
    } else {
      setSelectedMonth(months[11])
      setSelectedYear(selectedYear - 1)
    }
  }

  const handleNextMonth = () => {
    const currentIndex = months.indexOf(selectedMonth)
    if (currentIndex < 11) {
      setSelectedMonth(months[currentIndex + 1])
    } else {
      setSelectedMonth(months[0])
      setSelectedYear(selectedYear + 1)
    }
  }

  const allStudentsForPayments = students

  const studentsWithPayments = useMemo(() => {
    return allStudentsForPayments
      .map((student) => {
        const payment = student.payments.find((p) => matchesMonthYearByNumbers(p, selectedMonthNumber, selectedYear))
        const isArchived = !student.isActive || student.archivedAt

        const regDate = student.registrationDate ? new Date(student.registrationDate) : null
        const regYear = regDate ? regDate.getFullYear() : 2020
        const regMonth = regDate ? regDate.getMonth() + 1 : 1
        const wasRegisteredBeforeThisMonth =
          regYear < selectedYear || (regYear === selectedYear && regMonth <= selectedMonthNumber)

        const archiveDate = student.archivedAt ? new Date(student.archivedAt) : null
        const archiveYear = archiveDate ? archiveDate.getFullYear() : null
        const archiveMonth = archiveDate ? archiveDate.getMonth() + 1 : null
        const wasArchivedBeforeThisMonth =
          archiveYear &&
          archiveMonth &&
          (archiveYear < selectedYear || (archiveYear === selectedYear && archiveMonth < selectedMonthNumber))
        const wasArchivedThisMonth =
          archiveYear && archiveMonth && archiveYear === selectedYear && archiveMonth === selectedMonthNumber

        return {
          student,
          payment,
          shouldShow: wasRegisteredBeforeThisMonth && payment !== undefined,
          isArchived,
          wasArchivedBeforeThisMonth,
          wasArchivedThisMonth,
        }
      })
      .filter((item) => {
        if (!item.shouldShow) return false
        if (!searchFilter) return true
        const query = searchFilter.toLowerCase()
        return item.student.name.toLowerCase().includes(query) || item.student.responsible.toLowerCase().includes(query)
      })
  }, [allStudentsForPayments, selectedMonthNumber, selectedYear, searchFilter])

  useEffect(() => {
    const isCurrentMonthYear = selectedMonthNumber === currentMonthNum && selectedYear === currentYearNum

    if (!isCurrentMonthYear) return

    const monthString = formatMonthYearFromNumbers(selectedMonthNumber, selectedYear)

    studentsWithPayments.forEach(({ student, payment, isArchived }) => {
      if (student.monthlyValue === 0 || student.isScholarship || isArchived) return

      if (payment && payment.status !== "Pago" && payment.status !== "Adiado" && payment.status !== "Bolsista") {
        const newStatus = determinePaymentStatus(selectedMonthNumber, selectedYear, payment.status, !!payment.receipt)

        if (newStatus !== payment.status) {
          updatePaymentStatus(student.id, payment.month || monthString, newStatus)
        }
      }
    })
  }, [
    selectedMonth,
    selectedYear,
    selectedMonthNumber,
    studentsWithPayments,
    updatePaymentStatus,
    currentMonthNum,
    currentYearNum,
  ])

  const paidCount = studentsWithPayments.filter((s) => s.payment?.status === "Pago").length

  const pendingStudents = studentsWithPayments.filter(
    (s) =>
      !s.student.isScholarship &&
      s.student.monthlyValue > 0 &&
      !s.isArchived &&
      (s.payment?.status === "Não Pagou" || s.payment?.status === "Cobrado"),
  )
  const pendingCount = pendingStudents.length

  const openStudents = studentsWithPayments.filter(
    (s) => !s.student.isScholarship && s.student.monthlyValue > 0 && !s.isArchived && s.payment?.status === "Em Aberto",
  )
  const openCount = openStudents.length

  const scholarshipCount = studentsWithPayments.filter(
    (s) => s.student.isScholarship || s.student.monthlyValue === 0,
  ).length

  const archivedCount = studentsWithPayments.filter((s) => s.isArchived).length

  const totalExpected = studentsWithPayments.reduce((sum, { student, payment, isArchived }) => {
    if (student.monthlyValue > 0 && !student.isScholarship && !isArchived) {
      return sum + (payment?.value || student.monthlyValue)
    }
    return sum
  }, 0)

  const totalReceived = studentsWithPayments.reduce((sum, { payment }) => {
    if (payment?.status === "Pago") {
      return sum + (payment.value || 0)
    }
    return sum
  }, 0)

  const [showPostponeDialog, setShowPostponeDialog] = useState(false)
  const [showEditValueDialog, setShowEditValueDialog] = useState(false)
  const [showMonthlyReport, setShowMonthlyReport] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null)
  const [selectedPaymentMonth, setSelectedPaymentMonth] = useState<string>("")
  const [postponeDate, setPostponeDate] = useState<Date>()
  const [newMonthlyValue, setNewMonthlyValue] = useState("")
  const [showPaymentTypeDialog, setShowPaymentTypeDialog] = useState(false)
  const [selectedPaymentType, setSelectedPaymentType] = useState<PaymentType | null>(null)

  const handlePostpone = (studentId: string, paymentMonth: string) => {
    setSelectedStudent(studentId)
    setSelectedPaymentMonth(paymentMonth)
    setShowPostponeDialog(true)
  }

  const confirmPostpone = () => {
    if (selectedStudent && postponeDate && selectedPaymentMonth) {
      postponePayment(selectedStudent, selectedPaymentMonth, postponeDate.toISOString())
      toast({
        title: "Pagamento adiado",
        description: `Nova data: ${format(postponeDate, "dd/MM/yyyy", { locale: ptBR })}`,
      })
      setShowPostponeDialog(false)
      setSelectedStudent(null)
      setSelectedPaymentMonth("")
      setPostponeDate(undefined)
    }
  }

  const handleConfirmPayment = (studentId: string, paymentMonth: string) => {
    setSelectedStudent(studentId)
    setSelectedPaymentMonth(paymentMonth)
    setSelectedPaymentType(null)
    setShowPaymentTypeDialog(true)
  }

  const confirmPaymentType = async () => {
    if (!selectedStudent || !selectedPaymentMonth || !selectedPaymentType) return

    const student = students.find((s) => s.id === selectedStudent)
    if (!student) return

    // Show splash and mark as paid for both payment types
    setPaymentSplashData({
      studentName: student.name,
      studentPhoto: student.photo,
      paymentType: selectedPaymentType,
    })
    setShowPaymentTypeDialog(false)
    setShowPaymentSplash(true)

    // Process payment in background
    await markAsPaidCash(selectedStudent, selectedPaymentMonth)
  }

  const handlePaymentSplashComplete = () => {
    const paymentTypeText = selectedPaymentType === "dinheiro" ? "dinheiro" : "PIX"
    toast({
      title: "Pagamento confirmado",
      description: `Pagamento em ${paymentTypeText} registrado com sucesso`,
    })
    setShowPaymentSplash(false)
    setPaymentSplashData(null)
    setSelectedStudent(null)
    setSelectedPaymentMonth("")
    setSelectedPaymentType(null)
  }



  const handleEditValue = (studentId: string, paymentMonth: string, currentValue: number) => {
    setSelectedStudent(studentId)
    setSelectedPaymentMonth(paymentMonth)
    setNewMonthlyValue(currentValue.toString())
    setShowEditValueDialog(true)
  }

  const confirmEditValue = () => {
    if (selectedStudent && newMonthlyValue && selectedPaymentMonth) {
      const value = Number.parseFloat(newMonthlyValue)
      updateMonthlyValue(selectedStudent, selectedPaymentMonth, value)
      toast({
        title: "Valor atualizado",
        description: `Mensalidade de ${selectedPaymentMonth} atualizada para ${formatCurrency(value)}`,
      })
      setShowEditValueDialog(false)
      setSelectedStudent(null)
      setSelectedPaymentMonth("")
      setNewMonthlyValue("")
    }
  }

  const handleDeleteReceipt = (studentId: string, paymentMonth: string) => {
    deleteReceipt(studentId, paymentMonth)
    toast({
      title: "Comprovante removido",
      description: "O comprovante foi excluído e o status revertido para Não Pagou",
    })
  }

  const handleMarkAsCharged = (studentId: string, paymentMonth: string) => {
    updatePaymentStatus(studentId, paymentMonth, "Cobrado")
    const student = students.find((s) => s.id === studentId)
    toast({
      title: "Marcado como Cobrado",
      description: `${student?.name} foi marcado como cobrado em ${format(new Date(), "dd/MM/yyyy", { locale: ptBR })}.`,
    })
  }

  const handleExemptPayment = (studentId: string, paymentMonth: string) => {
    exemptPayment(studentId, paymentMonth)
    const student = students.find((s) => s.id === studentId)
    toast({
      title: "Mensalidade isenta",
      description: `${student?.name} foi isentado da mensalidade de ${paymentMonth}`,
    })
  }

  const viewReceipt = (receipt: string | File | undefined, studentName: string, paymentMonth: string) => {
    if (!receipt) return

    if (typeof receipt === "string") {
      setReceiptModal({
        isOpen: true,
        receipt,
        studentName,
        month: paymentMonth,
      })
    } else if (receipt instanceof File) {
      const reader = new FileReader()
      reader.onload = () => {
        setReceiptModal({
          isOpen: true,
          receipt: reader.result as string,
          studentName,
          month: paymentMonth,
        })
      }
      reader.readAsDataURL(receipt)
    }
  }

  const handleWhatsAppCharge = (studentId: string) => {
    const student = students.find((s) => s.id === studentId)
    if (!student) return

    // Check if student has any phones
    if (!student.fatherPhone && !student.motherPhone) {
      toast({
        title: "Telefone não cadastrado",
        description: "Nenhum telefone foi cadastrado para este aluno",
        variant: "destructive",
      })
      return
    }

    // If only one phone, use it directly
    if (student.fatherPhone && !student.motherPhone) {
      sendWhatsAppMessage(student, student.fatherPhone)
      return
    }
    if (!student.fatherPhone && student.motherPhone) {
      sendWhatsAppMessage(student, student.motherPhone)
      return
    }

    // Both phones available - show selection dialog
    setWhatsAppStudent(student)
    setShowWhatsAppDialog(true)
  }

  const sendWhatsAppMessage = (student: Student, phone: string) => {
    const pendingPayments = getPendingPaymentsInfo(student.payments)
    if (pendingPayments.length === 0) {
      toast({
        title: "Sem pendências",
        description: "Este aluno não possui pagamentos pendentes",
      })
      return
    }

    const cleanPhone = phone.replace(/\D/g, "")
    const phoneWithCountry = cleanPhone.startsWith("55") ? cleanPhone : `55${cleanPhone}`

    const message = generateWhatsAppMessage(student.name, student.responsible, pendingPayments, PIX_KEY)
    const whatsappUrl = `https://wa.me/${phoneWithCountry}?text=${message}`

    window.open(whatsappUrl, "_blank")
    setShowWhatsAppDialog(false)
    setWhatsAppStudent(null)
  }

  const handleDownloadPendingReport = () => {
    const pendingReportData = studentsWithPayments
      .filter(
        ({ student, payment, isArchived }) =>
          !student.isScholarship &&
          student.monthlyValue > 0 &&
          !isArchived &&
          (payment?.status === "Não Pagou" || payment?.status === "Cobrado" || payment?.status === "Em Aberto"),
      )
      .map(({ student, payment }) => ({
        nome: student.name,
        responsavel: student.responsible,
        telefone: student.fatherPhone || student.motherPhone || "-",
        mesAno: `${selectedMonth}/${selectedYear}`,
        status: payment?.status || "Sem registro",
        valor: payment?.value || student.monthlyValue,
      }))
      .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"))

    const doc = new jsPDF()

    doc.setFontSize(18)
    doc.setFont("helvetica", "bold")
    doc.text("Relatório de Alunos Pendentes", 14, 20)

    doc.setFontSize(12)
    doc.setFont("helvetica", "normal")
    doc.text(`Período: ${selectedMonth}/${selectedYear}`, 14, 30)
    doc.text(`Gerado em: ${new Date().toLocaleDateString("pt-BR")}`, 14, 37)
    doc.text(`Total de pendentes: ${pendingReportData.length}`, 14, 44)

    autoTable(doc, {
      startY: 52,
      head: [["Nome", "Responsável", "Telefone", "Mês/Ano", "Status", "Valor"]],
      body: pendingReportData.map((row) => [
        row.nome,
        row.responsavel,
        row.telefone,
        row.mesAno,
        row.status,
        `R$ ${row.valor.toFixed(2).replace(".", ",")}`,
      ]),
      styles: { fontSize: 9, cellPadding: 3 },
      headStyles: { fillColor: [220, 53, 69], textColor: 255 },
      alternateRowStyles: { fillColor: [255, 245, 245] },
    })

    const finalY = (doc as any).lastAutoTable.finalY + 10
    const totalPending = pendingReportData.reduce((sum, r) => sum + r.valor, 0)
    doc.setFontSize(11)
    doc.setFont("helvetica", "bold")
    doc.text(`Total a receber: R$ ${totalPending.toFixed(2).replace(".", ",")}`, 14, finalY)

    doc.save(`pendentes_${selectedMonth}_${selectedYear}.pdf`)

    toast({
      title: "Relatório baixado",
      description: `Relatório PDF de pendentes de ${selectedMonth}/${selectedYear} exportado com sucesso`,
    })
  }

  const handleDownloadReport = () => {
    const reportData = studentsWithPayments
      .filter(({ student, isArchived }) => !student.isScholarship || isArchived) // Keep scholarships and archived students for the report
      .map(({ student, payment, isArchived }) => ({
        nome: student.name,
        responsavel: student.responsible,
        telefone: student.fatherPhone || student.motherPhone || "-",
        mesAno: `${selectedMonth}/${selectedYear}`,
        status: isArchived ? "AFASTADO" : payment?.status || "Sem registro",
        valor: payment?.value || student.monthlyValue,
        arquivado: isArchived ? "Sim" : "Não",
        isento: student.isScholarship || student.monthlyValue === 0 ? "Sim" : "Não",
      }))
      .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR")) // Sort by name

    // Create PDF
    const doc = new jsPDF()

    // Header
    doc.setFontSize(18)
    doc.setFont("helvetica", "bold")
    doc.text("Relatório de Pagamentos", 14, 20)

    doc.setFontSize(12)
    doc.setFont("helvetica", "normal")
    doc.text(`Período: ${selectedMonth}/${selectedYear}`, 14, 30)
    doc.text(`Gerado em: ${new Date().toLocaleDateString("pt-BR")}`, 14, 37)

    // Table
    autoTable(doc, {
      startY: 45,
      head: [["Nome", "Responsável", "Telefone", "Mês/Ano", "Status", "Valor", "Arquivado", "Isento"]],
      body: reportData.map((row) => [
        row.nome,
        row.responsavel,
        row.telefone,
        row.mesAno,
        row.status,
        `R$ ${row.valor.toFixed(2).replace(".", ",")}`,
        row.arquivado,
        row.isento,
      ]),
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [41, 128, 185], textColor: 255 }, // Blue header
      alternateRowStyles: { fillColor: [245, 245, 245] }, // Light gray for alternate rows
    })

    // Footer with summary
    const finalY = (doc as any).lastAutoTable.finalY + 10
    doc.setFontSize(10)
    doc.text(`Total de alunos: ${reportData.length}`, 14, finalY)
    doc.text(`Pagos: ${reportData.filter((r) => r.status === "Pago").length}`, 14, finalY + 6)
    doc.text(
      `Pendentes: ${reportData.filter((r) => r.status === "Não Pagou" || r.status === "Cobrado").length}`,
      14,
      finalY + 12,
    )
    doc.text(`Afastados: ${reportData.filter((r) => r.arquivado === "Sim").length}`, 14, finalY + 18)

    // Save
    doc.save(`relatorio_${selectedMonth}_${selectedYear}.pdf`)

    toast({
      title: "Relatório baixado",
      description: `Relatório PDF de ${selectedMonth}/${selectedYear} exportado com sucesso`,
    })
  }

  const monthlyReport = getMonthlyReport(selectedMonth, selectedYear)

  if (isLoading) {
    return <LoadingStudents message="Carregando pagamentos..." />
  }

  const getBorderColor = (payment: any, isScholarship: boolean, isArchived: boolean) => {
    if (isArchived) return "border-gray-500/50 bg-gray-500/5"
    if (isScholarship) return "border-blue-500/30 bg-blue-500/5"
    if (payment?.status === "Pago") return "border-green-500/30 bg-green-500/5"
    if (payment?.status === "Em Aberto") return "border-amber-500/30 bg-amber-500/5"
    if (payment?.status === "Não Pagou" || payment?.status === "Cobrado") return "border-red-500/30 bg-red-500/5"
    return "hover:border-primary/30"
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <AppHeader />

      <main className="container mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-12 flex-1">
        <div className="mb-4 sm:mb-6 lg:mb-10">
          <h2 className="text-xl sm:text-2xl lg:text-4xl font-bold text-foreground mb-1 sm:mb-2 text-balance">
            Gerenciamento de Pagamentos
          </h2>
          <p className="text-xs sm:text-sm lg:text-base text-muted-foreground text-pretty">
            Vencimento: dia 10. Entre dia 1-10: "Em Aberto". Após dia 10: "Não Pagou". Dinheiro ou PIX.
          </p>
        </div>

        <div className="grid gap-3 sm:gap-4 lg:gap-6 grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 mb-4 sm:mb-6 lg:mb-10">
          <Card className="border-2 col-span-2 sm:col-span-1">
            <CardHeader className="pb-2 p-3 sm:p-4">
              <CardTitle className="text-xs sm:text-sm font-semibold">Período</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 p-3 sm:p-4 pt-0">
              <div>
                <Label className="text-[10px] sm:text-xs text-muted-foreground mb-1 block">Ano</Label>
                <Select value={selectedYear.toString()} onValueChange={(v) => setSelectedYear(Number.parseInt(v, 10))}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {years
                      .filter((y) => y >= BASE_YEAR)
                      .map((year) => (
                        <SelectItem key={year} value={year.toString()}>
                          {year}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-[10px] sm:text-xs text-muted-foreground mb-1 block">Mês</Label>
                <div className="flex items-center gap-0.5 sm:gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 sm:h-8 sm:w-8 shrink-0"
                    onClick={handlePreviousMonth}
                    title="Mês anterior"
                    disabled={selectedYear === BASE_YEAR && selectedMonthNumber <= BASE_MONTH}
                  >
                    <ChevronLeft className="h-3 w-3 sm:h-4 sm:w-4" />
                  </Button>
                  <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                    <SelectTrigger className="h-8 flex-1 min-w-0 text-xs px-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {months.map((month, index) => {
                        const monthNum = index + 1
                        if (selectedYear === BASE_YEAR && monthNum < BASE_MONTH) return null
                        return (
                          <SelectItem key={month} value={month}>
                            {month}
                          </SelectItem>
                        )
                      })}
                    </SelectContent>
                  </Select>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 sm:h-8 sm:w-8 shrink-0"
                    onClick={handleNextMonth}
                    title="Próximo mês"
                  >
                    <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 hover:border-accent/50 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between pb-2 sm:pb-3 p-3 sm:p-4 lg:p-6">
              <CardTitle className="text-[10px] sm:text-xs lg:text-sm font-medium text-muted-foreground">
                Pagos
              </CardTitle>
              <div className="flex h-6 w-6 sm:h-8 sm:w-8 lg:h-10 lg:w-10 items-center justify-center rounded-lg bg-accent/10">
                <Check className="h-3 w-3 sm:h-4 sm:w-4 lg:h-5 lg:w-5 text-accent" />
              </div>
            </CardHeader>
            <CardContent className="p-3 sm:p-4 lg:p-6 pt-0">
              <div className="text-xl sm:text-2xl lg:text-4xl font-bold text-accent mb-1">{paidCount}</div>
              <p className="text-[10px] sm:text-xs lg:text-sm text-muted-foreground">100% dos pagantes</p>
            </CardContent>
          </Card>

          <Card className="border-2 hover:border-amber-500/50 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between pb-2 sm:pb-3 p-3 sm:p-4 lg:p-6">
              <CardTitle className="text-[10px] sm:text-xs lg:text-sm font-medium text-muted-foreground">
                Em Aberto
              </CardTitle>
              <div className="flex h-6 w-6 sm:h-8 sm:w-8 lg:h-10 lg:w-10 items-center justify-center rounded-lg bg-amber-500/10">
                <CalendarIcon className="h-3 w-3 sm:h-4 sm:w-4 lg:h-5 lg:w-5 text-amber-500" />
              </div>
            </CardHeader>
            <CardContent className="p-3 sm:p-4 lg:p-6 pt-0">
              <div className="text-xl sm:text-2xl lg:text-4xl font-bold text-amber-500 mb-1">{openCount}</div>
              <p className="text-[10px] sm:text-xs lg:text-sm text-muted-foreground">Aguardando (dia 1-10)</p>
            </CardContent>
          </Card>

          <Card
            className="border-2 hover:border-destructive/50 transition-colors cursor-pointer"
            onClick={() => setShowPendingModal(true)}
          >
            <CardHeader className="flex flex-row items-center justify-between pb-2 sm:pb-3 p-3 sm:p-4 lg:p-6">
              <CardTitle className="text-[10px] sm:text-xs lg:text-sm font-medium text-muted-foreground">
                Pendentes
              </CardTitle>
              <div className="flex h-6 w-6 sm:h-8 sm:w-8 lg:h-10 lg:w-10 items-center justify-center rounded-lg bg-destructive/10">
                <AlertCircle className="h-3 w-3 sm:h-4 sm:w-4 lg:h-5 lg:w-5 text-destructive" />
              </div>
            </CardHeader>
            <CardContent className="p-3 sm:p-4 lg:p-6 pt-0">
              <div className="text-xl sm:text-2xl lg:text-4xl font-bold text-destructive mb-1">{pendingCount}</div>
              <p className="text-[10px] sm:text-xs lg:text-sm text-muted-foreground">Clique para cobrar</p>
            </CardContent>
          </Card>

          <Card className="border-2 hover:border-blue-500/50 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between pb-2 sm:pb-3 p-3 sm:p-4 lg:p-6">
              <CardTitle className="text-[10px] sm:text-xs lg:text-sm font-medium text-muted-foreground">
                Bolsistas
              </CardTitle>
              <div className="flex h-6 w-6 sm:h-8 sm:w-8 lg:h-10 lg:w-10 items-center justify-center rounded-lg bg-blue-500/10">
                <Users className="h-3 w-3 sm:h-4 sm:w-4 lg:h-5 lg:w-5 text-blue-500" />
              </div>
            </CardHeader>
            <CardContent className="p-3 sm:p-4 lg:p-6 pt-0">
              <div className="text-xl sm:text-2xl lg:text-4xl font-bold text-blue-500 mb-1">{scholarshipCount}</div>
              <p className="text-[10px] sm:text-xs lg:text-sm text-muted-foreground">Alunos com bolsa</p>
            </CardContent>
          </Card>

          <Card className="border-2 hover:border-gray-500/50 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between pb-2 sm:pb-3 p-3 sm:p-4 lg:p-6">
              <CardTitle className="text-[10px] sm:text-xs lg:text-sm font-medium text-muted-foreground">
                Afastados
              </CardTitle>
              <div className="flex h-6 w-6 sm:h-8 sm:w-8 lg:h-10 lg:w-10 items-center justify-center rounded-lg bg-gray-500/10">
                <UserX className="h-3 w-3 sm:h-4 sm:w-4 lg:h-5 lg:w-5 text-gray-500" />
              </div>
            </CardHeader>
            <CardContent className="p-3 sm:p-4 lg:p-6 pt-0">
              <div className="text-xl sm:text-2xl lg:text-4xl font-bold text-gray-500 mb-1">{archivedCount}</div>
              <p className="text-[10px] sm:text-xs lg:text-sm text-muted-foreground">Alunos arquivados</p>
            </CardContent>
          </Card>

          <Card className="border-2 hover:border-primary/50 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between pb-2 sm:pb-3 p-3 sm:p-4 lg:p-6">
              <CardTitle className="text-[10px] sm:text-xs lg:text-sm font-medium text-muted-foreground">
                Receita
              </CardTitle>
              <div className="flex h-6 w-6 sm:h-8 sm:w-8 lg:h-10 lg:w-10 items-center justify-center rounded-lg bg-primary/10">
                <DollarSign className="h-3 w-3 sm:h-4 sm:w-4 lg:h-5 lg:w-5 text-primary" />
              </div>
            </CardHeader>
            <CardContent className="p-3 sm:p-4 lg:p-6 pt-0">
              <div className="text-lg sm:text-xl lg:text-2xl font-bold text-foreground mb-1">
                {formatCurrency(totalReceived)}
              </div>
              <p className="text-[10px] sm:text-xs lg:text-sm text-muted-foreground">
                de {formatCurrency(totalExpected)}
              </p>
            </CardContent>
          </Card>
        </div>

        <Card className="border-2 mb-4 sm:mb-6 lg:mb-8">
          <CardHeader className="p-3 sm:p-4 lg:p-6">
            <div className="flex flex-col gap-3 sm:gap-4">
              <div>
                <CardTitle className="text-base sm:text-lg lg:text-xl">
                  Lista de Pagamentos - {selectedMonth}/{selectedYear}
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm lg:text-base">
                  Vencimento dia 10. Confirme pagamentos escolhendo Dinheiro (direto) ou PIX (com comprovante)
                </CardDescription>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 items-stretch sm:items-center">
                <Button
                  variant="outline"
                  onClick={handleDownloadReport}
                  className="gap-2 bg-transparent h-9 sm:h-10 text-xs sm:text-sm order-3 sm:order-1"
                  title="Baixar relatório completo do mês em PDF"
                >
                  <FileText className="h-4 w-4" />
                  <span>Relatório Geral</span>
                </Button>
                <Button
                  variant="outline"
                  onClick={handleDownloadPendingReport}
                  className="gap-2 bg-transparent h-9 sm:h-10 text-xs sm:text-sm order-2 text-destructive hover:text-destructive"
                  title="Baixar relatório de pendentes em PDF"
                >
                  <AlertCircle className="h-4 w-4" />
                  <span>Relatório Pendentes</span>
                </Button>
                <div className="relative flex-1 order-1 sm:order-3">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar aluno..."
                    value={searchFilter}
                    onChange={(e) => setSearchFilter(e.target.value)}
                    className="pl-9 pr-9 h-9 sm:h-10 text-sm"
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
            </div>
          </CardHeader>
          <CardContent className="p-3 sm:p-4 lg:p-6 pt-0">
            {searchFilter && (
              <p className="text-sm text-muted-foreground mb-4">
                Mostrando {studentsWithPayments.length} resultado(s) para "{searchFilter}"
              </p>
            )}
            {studentsWithPayments.length === 0 && !searchFilter && (
              <div className="text-center py-12 text-muted-foreground">
                <CalendarIcon className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p className="text-lg font-medium">Nenhum pagamento encontrado</p>
                <p className="text-sm">
                  Não há registros de pagamentos para {selectedMonth}/{selectedYear}
                </p>
              </div>
            )}
            <div className="space-y-3 sm:space-y-4">
              {studentsWithPayments.map(({ student, payment, isArchived, wasArchivedThisMonth }) => {
                const isScholarship = student.isScholarship || student.monthlyValue === 0
                const isPaid = payment?.status === "Pago"
                const isNotPaid = payment?.status === "Não Pagou"
                const isCharged = payment?.status === "Cobrado"
                const isOpen = payment?.status === "Em Aberto"
                const paymentMonth = payment?.month || formatMonthYearFromNumbers(selectedMonthNumber, selectedYear)

                return (
                  <div
                    key={student.id}
                    className={`flex flex-col gap-3 sm:gap-4 p-4 sm:p-5 rounded-xl border-2 bg-card transition-colors ${getBorderColor(payment, isScholarship, isArchived)}`}
                  >
                    <div className="flex items-start gap-3 sm:gap-4">
                      <div
                        className={`relative h-14 w-14 sm:h-16 sm:w-16 lg:h-20 lg:w-20 rounded-full overflow-hidden border-2 flex-shrink-0 ${isArchived ? "bg-gray-500/10 border-gray-500/20 grayscale" : "bg-primary/10 border-primary/20"}`}
                      >
                        <Image
                          src={student.photo || "/placeholder.svg?height=80&width=80&query=student"}
                          alt={student.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p
                          className={`font-semibold text-sm sm:text-base truncate ${isArchived ? "text-muted-foreground" : "text-foreground"}`}
                        >
                          {student.name}
                        </p>
                        <p className="text-xs sm:text-sm text-muted-foreground truncate">{student.responsible}</p>
                        <p className="text-xs sm:text-sm font-medium text-foreground mt-1">
                          {isArchived ? (
                            <span className="text-gray-500">AFASTADO</span>
                          ) : isScholarship ? (
                            <span className="text-blue-500">Bolsista - Isento</span>
                          ) : (
                            formatCurrency(payment?.value || student.monthlyValue)
                          )}
                        </p>
                        {payment?.dueDate && !isScholarship && !isArchived && (
                          <p className="text-xs text-muted-foreground mt-0.5">
                            Venc: {(() => {
                              const date = new Date(payment.dueDate)
                              // Força o dia para 10 na exibição
                              return `10/${String(date.getMonth() + 1).padStart(2, "0")}/${date.getFullYear()}`
                            })()}
                          </p>
                        )}
                        {isPaid && payment?.paymentType && (
                          <p className="text-xs text-green-600 mt-0.5 flex items-center gap-1">
                            {payment.paymentType === "dinheiro" ? (
                              <>
                                <Banknote className="h-3 w-3" /> Dinheiro
                              </>
                            ) : (
                              <>
                                <QrCode className="h-3 w-3" /> PIX
                              </>
                            )}
                          </p>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        {isArchived ? (
                          <PaymentStatusBadge status="AFASTADO" />
                        ) : (
                          <PaymentStatusBadge status={isScholarship ? "Bolsista" : payment?.status || "Em Aberto"} />
                        )}
                        {isPaid && payment?.paidAt && (
                          <p className="text-xs text-green-600">
                            Pago em {new Date(payment.paidAt).toLocaleDateString("pt-BR")}
                          </p>
                        )}
                      </div>
                    </div>

                    {isArchived && wasArchivedThisMonth && !isPaid && !isScholarship && (
                      <div className="flex flex-wrap gap-2 pt-2 border-t">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleExemptPayment(student.id, paymentMonth)}
                          className="gap-1 text-xs bg-transparent"
                        >
                          <ShieldOff className="h-3 w-3" />
                          Isentar Mensalidade
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleConfirmPayment(student.id, paymentMonth)}
                          className="gap-1 text-xs"
                        >
                          <Check className="h-3 w-3" />
                          Incluir Cobrança
                        </Button>
                      </div>
                    )}

                    {!isScholarship && !isArchived && (
                      <div className="flex flex-wrap gap-2 pt-2 border-t">
                        {!isPaid && (
                          <Button
                            size="sm"
                            onClick={() => handleConfirmPayment(student.id, paymentMonth)}
                            className="gap-1 text-xs"
                          >
                            <Check className="h-3 w-3" />
                            Confirmar Pagamento
                          </Button>
                        )}

                        {isPaid && payment?.receipt && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => viewReceipt(payment.receipt, student.name, paymentMonth)}
                              className="gap-1 text-xs bg-transparent"
                            >
                              <Eye className="h-3 w-3" />
                              Ver Comprovante
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDeleteReceipt(student.id, paymentMonth)}
                              className="gap-1 text-xs text-destructive hover:text-destructive bg-transparent"
                            >
                              <Trash2 className="h-3 w-3" />
                              Remover
                            </Button>
                          </>
                        )}

                        {!isPaid && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handlePostpone(student.id, paymentMonth)}
                              className="gap-1 text-xs bg-transparent"
                            >
                              <CalendarIcon className="h-3 w-3" />
                              Adiar
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                handleEditValue(student.id, paymentMonth, payment?.value || student.monthlyValue)
                              }
                              className="gap-1 text-xs bg-transparent"
                            >
                              <Edit className="h-3 w-3" />
                              Editar Valor
                            </Button>
                          </>
                        )}

                        {(isNotPaid || isOpen) && !isCharged && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleMarkAsCharged(student.id, paymentMonth)}
                            className="gap-1 text-xs text-amber-600 hover:text-amber-700 bg-transparent"
                          >
                            <Flag className="h-3 w-3" />
                            Marcar Cobrado
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </main>

      {/* Modals */}
      {showPostponeDialog && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md border-2">
            <CardHeader>
              <CardTitle>Adiar Pagamento</CardTitle>
              <CardDescription>Selecione uma nova data de vencimento</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal bg-transparent">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {postponeDate ? format(postponeDate, "PPP", { locale: ptBR }) : "Selecionar data"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar mode="single" selected={postponeDate} onSelect={setPostponeDate} locale={ptBR} />
                </PopoverContent>
              </Popover>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setShowPostponeDialog(false)} className="bg-transparent">
                  Cancelar
                </Button>
                <Button onClick={confirmPostpone} disabled={!postponeDate}>
                  Confirmar
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {showPaymentTypeDialog && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md border-2">
            <CardHeader>
              <CardTitle>Tipo de Pagamento</CardTitle>
              <CardDescription>Como o pagamento foi realizado?</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setSelectedPaymentType("dinheiro")}
                  className={`flex flex-col items-center justify-center p-6 rounded-lg border-2 transition-colors ${
                    selectedPaymentType === "dinheiro"
                      ? "border-green-500 bg-green-500/10"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <Banknote
                    className={`h-10 w-10 mb-2 ${selectedPaymentType === "dinheiro" ? "text-green-500" : "text-muted-foreground"}`}
                  />
                  <span
                    className={`font-medium ${selectedPaymentType === "dinheiro" ? "text-green-500" : "text-foreground"}`}
                  >
                    Dinheiro
                  </span>
                  <span className="text-xs text-muted-foreground mt-1">Marca direto</span>
                </button>
                <button
                  onClick={() => setSelectedPaymentType("pix")}
                  className={`flex flex-col items-center justify-center p-6 rounded-lg border-2 transition-colors ${
                    selectedPaymentType === "pix"
                      ? "border-green-500 bg-green-500/10"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <QrCode
                    className={`h-10 w-10 mb-2 ${selectedPaymentType === "pix" ? "text-green-500" : "text-muted-foreground"}`}
                  />
                  <span
                    className={`font-medium ${selectedPaymentType === "pix" ? "text-green-500" : "text-foreground"}`}
                  >
                    PIX
                  </span>
                  <span className="text-xs text-muted-foreground mt-1">Anexar comprovante</span>
                </button>
              </div>
              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowPaymentTypeDialog(false)
                    setSelectedPaymentType(null)
                  }}
                  className="bg-transparent"
                >
                  Cancelar
                </Button>
                <Button onClick={confirmPaymentType} disabled={!selectedPaymentType}>
                  Continuar
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
              <CardTitle>Editar Valor da Mensalidade</CardTitle>
              <CardDescription>Altere o valor para este mês específico</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Novo Valor (R$)</Label>
                <Input
                  type="number"
                  value={newMonthlyValue}
                  onChange={(e) => setNewMonthlyValue(e.target.value)}
                  placeholder="100.00"
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setShowEditValueDialog(false)} className="bg-transparent">
                  Cancelar
                </Button>
                <Button onClick={confirmEditValue} disabled={!newMonthlyValue}>
                  Salvar
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {showPendingModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl max-h-[80vh] overflow-hidden border-2">
            <CardHeader className="border-b">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-destructive">Alunos Pendentes</CardTitle>
                  <CardDescription>
                    {pendingCount} aluno(s) com pagamento pendente em {selectedMonth}/{selectedYear}
                  </CardDescription>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setShowPendingModal(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0 max-h-[60vh] overflow-y-auto">
              {pendingStudents.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  <Check className="h-12 w-12 mx-auto mb-3 text-green-500" />
                  <p className="font-medium">Nenhum pagamento pendente!</p>
                  <p className="text-sm">Todos os alunos estão em dia neste período</p>
                </div>
              ) : (
                pendingStudents.map(({ student, payment }) => {
                  const paymentMonth = payment?.month || formatMonthYearFromNumbers(selectedMonthNumber, selectedYear)
                  const allPendingPayments = getPendingPaymentsInfo(student.payments)

                  return (
                    <div key={student.id} className="flex items-center justify-between p-4 border-b hover:bg-accent/50">
                      <div className="flex items-center gap-3">
                        <div className="relative h-10 w-10 rounded-full overflow-hidden bg-primary/10">
                          <Image
                            src={student.photo || "/placeholder.svg?height=40&width=40&query=student"}
                            alt={student.name}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{student.name}</p>
                          <p className="text-sm text-muted-foreground">{student.responsible}</p>
                          {allPendingPayments.length > 1 && (
                            <p className="text-xs text-destructive mt-0.5">
                              {allPendingPayments.length} mensalidades pendentes
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className="font-semibold text-foreground">
                            {formatCurrency(payment?.value || student.monthlyValue)}
                          </p>
                          <PaymentStatusBadge status={payment?.status || "Não Pagou"} />
                        </div>
                        <Button
                          size="sm"
                          onClick={() => handleWhatsAppCharge(student.id)}
                          className="bg-green-600 hover:bg-green-700"
                          title="Cobrar via WhatsApp"
                        >
                          <MessageCircle className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )
                })
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {showWhatsAppDialog && whatsAppStudent && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md border-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5 text-green-600" />
                Escolher Telefone
              </CardTitle>
              <CardDescription>Para qual número deseja enviar a cobrança?</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                {whatsAppStudent.fatherPhone && (
                  <Button
                    variant="outline"
                    className="w-full justify-start gap-3 h-auto py-3 bg-transparent"
                    onClick={() => sendWhatsAppMessage(whatsAppStudent, whatsAppStudent.fatherPhone)}
                  >
                    <Phone className="h-4 w-4" />
                    <div className="text-left">
                      <p className="font-medium">Telefone do Pai</p>
                      <p className="text-sm text-muted-foreground">{whatsAppStudent.fatherPhone}</p>
                    </div>
                  </Button>
                )}
                {whatsAppStudent.motherPhone && (
                  <Button
                    variant="outline"
                    className="w-full justify-start gap-3 h-auto py-3 bg-transparent"
                    onClick={() => sendWhatsAppMessage(whatsAppStudent, whatsAppStudent.motherPhone)}
                  >
                    <Phone className="h-4 w-4" />
                    <div className="text-left">
                      <p className="font-medium">Telefone da Mãe</p>
                      <p className="text-sm text-muted-foreground">{whatsAppStudent.motherPhone}</p>
                    </div>
                  </Button>
                )}
              </div>
              <div className="flex justify-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowWhatsAppDialog(false)
                    setWhatsAppStudent(null)
                  }}
                  className="bg-transparent"
                >
                  Cancelar
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {showPaymentSplash && paymentSplashData && (
        <PaymentSplash
          isOpen={showPaymentSplash}
          studentName={paymentSplashData.studentName}
          studentPhoto={paymentSplashData.studentPhoto}
          paymentType={paymentSplashData.paymentType}
          onComplete={handlePaymentSplashComplete}
        />
      )}

      <ReceiptViewerModal
        isOpen={receiptModal.isOpen}
        onClose={() => setReceiptModal({ isOpen: false, receipt: "", studentName: "", month: "" })}
        receipt={receiptModal.receipt}
        studentName={receiptModal.studentName}
        month={receiptModal.month}
      />
    </div>
  )
}
