import type { Attendance } from "../types"

interface User {
  id: string
  role: "admin" | "coach"
}

// Compare the calendar date of the lesson in São Paulo, not UTC or the
// device time zone, so access expires at 23:59:59 of the following day.
function getAllowedAttendanceDates(now = new Date()): { today: string; yesterday: string } {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now)
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]))
  const year = Number(values.year)
  const month = Number(values.month)
  const day = Number(values.day)
  const today = `${values.year}-${values.month}-${values.day}`
  const previous = new Date(Date.UTC(year, month - 1, day - 1, 12))
  return { today, yesterday: previous.toISOString().slice(0, 10) }
}

/**
 * Only the coach who registered a call can correct it on that day or the
 * following calendar day (São Paulo). Administrators remain read-only here.
 */
export function canEditAttendance(attendance: Attendance, user: User | null): boolean {
  if (!user || user.role !== "coach" || attendance.trainerId !== user.id) return false
  const { today, yesterday } = getAllowedAttendanceDates()
  return attendance.date === today || attendance.date === yesterday
}

export function getEditDisabledReason(attendance: Attendance, user: User | null): string | null {
  if (!user) return "Você precisa estar logado"
  if (user.role === "admin") return "Administradores não podem editar chamadas"
  if (attendance.trainerId !== user.id) {
    return "Apenas o treinador que criou a chamada pode editá-la"
  }

  const { today, yesterday } = getAllowedAttendanceDates()
  if (attendance.date !== today && attendance.date !== yesterday) {
    return "O prazo terminou. A chamada pode ser corrigida até 23h59 do dia seguinte ao treino."
  }
  return null
}
