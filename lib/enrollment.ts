export type EnrollmentStatus = "invited" | "pending" | "approved" | "cancelled"

export interface EnrollmentFormData {
  name: string
  document: string
  documentType?: "RG" | "CPF"
  birthDate: string
  responsible: string
  responsibleCpf: string
  phone: string
  fatherPhone?: string
  motherPhone?: string
  email: string
  emergencyName: string
  emergencyPhone: string
  healthNote: string
  healthAnswer?: "sim" | "nao"
  planDays?: 1 | 2
  monthlyValue?: number
  scheduleConfigs?: Array<{ day: string; schedule: string }>
  dueDay: number
}

export interface EnrollmentRequest {
  id: string
  label: string
  status: EnrollmentStatus
  created_at: string
  expires_at: string
  submitted_at: string | null
  approved_at: string | null
  student_id: string | null
  payload: EnrollmentFormData | null
  approval: { monthlyValue: number; dueDay: number; category: string; scheduleConfigs: Array<{ day: string; schedule: string }> } | null
}

export const WEEK_DAYS = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta"] as const
export const TRAINING_TIMES = ["18:00-19:30", "19:30-21:00"] as const

export async function hashInvitationToken(token: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token))
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("")
}

export function createInvitationToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32))
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("")
}

export function onlyDigits(value: string) {
  return value.replace(/[^0-9]/g, "")
}

export function displayDate(value: string) {
  return new Date(value).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "America/Sao_Paulo" })
}
