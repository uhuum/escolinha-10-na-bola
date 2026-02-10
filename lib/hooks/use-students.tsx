"use client"

import { useState, useEffect, useCallback } from "react"
import { getBrowserClient } from "@/lib/supabase/client"
import type { Student, PaymentStatus, PaymentSummary, MonthlyPayment, PaymentType } from "../types"
import {
  matchesMonthYear,
  getCurrentYear,
  getMonthNameFromNumber,
  getMonthNumberFromName,
  createDueDate,
  matchesMonthYearByNumbers,
} from "@/lib/utils/date"

interface StudentsStore {
  students: Student[]
  isLoading: boolean
  updatePaymentStatus: (studentId: string, month: string, status: PaymentStatus) => Promise<void>
  postponePayment: (studentId: string, month: string, newDate: string) => Promise<void>
  attachReceipt: (studentId: string, month: string, receipt: File | string, paymentType?: PaymentType) => Promise<void>
  deleteReceipt: (studentId: string, month: string) => Promise<void>
  updateMonthlyValue: (studentId: string, month: string, newValue: number) => Promise<void>
  addStudent: (student: Omit<Student, "id"> | Student) => Promise<void>
  updateStudent: (studentId: string, updates: Partial<Student>) => Promise<void>
  deleteStudent: (studentId: string) => Promise<void>
  archiveStudent: (studentId: string, reason?: string) => Promise<void>
  restoreStudent: (studentId: string) => Promise<void>
  importStudents: (students: Omit<Student, "id">[]) => Promise<void>
  getStudent: (id: string) => Promise<Student | null>
  getPaymentSummary: (month?: string, year?: number) => PaymentSummary
  searchStudents: (query: string) => Student[]
  filterByPaymentStatus: (status: PaymentStatus, month: string, year?: number) => Student[]
  getMonthlyReport: (
    month: string,
    year?: number,
  ) => {
    totalReceived: number
    pendingAmount: number
    defaultedStudents: Student[]
    newStudents: Student[]
  }
  updatePaymentStatusByDate: (
    studentId: string,
    monthNumber: number,
    yearNumber: number,
    status: PaymentStatus,
  ) => Promise<void>
  attachReceiptByDate: (
    studentId: string,
    monthNumber: number,
    yearNumber: number,
    receipt: File | string,
  ) => Promise<void>
  generateStudentPayments: (
    studentId: string,
    monthlyValue: number,
    isScholarship?: boolean,
    registrationDate?: string,
  ) => Promise<void>
  markAsPaidCash: (studentId: string, month: string) => Promise<void>
  exemptPayment: (studentId: string, month: string) => Promise<void>
}

function mapPaymentFromDB(p: any): MonthlyPayment {
  return {
    month: p.month,
    status: p.status,
    value: p.value,
    receipt: p.receipt || undefined,
    paidAt: p.paid_at || undefined,
    postponedTo: p.postponed_to || undefined,
    chargedAt: p.charged_at || undefined,
    dueDate: p.due_date || undefined,
    monthNumber: p.month_number || undefined,
    yearNumber: p.year_number || undefined,
    paymentType: p.payment_type || undefined,
  }
}

function mapStudentFromDB(dbStudent: any, payments: MonthlyPayment[]): Student {
  return {
    id: dbStudent.id,
    name: dbStudent.name,
    rg: dbStudent.rg || "",
    birthDate: dbStudent.birth_date || "",
    responsible: dbStudent.responsible,
    responsibleCpf: dbStudent.responsible_cpf || "",
    responsibleEmail: dbStudent.responsible_email || "",
    fatherPhone: dbStudent.father_phone || "",
    motherPhone: dbStudent.mother_phone || "",
    monthlyValue: dbStudent.monthly_value || 0,
    isActive: dbStudent.is_active ?? true,
    isScholarship: dbStudent.is_scholarship ?? false,
    classSchedule: dbStudent.class_schedule || undefined,
    classDays: dbStudent.class_days || [],
    scheduleConfigs: dbStudent.schedule_configs || undefined,
    photo: dbStudent.photo || undefined,
    archivedAt: dbStudent.archived_at || undefined,
    archiveReason: dbStudent.archive_reason || undefined,
    registrationDate: dbStudent.registration_date || dbStudent.created_at || undefined,
    payments,
  }
}

export function useStudents(): StudentsStore {
  const [students, setStudents] = useState<Student[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const supabase = getBrowserClient()

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        setIsLoading(true)

        const { data: studentsData, error: studentError } = await supabase
          .from("students")
          .select("*")
          .order("name", { ascending: true })

        if (studentError) throw studentError

        const { data: paymentsData, error: paymentsError } = await supabase
          .from("payments")
          .select("*")
          .order("due_date", { ascending: true })
        if (paymentsError) throw paymentsError

        const sortedStudents = (studentsData || []).sort((a, b) =>
          a.name.localeCompare(b.name, "pt-BR", { sensitivity: "base" }),
        )

        const studentsWithPayments: Student[] = sortedStudents.map((dbStudent: any) => {
          const studentPayments = (paymentsData || [])
            .filter((p: any) => p.student_id === dbStudent.id)
            .map(mapPaymentFromDB)

          return mapStudentFromDB(dbStudent, studentPayments)
        })

        setStudents(studentsWithPayments)
      } catch (error) {
        console.error("[v0] Error fetching students:", error)
        alert("Erro ao carregar alunos: " + (error instanceof Error ? error.message : String(error)))
      } finally {
        setIsLoading(false)
      }
    }

    fetchStudents()
  }, [supabase])

  const refreshStudents = useCallback(async () => {
    try {
      const { data: studentsData } = await supabase.from("students").select("*").order("name", { ascending: true })
      const { data: paymentsData } = await supabase.from("payments").select("*").order("due_date", { ascending: true })

      const sortedStudents = (studentsData || []).sort((a, b) =>
        a.name.localeCompare(b.name, "pt-BR", { sensitivity: "base" }),
      )

      const studentsWithPayments: Student[] = sortedStudents.map((dbStudent: any) => {
        const studentPayments = (paymentsData || [])
          .filter((p: any) => p.student_id === dbStudent.id)
          .map(mapPaymentFromDB)

        return mapStudentFromDB(dbStudent, studentPayments)
      })

      setStudents(studentsWithPayments)
    } catch (error) {
      console.error("Error refreshing students:", error)
    }
  }, [supabase])

  const getStudent = useCallback(
    async (id: string): Promise<Student | null> => {
      const local = students.find((s) => s.id === id)
      if (local) {
        return local
      }

      const { data: studentData, error: studentError } = await supabase
        .from("students")
        .select("*")
        .eq("id", id)
        .single()

      if (studentError) {
        console.error("[v0] Erro ao buscar aluno:", studentError.message)
        return null
      }

      if (!studentData) return null

      const { data: paymentsData, error: paymentsError } = await supabase
        .from("payments")
        .select("*")
        .eq("student_id", id)
        .order("due_date", { ascending: true })

      if (paymentsError) {
        console.error("[v0] Erro ao buscar pagamentos:", paymentsError.message)
      }

      const studentPayments = (paymentsData || []).map(mapPaymentFromDB)
      return mapStudentFromDB(studentData, studentPayments)
    },
    [students, supabase],
  )

  const generateStudentPayments = useCallback(
    async (studentId: string, monthlyValue: number, isScholarship = false, registrationDate?: string) => {
      const currentDate = new Date()
      const currentYear = currentDate.getFullYear()
      const currentMonth = currentDate.getMonth() + 1
      const currentDay = currentDate.getDate()

      // Determine registration month/year - if not provided, use current date
      const regDate = registrationDate ? new Date(registrationDate) : currentDate
      const regYear = regDate.getFullYear()
      const regMonth = regDate.getMonth() + 1

      const paymentsToInsert: any[] = []

      // Generate payments only from registration month forward until December 2026
      for (let year = regYear; year <= 2026; year++) {
        const startMonth = year === regYear ? regMonth : 1
        const endMonth = 12

        for (let month = startMonth; month <= endMonth; month++) {
          const dueDate = createDueDate(year, month, 10)
          const dueDateObj = new Date(dueDate)
          const monthName = getMonthNameFromNumber(month)

          // Determine initial status
          let status: PaymentStatus
          if (isScholarship || monthlyValue === 0) {
            status = "Bolsista"
          } else {
            const isCurrentMonth = month === currentMonth && year === currentYear
            const isPastMonth = year < currentYear || (year === currentYear && month < currentMonth)

            if (isPastMonth) {
              status = "Não Pagou"
            } else if (isCurrentMonth) {
              // Between day 1-10: "Em Aberto", after day 10: "Não Pagou"
              status = currentDay <= 10 ? "Em Aberto" : "Não Pagou"
            } else {
              status = "Em Aberto"
            }
          }

          paymentsToInsert.push({
            student_id: studentId,
            month: `${monthName}/${year}`,
            status,
            value: isScholarship || monthlyValue === 0 ? 0 : monthlyValue,
            due_date: dueDate,
            month_number: month,
            year_number: year,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
        }
      }

      // Insert with ON CONFLICT to avoid duplicates
      for (const payment of paymentsToInsert) {
        const { error } = await supabase.from("payments").upsert(payment, {
          onConflict: "student_id,due_date",
          ignoreDuplicates: true,
        })
        if (error && !error.message.includes("duplicate")) {
          console.error("[v0] Error inserting payment:", error)
        }
      }
    },
    [supabase],
  )

  const addStudent = useCallback(
    async (student: Omit<Student, "id"> | Student) => {
      const hasId = "id" in student && student.id
      const registrationDate = new Date().toISOString()

      let studentId: string

      if (hasId) {
        const { error: insertError } = await supabase.from("students").insert({
          id: student.id,
          name: student.name,
          rg: student.rg || null,
          birth_date: student.birthDate || null,
          responsible: student.responsible,
          responsible_cpf: student.responsibleCpf || null,
          responsible_email: student.responsibleEmail || null,
          father_phone: student.fatherPhone || null,
          mother_phone: student.motherPhone || null,
          monthly_value: student.monthlyValue,
          is_active: student.isActive,
          is_scholarship: student.isScholarship || false,
          class_schedule: student.classSchedule || null,
          class_days: student.classDays || [],
          schedule_configs: student.scheduleConfigs || null,
          photo: student.photo || null,
          registration_date: registrationDate,
        })

        if (insertError) throw insertError
        studentId = student.id as string
      } else {
        const { data: newStudent, error: insertError } = await supabase
          .from("students")
          .insert({
            name: student.name,
            rg: student.rg || null,
            birth_date: student.birthDate || null,
            responsible: student.responsible,
            responsible_cpf: student.responsibleCpf || null,
            responsible_email: student.responsibleEmail || null,
            father_phone: student.fatherPhone || null,
            mother_phone: student.motherPhone || null,
            monthly_value: student.monthlyValue,
            is_active: student.isActive,
            is_scholarship: student.isScholarship || false,
            class_schedule: student.classSchedule || null,
            class_days: student.classDays || [],
            schedule_configs: student.scheduleConfigs || null,
            photo: student.photo || null,
            registration_date: registrationDate,
          })
          .select()
          .single()

        if (insertError) throw insertError
        studentId = newStudent.id
      }

      await generateStudentPayments(studentId, student.monthlyValue, student.isScholarship, registrationDate)

      await refreshStudents()
    },
    [supabase, refreshStudents, generateStudentPayments],
  )

  const updateStudent = useCallback(
    async (studentId: string, updates: Partial<Student>) => {
      const { error } = await supabase
        .from("students")
        .update({
          name: updates.name,
          rg: updates.rg || null,
          birth_date: updates.birthDate || null,
          responsible: updates.responsible,
          responsible_cpf: updates.responsibleCpf || null,
          responsible_email: updates.responsibleEmail || null,
          father_phone: updates.fatherPhone || null,
          mother_phone: updates.motherPhone || null,
          monthly_value: updates.monthlyValue,
          is_active: updates.isActive,
          is_scholarship: updates.isScholarship || false,
          class_schedule: updates.classSchedule || null,
          class_days: updates.classDays || [],
          schedule_configs: updates.scheduleConfigs || null,
          photo: updates.photo || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", studentId)

      if (error) throw error
      await refreshStudents()
    },
    [supabase, refreshStudents],
  )

  const deleteStudent = useCallback(
    async (studentId: string) => {
      const { error: paymentsError } = await supabase.from("payments").delete().eq("student_id", studentId)
      if (paymentsError) throw paymentsError

      const { error } = await supabase.from("students").delete().eq("id", studentId)
      if (error) throw error

      setStudents((prev) => prev.filter((s) => s.id !== studentId))
    },
    [supabase],
  )

  const archiveStudent = useCallback(
    async (studentId: string, reason?: string) => {
      const { error } = await supabase
        .from("students")
        .update({
          is_active: false,
          archived_at: new Date().toISOString(),
          archive_reason: reason || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", studentId)

      if (error) throw error
      await refreshStudents()
    },
    [supabase, refreshStudents],
  )

  const restoreStudent = useCallback(
    async (studentId: string) => {
      const { error } = await supabase
        .from("students")
        .update({
          is_active: true,
          archived_at: null,
          archive_reason: null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", studentId)

      if (error) throw error
      await refreshStudents()
    },
    [supabase, refreshStudents],
  )

  const updatePaymentStatus = useCallback(
    async (studentId: string, month: string, status: PaymentStatus) => {
      const updateData: any = {
        status,
        updated_at: new Date().toISOString(),
      }
      if (status === "Pago") updateData.paid_at = new Date().toISOString()
      if (status === "Cobrado") updateData.charged_at = new Date().toISOString()

      const { error } = await supabase
        .from("payments")
        .update(updateData)
        .eq("student_id", studentId)
        .eq("month", month)

      if (error) throw error
      await refreshStudents()
    },
    [supabase, refreshStudents],
  )

  const updatePaymentStatusByDate = useCallback(
    async (studentId: string, monthNumber: number, yearNumber: number, status: PaymentStatus) => {
      const updateData: any = {
        status,
        updated_at: new Date().toISOString(),
      }
      if (status === "Pago") updateData.paid_at = new Date().toISOString()
      if (status === "Cobrado") updateData.charged_at = new Date().toISOString()

      const { error } = await supabase
        .from("payments")
        .update(updateData)
        .eq("student_id", studentId)
        .eq("month_number", monthNumber)
        .eq("year_number", yearNumber)

      if (error) throw error
      await refreshStudents()
    },
    [supabase, refreshStudents],
  )

  const postponePayment = useCallback(
    async (studentId: string, month: string, newDate: string) => {
      const { error } = await supabase
        .from("payments")
        .update({
          status: "Adiado",
          postponed_to: newDate,
          updated_at: new Date().toISOString(),
        })
        .eq("student_id", studentId)
        .eq("month", month)

      if (error) throw error
      await refreshStudents()
    },
    [supabase, refreshStudents],
  )

  const attachReceipt = useCallback(
    async (studentId: string, month: string, receipt: File | string, paymentType: PaymentType = "pix") => {
      const receiptData = typeof receipt === "string" ? receipt : receipt.name
      const { error } = await supabase
        .from("payments")
        .update({
          receipt: receiptData,
          status: "Pago",
          paid_at: new Date().toISOString(),
          payment_type: paymentType,
          updated_at: new Date().toISOString(),
        })
        .eq("student_id", studentId)
        .eq("month", month)

      if (error) throw error
      await refreshStudents()
    },
    [supabase, refreshStudents],
  )

  const attachReceiptByDate = useCallback(
    async (studentId: string, monthNumber: number, yearNumber: number, receipt: File | string) => {
      const receiptData = typeof receipt === "string" ? receipt : receipt.name
      const { error } = await supabase
        .from("payments")
        .update({
          receipt: receiptData,
          status: "Pago",
          paid_at: new Date().toISOString(),
          payment_type: "pix",
          updated_at: new Date().toISOString(),
        })
        .eq("student_id", studentId)
        .eq("month_number", monthNumber)
        .eq("year_number", yearNumber)

      if (error) throw error
      await refreshStudents()
    },
    [supabase, refreshStudents],
  )

  const deleteReceipt = useCallback(
    async (studentId: string, month: string) => {
      const { error } = await supabase
        .from("payments")
        .update({
          receipt: null,
          status: "Não Pagou",
          paid_at: null,
          payment_type: null,
          updated_at: new Date().toISOString(),
        })
        .eq("student_id", studentId)
        .eq("month", month)

      if (error) throw error
      await refreshStudents()
    },
    [supabase, refreshStudents],
  )

  const updateMonthlyValue = useCallback(
    async (studentId: string, month: string, newValue: number) => {
      const { error } = await supabase
        .from("payments")
        .update({
          value: newValue,
          updated_at: new Date().toISOString(),
        })
        .eq("student_id", studentId)
        .eq("month", month)

      if (error) throw error
      await refreshStudents()
    },
    [supabase, refreshStudents],
  )

  const markAsPaidCash = useCallback(
    async (studentId: string, month: string) => {
      const { error } = await supabase
        .from("payments")
        .update({
          status: "Pago",
          paid_at: new Date().toISOString(),
          payment_type: "dinheiro",
          updated_at: new Date().toISOString(),
        })
        .eq("student_id", studentId)
        .eq("month", month)

      if (error) throw error
      await refreshStudents()
    },
    [supabase, refreshStudents],
  )

  const exemptPayment = useCallback(
    async (studentId: string, month: string) => {
      const { error } = await supabase
        .from("payments")
        .update({
          status: "Bolsista",
          value: 0,
          updated_at: new Date().toISOString(),
        })
        .eq("student_id", studentId)
        .eq("month", month)

      if (error) throw error
      await refreshStudents()
    },
    [supabase, refreshStudents],
  )

  const importStudents = useCallback(
    async (newStudents: Omit<Student, "id">[]) => {
      const registrationDate = new Date().toISOString()

      for (const student of newStudents) {
        const { data: created, error: insertError } = await supabase
          .from("students")
          .insert({
            name: student.name,
            rg: student.rg || null,
            birth_date: student.birthDate || null,
            responsible: student.responsible,
            responsible_cpf: student.responsibleCpf || null,
            responsible_email: student.responsibleEmail || null,
            father_phone: student.fatherPhone || null,
            mother_phone: student.motherPhone || null,
            monthly_value: student.monthlyValue,
            is_active: student.isActive,
            is_scholarship: student.isScholarship || false,
            class_schedule: student.classSchedule || null,
            class_days: student.classDays || [],
            schedule_configs: student.scheduleConfigs || null,
            photo: student.photo || null,
            registration_date: registrationDate,
          })
          .select()
          .single()

        if (insertError) throw insertError

        await generateStudentPayments(created.id, student.monthlyValue, student.isScholarship, registrationDate)
      }

      await refreshStudents()
    },
    [supabase, refreshStudents, generateStudentPayments],
  )

  return {
    students,
    isLoading,
    updatePaymentStatus,
    updatePaymentStatusByDate,
    postponePayment,
    attachReceipt,
    attachReceiptByDate,
    deleteReceipt,
    updateMonthlyValue,
    addStudent,
    updateStudent,
    deleteStudent,
    archiveStudent,
    restoreStudent,
    importStudents,
    getStudent,
    generateStudentPayments,
    markAsPaidCash,
    exemptPayment,
    getPaymentSummary: (month?: string, year?: number) => {
      const activeStudents = students.filter((s) => s.isActive && !s.archivedAt)
      const selectedMonth = month || "Janeiro"
      const selectedYear = year || getCurrentYear()
      const selectedMonthNumber = getMonthNumberFromName(selectedMonth)

      const currentMonthPayments = activeStudents.map((s) => {
        const payment = s.payments.find(
          (p) =>
            matchesMonthYearByNumbers(p, selectedMonthNumber, selectedYear) ||
            matchesMonthYear(p.month, selectedMonth, selectedYear),
        )
        return { student: s, payment }
      })

      const totalExpected = activeStudents.reduce((sum, s) => {
        if (!s.isScholarship) return sum + (s.monthlyValue || 0)
        return sum
      }, 0)

      const totalReceived = currentMonthPayments.reduce(
        (sum, { payment }) => (payment?.status === "Pago" ? sum + (payment.value || 0) : sum),
        0,
      )

      const pendingPayments = currentMonthPayments.filter(
        ({ student, payment }) =>
          !student.isScholarship &&
          (payment?.status === "Não Pagou" ||
            payment?.status === "Cobrado" ||
            payment?.status === "Em Aberto" ||
            !payment),
      ).length

      const scholarshipStudents = activeStudents.filter((s) => s.isScholarship || s.monthlyValue === 0).length

      return {
        totalStudents: students.length,
        activeStudents: activeStudents.length,
        totalExpected,
        totalReceived,
        pendingPayments,
        scholarshipStudents,
      }
    },

    searchStudents: (query) => {
      const lowerQuery = query.toLowerCase()
      return students.filter(
        (s) => s.name.toLowerCase().includes(lowerQuery) || s.responsible.toLowerCase().includes(lowerQuery),
      )
    },

    filterByPaymentStatus: (status, month, year) => {
      const selectedYear = year || getCurrentYear()
      const selectedMonthNumber = getMonthNumberFromName(month)
      return students.filter((s) => {
        const payment = s.payments.find(
          (p) =>
            matchesMonthYearByNumbers(p, selectedMonthNumber, selectedYear) ||
            matchesMonthYear(p.month, month, selectedYear),
        )
        return payment?.status === status
      })
    },

    getMonthlyReport: (month: string, year?: number) => {
      const selectedYear = year || getCurrentYear()
      const selectedMonthNumber = getMonthNumberFromName(month)
      const activeStudents = students.filter((s) => s.isActive && !s.archivedAt && !s.isScholarship)

      const totalReceived = activeStudents.reduce((sum, s) => {
        const payment = s.payments.find(
          (p) =>
            matchesMonthYearByNumbers(p, selectedMonthNumber, selectedYear) ||
            matchesMonthYear(p.month, month, selectedYear),
        )
        return payment?.status === "Pago" ? sum + (payment.value || 0) : sum
      }, 0)

      const totalExpected = activeStudents.reduce((sum, s) => sum + (s.monthlyValue || 0), 0)
      const pendingAmount = totalExpected - totalReceived

      const defaultedStudents = activeStudents.filter((s) => {
        const payment = s.payments.find(
          (p) =>
            matchesMonthYearByNumbers(p, selectedMonthNumber, selectedYear) ||
            matchesMonthYear(p.month, month, selectedYear),
        )
        return payment?.status === "Não Pagou" || payment?.status === "Cobrado"
      })

      const newStudents = activeStudents.filter((s) => {
        const payment = s.payments.find(
          (p) =>
            matchesMonthYearByNumbers(p, selectedMonthNumber, selectedYear) ||
            matchesMonthYear(p.month, month, selectedYear),
        )
        return payment?.status === "Novo"
      })

      return {
        totalReceived,
        pendingAmount,
        defaultedStudents,
        newStudents,
      }
    },
  }
}
