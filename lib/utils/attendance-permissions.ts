import { getTodayDateString } from "./date"
import type { Attendance } from "../types"

interface User {
  id: string
  role: "admin" | "coach"
}

/**
 * Check if a user can edit an attendance record
 * Rules:
 * - Admin: CANNOT edit any attendance
 * - Coach: Can edit ONLY their own attendance AND only on the same day
 */
export function canEditAttendance(attendance: Attendance, user: User | null): boolean {
  if (!user) return false

  // Admin cannot edit attendance
  if (user.role === "admin") return false

  // Coach can only edit their own attendance
  if (attendance.trainerId !== user.id) return false

  // Coach can only edit on the same day
  const today = getTodayDateString()
  if (attendance.date !== today) return false

  return true
}

/**
 * Get the reason why editing is not allowed
 */
export function getEditDisabledReason(attendance: Attendance, user: User | null): string | null {
  if (!user) return "Você precisa estar logado"

  if (user.role === "admin") {
    return "Administradores não podem editar chamadas"
  }

  if (attendance.trainerId !== user.id) {
    return "Apenas o treinador que criou a chamada pode editá-la"
  }

  const today = getTodayDateString()
  if (attendance.date !== today) {
    return "Chamadas só podem ser editadas no mesmo dia"
  }

  return null
}
