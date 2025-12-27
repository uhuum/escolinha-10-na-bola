export type PaymentStatus = "Pago" | "Não Pagou" | "Bolsista" | "AFASTADO" | "Novo" | "Cobrado" | "Adiado" | "Em Aberto"

export type ClassSchedule = "18:00-19:30" | "19:30-21:00"

export type WeekDay = "Segunda" | "Terça" | "Quarta" | "Quinta" | "Sexta"

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
  scheduleConfigs?: DayScheduleConfig[]
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
