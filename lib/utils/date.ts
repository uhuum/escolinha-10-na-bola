/**
 * Get current date in the browser timezone
 * Always returns the actual current date, not hardcoded
 */
export function getCurrentDate(): Date {
  return new Date()
}

/**
 * Get today's date in YYYY-MM-DD format using LOCAL timezone
 * Added this function to ensure consistent date format matching browser's local date
 */
export function getTodayDateString(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, "0")
  const day = String(now.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

/**
 * Get the current month name in Portuguese
 */
export function getCurrentMonthName(): string {
  const months = [
    "Janeiro",
    "Fevereiro",
    "Março",
    "Abril",
    "Maio",
    "Junho",
    "Julho",
    "Agosto",
    "Setembro",
    "Outubro",
    "Novembro",
    "Dezembro",
  ]
  return months[new Date().getMonth()]
}

/**
 * Get the current day of the month
 */
export function getCurrentDay(): number {
  return new Date().getDate()
}

/**
 * Format date with timezone support for timestamp logging
 */
export function getTimestampISO(): string {
  return new Date().toISOString()
}

/**
 * Get month name from index (0-11)
 */
export function getMonthName(monthIndex: number): string {
  const months = [
    "Janeiro",
    "Fevereiro",
    "Março",
    "Abril",
    "Maio",
    "Junho",
    "Julho",
    "Agosto",
    "Setembro",
    "Outubro",
    "Novembro",
    "Dezembro",
  ]
  return months[monthIndex]
}

export function getMonthNameFromNumber(monthNumber: number): string {
  const months = [
    "Janeiro",
    "Fevereiro",
    "Março",
    "Abril",
    "Maio",
    "Junho",
    "Julho",
    "Agosto",
    "Setembro",
    "Outubro",
    "Novembro",
    "Dezembro",
  ]
  return months[monthNumber - 1] || "Desconhecido"
}

export function getMonthNumberFromName(monthName: string): number {
  const months: Record<string, number> = {
    janeiro: 1,
    fevereiro: 2,
    março: 3,
    marco: 3,
    abril: 4,
    maio: 5,
    junho: 6,
    julho: 7,
    agosto: 8,
    setembro: 9,
    outubro: 10,
    novembro: 11,
    dezembro: 12,
  }
  return months[monthName.toLowerCase()] || 0
}

/**
 * Get current month index (0-11)
 */
export function getCurrentMonthIndex(): number {
  return new Date().getMonth()
}

export function getCurrentMonthNumber(): number {
  return new Date().getMonth() + 1
}

/**
 * Get all month names array
 */
export function getAllMonths(): string[] {
  return [
    "Janeiro",
    "Fevereiro",
    "Março",
    "Abril",
    "Maio",
    "Junho",
    "Julho",
    "Agosto",
    "Setembro",
    "Outubro",
    "Novembro",
    "Dezembro",
  ]
}

/**
 * Get the current year
 */
export function getCurrentYear(): number {
  return new Date().getFullYear()
}

/**
 * Get array of available years (from 2024 to current year + 1)
 */
export function getAvailableYears(): number[] {
  const currentYear = getCurrentYear()
  const years: number[] = []
  // Mostrar anos desde 2024 até o ano atual + 1
  for (let year = 2024; year <= currentYear + 1; year++) {
    years.push(year)
  }
  return years
}

/**
 * Parse month string to extract month name and year
 * Supports both old format "Janeiro" and new format "Janeiro/2025"
 */
export function parseMonthYear(monthString: string): { month: string; year: number | null } {
  if (monthString.includes("/")) {
    const [month, yearStr] = monthString.split("/")
    return { month, year: Number.parseInt(yearStr, 10) }
  }
  // Old format - month only, no year
  return { month: monthString, year: null }
}

/**
 * Format month and year into string "Mês/Ano"
 */
export function formatMonthYear(month: string, year: number): string {
  return `${month}/${year}`
}

export function formatMonthYearFromNumbers(monthNumber: number, yearNumber: number): string {
  return `${getMonthNameFromNumber(monthNumber)}/${yearNumber}`
}

/**
 * Check if a payment month matches the selected month and year
 * Handles both old format (month only) and new format (month/year)
 */
export function matchesMonthYear(paymentMonth: string, selectedMonth: string, selectedYear: number): boolean {
  const parsed = parseMonthYear(paymentMonth)

  // If the payment has year info, match exactly
  if (parsed.year !== null) {
    return parsed.month === selectedMonth && parsed.year === selectedYear
  }

  // If payment doesn't have year (old format), assume it's from the current year
  // This means old payments without year will only show in the current year
  const currentYear = getCurrentYear()
  return parsed.month === selectedMonth && selectedYear === currentYear
}

export function matchesMonthYearByNumbers(
  payment: { monthNumber?: number; yearNumber?: number; month?: string },
  selectedMonthNumber: number,
  selectedYearNumber: number,
): boolean {
  // Preferir usar os novos campos
  if (payment.monthNumber !== undefined && payment.yearNumber !== undefined) {
    return payment.monthNumber === selectedMonthNumber && payment.yearNumber === selectedYearNumber
  }

  // Fallback para formato antigo
  if (payment.month) {
    const monthName = getMonthNameFromNumber(selectedMonthNumber)
    return matchesMonthYear(payment.month, monthName, selectedYearNumber)
  }

  return false
}

export function createDueDate(yearNumber: number, monthNumber: number, day = 10): string {
  const date = new Date(yearNumber, monthNumber - 1, day)
  return date.toISOString().split("T")[0]
}

export function formatDueDate(dueDate: string | Date): string {
  const date = typeof dueDate === "string" ? new Date(dueDate) : dueDate
  const day = date.getDate().toString().padStart(2, "0")
  const month = (date.getMonth() + 1).toString().padStart(2, "0")
  const year = date.getFullYear()
  return `${day}/${month}/${year}`
}

export function extractMonthYearFromDueDate(dueDate: string | Date): { monthNumber: number; yearNumber: number } {
  const date = typeof dueDate === "string" ? new Date(dueDate) : dueDate
  return {
    monthNumber: date.getMonth() + 1,
    yearNumber: date.getFullYear(),
  }
}

export function isPaymentOverdue(dueDate: string | Date): boolean {
  const date = typeof dueDate === "string" ? new Date(dueDate) : dueDate
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return date < today
}

export function getMonthsInRange(
  startYear: number,
  startMonth: number,
  endYear: number,
  endMonth: number,
): Array<{ monthNumber: number; yearNumber: number; label: string }> {
  const months: Array<{ monthNumber: number; yearNumber: number; label: string }> = []

  let currentYear = startYear
  let currentMonth = startMonth

  while (currentYear < endYear || (currentYear === endYear && currentMonth <= endMonth)) {
    months.push({
      monthNumber: currentMonth,
      yearNumber: currentYear,
      label: formatMonthYearFromNumbers(currentMonth, currentYear),
    })

    currentMonth++
    if (currentMonth > 12) {
      currentMonth = 1
      currentYear++
    }
  }

  return months
}
