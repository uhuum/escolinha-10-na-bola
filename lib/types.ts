export type PaymentStatus = "Pago" | "Não Pagou" | "Bolsista" | "AFASTADO" | "Novo" | "Cobrado" | "Adiado" | "Em Aberto"

export type ClassSchedule = "18:00-19:30" | "19:30-21:00"

export type WeekDay = "Segunda" | "Terça" | "Quarta" | "Quinta" | "Sexta"

export type PaymentType = "dinheiro" | "pix"

export interface DayScheduleConfig {
  day: WeekDay
  schedule: ClassSchedule
}

export interface TrainerProfile {
  id: string
  username: string
  managedSchedules: ClassSchedule[]
  managedDays: WeekDay[]
}

export interface MonthlyPayment {
  month: string
  status: PaymentStatus
  value: number
  postponedTo?: string
  receipt?: string | File
  paidAt?: string
  chargedAt?: string
  dueDate?: string // DATE em formato ISO
  monthNumber?: number // 1-12
  yearNumber?: number // ex: 2025, 2026
  paymentType?: PaymentType // "dinheiro" ou "pix"
}

export interface Student {
  id: string
  name: string
  rg: string
  birthDate: string
  responsible: string
  responsibleCpf: string
  responsibleEmail: string
  fatherPhone: string
  motherPhone: string
  monthlyValue: number
  payments: MonthlyPayment[]
  photo?: string
  isActive: boolean
  isScholarship?: boolean
  classSchedule?: ClassSchedule
  classDays?: WeekDay[]
  archivedAt?: string
  archiveReason?: string
  registrationDate?: string // Added registrationDate field
}

export interface PaymentSummary {
  totalStudents: number
  activeStudents: number
  totalExpected: number
  totalReceived: number
  pendingPayments: number
  scholarshipStudents: number
}

export interface AttendanceRecord {
  studentId: string
  status: "Presente" | "Ausente"
}

export interface Attendance {
  id: string
  date: string
  dayOfWeek: string
  classSchedule: ClassSchedule
  classDays: WeekDay[]
  trainerName: string
  trainerId: string // ID of the trainer who created this attendance
  records: AttendanceRecord[]
  createdAt: string
}

export interface AttendanceByDate {
  date: string
  classSchedule: ClassSchedule
  attendances: Attendance[]
}

export interface ActivityLog {
  id: string
  type: "payment" | "student_added" | "student_archived" | "student_deleted" | "attendance" | "receipt_uploaded"
  description: string
  studentId?: string
  studentName?: string
  month?: string
  year?: number
  createdAt: string
  metadata?: Record<string, any>
}

export interface PaymentFilter {
  monthNumber?: number
  yearNumber?: number
  status?: PaymentStatus
  studentId?: string
}

export interface PaymentReport {
  month: string
  monthNumber: number
  yearNumber: number
  totalExpected: number
  totalReceived: number
  totalPending: number
  paidCount: number
  pendingCount: number
  scholarshipCount: number
}
