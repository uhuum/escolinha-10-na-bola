import type { MonthlyPayment, PaymentStatus, PaymentReport, Student } from "../types"
import {
  getMonthNameFromNumber,
  getCurrentYear,
  getCurrentMonthNumber,
  getCurrentDay,
  getMonthNumberFromName,
} from "./date"

export const BASE_YEAR = 2025
export const BASE_MONTH = 12 // December

/**
 * Determinar status automático baseado na data de vencimento
 */
export function determinePaymentStatus(
  monthNumber: number,
  yearNumber: number,
  currentStatus: PaymentStatus,
  hasReceipt: boolean,
): PaymentStatus {
  // Se já está pago ou tem comprovante, manter como Pago
  if (currentStatus === "Pago" || hasReceipt) {
    return "Pago"
  }

  // Bolsista não muda
  if (currentStatus === "Bolsista") {
    return "Bolsista"
  }

  // Adiado não muda automaticamente
  if (currentStatus === "Adiado") {
    return "Adiado"
  }

  const currentMonthNum = getCurrentMonthNumber()
  const currentYearNum = getCurrentYear()
  const currentDay = getCurrentDay()

  // Verificar se é o mês atual
  const isCurrentMonth = monthNumber === currentMonthNum && yearNumber === currentYearNum

  // Verificar se é mês passado
  const isPastMonth = yearNumber < currentYearNum || (yearNumber === currentYearNum && monthNumber < currentMonthNum)

  if (isCurrentMonth) {
    // Entre dia 1 e 10: "Em Aberto"
    if (currentDay >= 1 && currentDay <= 10) {
      if (currentStatus === "Cobrado") {
        return "Cobrado"
      }
      return "Em Aberto"
    }
    // Após dia 10: "Não Pagou" (se não estava cobrado)
    if (currentDay > 10) {
      if (currentStatus === "Cobrado") {
        return "Cobrado"
      }
      return "Não Pagou"
    }
  }

  // Se é mês passado e não está pago
  if (isPastMonth) {
    if (currentStatus === "Cobrado") {
      return "Cobrado"
    }
    return "Não Pagou"
  }

  // Mês futuro
  return currentStatus === "Em Aberto" ? "Em Aberto" : currentStatus
}

/**
 * Verificar se pagamento está pendente (não conta "Em Aberto")
 */
export function isPaymentPending(status: PaymentStatus): boolean {
  return status === "Não Pagou" || status === "Cobrado"
}

/**
 * Verificar se pagamento está em aberto (não é pendente)
 */
export function isPaymentOpen(status: PaymentStatus): boolean {
  return status === "Em Aberto"
}

/**
 * Formatar mês/ano para exibição
 */
export function formatPaymentPeriod(payment: MonthlyPayment): string {
  if (payment.monthNumber && payment.yearNumber) {
    return `${getMonthNameFromNumber(payment.monthNumber)}/${payment.yearNumber}`
  }
  return payment.month
}

/**
 * Verificar se pagamento pertence a um período específico
 */
export function isPaymentInPeriod(payment: MonthlyPayment, monthNumber: number, yearNumber: number): boolean {
  if (payment.monthNumber !== undefined && payment.yearNumber !== undefined) {
    return payment.monthNumber === monthNumber && payment.yearNumber === yearNumber
  }

  // Fallback para formato antigo
  const parsed = parseMonthFromString(payment.month)
  return parsed.monthNumber === monthNumber && parsed.yearNumber === yearNumber
}

/**
 * Parsear string de mês para números
 */
export function parseMonthFromString(monthString: string): {
  monthNumber: number
  yearNumber: number
} {
  if (monthString.includes("/")) {
    const [monthName, yearStr] = monthString.split("/")
    return {
      monthNumber: getMonthNumberFromName(monthName),
      yearNumber: Number.parseInt(yearStr, 10) || getCurrentYear(),
    }
  }

  // Formato antigo sem ano
  return {
    monthNumber: getMonthNumberFromName(monthString),
    yearNumber: getCurrentYear(),
  }
}

/**
 * Calcular resumo de pagamentos para um período
 */
export function calculatePaymentSummary(
  payments: MonthlyPayment[],
  monthNumber: number,
  yearNumber: number,
): {
  paid: number
  pending: number
  overdue: number
  total: number
} {
  const periodPayments = payments.filter((p) => isPaymentInPeriod(p, monthNumber, yearNumber))

  return {
    paid: periodPayments.filter((p) => p.status === "Pago").length,
    pending: periodPayments.filter((p) => p.status === "Em Aberto").length,
    overdue: periodPayments.filter((p) => p.status === "Não Pagou" || p.status === "Cobrado").length,
    total: periodPayments.length,
  }
}

/**
 * Gerar relatório de pagamentos mensais
 */
export function generateMonthlyPaymentReport(
  payments: MonthlyPayment[],
  monthNumber: number,
  yearNumber: number,
): PaymentReport {
  const periodPayments = payments.filter((p) => isPaymentInPeriod(p, monthNumber, yearNumber))

  const paidPayments = periodPayments.filter((p) => p.status === "Pago")
  const pendingPayments = periodPayments.filter(
    (p) => p.status === "Não Pagou" || p.status === "Cobrado" || p.status === "Em Aberto",
  )
  const scholarshipPayments = periodPayments.filter((p) => p.status === "Bolsista")

  const totalReceived = paidPayments.reduce((sum, p) => sum + (p.value || 0), 0)
  const totalExpected = periodPayments
    .filter((p) => p.status !== "Bolsista")
    .reduce((sum, p) => sum + (p.value || 0), 0)

  return {
    month: getMonthNameFromNumber(monthNumber),
    monthNumber,
    yearNumber,
    totalExpected,
    totalReceived,
    totalPending: totalExpected - totalReceived,
    paidCount: paidPayments.length,
    pendingCount: pendingPayments.length,
    scholarshipCount: scholarshipPayments.length,
  }
}

/**
 * Ordenar pagamentos por ano e mês (mais recente primeiro)
 * Default order changed to "asc" (oldest first)
 */
export function sortPaymentsByDueDate(payments: MonthlyPayment[], order: "asc" | "desc" = "asc"): MonthlyPayment[] {
  return [...payments].sort((a, b) => {
    // Usar monthNumber e yearNumber
    if (
      a.monthNumber !== undefined &&
      a.yearNumber !== undefined &&
      b.monthNumber !== undefined &&
      b.yearNumber !== undefined
    ) {
      const valueA = a.yearNumber * 100 + a.monthNumber
      const valueB = b.yearNumber * 100 + b.monthNumber
      return order === "asc" ? valueA - valueB : valueB - valueA
    }

    // Fallback para dueDate
    if (a.dueDate && b.dueDate) {
      const dateA = new Date(a.dueDate).getTime()
      const dateB = new Date(b.dueDate).getTime()
      return order === "asc" ? dateA - dateB : dateB - dateA
    }

    return 0
  })
}

/**
 * Filtrar pagamentos por status
 */
export function filterPaymentsByStatus(payments: MonthlyPayment[], statuses: PaymentStatus[]): MonthlyPayment[] {
  return payments.filter((p) => statuses.includes(p.status))
}

/**
 * Verificar se há pagamentos pendentes (não conta "Em Aberto")
 */
export function hasOverduePayments(payments: MonthlyPayment[]): boolean {
  return payments.some((p) => p.status === "Não Pagou" || p.status === "Cobrado")
}

/**
 * Obter todos os pagamentos pendentes de um aluno com mês/ano
 * Only count "Não Pagou" and "Cobrado" statuses
 */
export function getPendingPaymentsInfo(payments: MonthlyPayment[]): { month: string; value: number }[] {
  const currentMonthNum = getCurrentMonthNumber()
  const currentYearNum = getCurrentYear()

  return payments
    .filter((p) => {
      // Only "Não Pagou" or "Cobrado"
      if (p.status !== "Não Pagou" && p.status !== "Cobrado") return false

      // Must be from base date onwards
      if (!isPaymentFromBaseDate(p)) return false

      // Must be up to current month
      if (p.monthNumber !== undefined && p.yearNumber !== undefined) {
        if (p.yearNumber > currentYearNum) return false
        if (p.yearNumber === currentYearNum && p.monthNumber > currentMonthNum) return false
      }

      return true
    })
    .map((p) => ({
      month: formatPaymentPeriod(p),
      value: p.value,
    }))
}

/**
 * Filter payments only up to current month for student history
 */
export function filterPaymentsUpToCurrentMonth(payments: MonthlyPayment[]): MonthlyPayment[] {
  const currentMonthNum = getCurrentMonthNumber()
  const currentYearNum = getCurrentYear()

  return payments.filter((p) => {
    if (p.monthNumber !== undefined && p.yearNumber !== undefined) {
      // Only show up to current month
      if (p.yearNumber < currentYearNum) return true
      if (p.yearNumber === currentYearNum && p.monthNumber <= currentMonthNum) return true
      return false
    }
    return true
  })
}

/**
 * Check if payment is from December 2025 or later (base date)
 */
export function isPaymentFromBaseDate(payment: MonthlyPayment): boolean {
  if (payment.monthNumber !== undefined && payment.yearNumber !== undefined) {
    if (payment.yearNumber > BASE_YEAR) return true
    if (payment.yearNumber === BASE_YEAR && payment.monthNumber >= BASE_MONTH) return true
    return false
  }
  return true
}

/**
 * Filter payments from December 2025 onwards (for payments page and dashboard)
 */
export function filterPaymentsFromBaseDate(payments: MonthlyPayment[]): MonthlyPayment[] {
  return payments.filter(isPaymentFromBaseDate)
}

/**
 * Gerar mensagem de cobrança via WhatsApp
 */
export function generateWhatsAppMessage(
  studentName: string,
  responsibleName: string,
  pendingPayments: { month: string; value: number }[],
  pixKey: string,
): string {
  const totalValue = pendingPayments.reduce((sum, p) => sum + p.value, 0)
  const monthsList = pendingPayments.map((p) => `• ${p.month}`).join("\n")

  const message = `Olá, ${responsibleName}!

Verificamos que o(a) aluno(a) *${studentName}* possui *${pendingPayments.length} mensalidade(s) pendente(s)*:

${monthsList}

*Valor total: R$ ${totalValue.toFixed(2).replace(".", ",")}*

Para realizar o pagamento via PIX:
*Chave CNPJ: ${pixKey}*

Pedimos desculpas caso o pagamento já tenha sido efetuado. Nesse caso, por gentileza, nos envie o comprovante novamente para darmos baixa no sistema.

Atenciosamente,
*Equipe 10 na Bola*`

  return encodeURIComponent(message)
}

/**
 * Generate PDF report data
 */
export interface PDFReportData {
  studentName: string
  responsible: string
  phone: string
  monthYear: string
  status: string
  value: number
  isArchived: boolean
  isExempt: boolean
}

export function generatePDFReportData(
  students: Student[],
  selectedMonthNumber: number,
  selectedYear: number,
): PDFReportData[] {
  const reportData: PDFReportData[] = []

  students.forEach((student) => {
    const payment = student.payments.find((p) => p.monthNumber === selectedMonthNumber && p.yearNumber === selectedYear)

    if (!payment) return

    const isArchived = !student.isActive || !!student.archivedAt
    const isExempt = student.isScholarship || student.monthlyValue === 0 || payment.status === "Bolsista"

    reportData.push({
      studentName: student.name,
      responsible: student.responsible,
      phone: student.fatherPhone || student.motherPhone || "-",
      monthYear: `${getMonthNameFromNumber(selectedMonthNumber)}/${selectedYear}`,
      status: isArchived ? "AFASTADO" : payment.status,
      value: payment.value || student.monthlyValue,
      isArchived,
      isExempt,
    })
  })

  return reportData.sort((a, b) => a.studentName.localeCompare(b.studentName, "pt-BR"))
}
