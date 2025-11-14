export type PaymentStatus = "Pago" | "Não Pagou" | "Bolsista" | "AFASTADO" | "Novo" | "Cobrado" | "Adiado" | "Em Aberto"

export type ClassSchedule = "18:00-19:30" | "19:30-21:00"

export type WeekDay = "Segunda" | "Terça" | "Quarta" | "Quinta" | "Sexta"

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
  classSchedule?: ClassSchedule
  classDays?: WeekDay[]
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
  date: string // ISO date string
  dayOfWeek: string // Added day of week field
  classSchedule: ClassSchedule
  classDays: WeekDay[]
  trainerName: string
  records: AttendanceRecord[]
  createdAt: string // timestamp
}

export interface AttendanceByDate {
  date: string
  classSchedule: ClassSchedule
  attendances: Attendance[]
}
