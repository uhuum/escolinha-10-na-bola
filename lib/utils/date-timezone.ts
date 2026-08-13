/**
 * Utility to handle date strings without timezone conversion
 * Fixes the issue where birthdate gets offset by 1 day due to timezone conversion
 */

export function parseLocalDate(dateString: string): Date {
  // Parse date string as local date without timezone conversion
  const [year, month, day] = dateString.split("-").map(Number)
  return new Date(year, month - 1, day)
}

export function formatDateForStorage(date: Date): string {
  // Format date as YYYY-MM-DD for storage (always local time)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

export function getDayOfMonthLocal(dateStr: string): number {
  // Get day of month from a date string without timezone issues
  const date = parseLocalDate(dateStr)
  return date.getDate()
}

export function getMonthFromDateLocal(dateStr: string): number {
  // Get month (0-11) from a date string without timezone issues
  const date = parseLocalDate(dateStr)
  return date.getMonth()
}

export function getAgeLocal(dateStr: string): number {
  // Calculate age using local date parsing
  const today = new Date()
  const birthDate = parseLocalDate(dateStr)

  let age = today.getFullYear() - birthDate.getFullYear()
  const monthDiff = today.getMonth() - birthDate.getMonth()

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--
  }

  return age
}
