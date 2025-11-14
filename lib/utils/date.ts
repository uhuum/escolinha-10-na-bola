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

/**
 * Get current month index (0-11)
 */
export function getCurrentMonthIndex(): number {
  return new Date().getMonth()
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
