"use client"

import { useEffect, useState } from "react"
import { createBrowserClient } from "@supabase/ssr"
import type { Student, PaymentStatus, PaymentSummary } from "../types"

const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

interface StudentsStore {
  students: Student[]
  loading: boolean
  error: string | null
  updatePaymentStatus: (studentId: string, month: string, status: PaymentStatus) => Promise<void>
  postponePayment: (studentId: string, month: string, newDate: string) => Promise<void>
  attachReceipt: (studentId: string, month: string, receipt: File | string) => Promise<void>
  deleteReceipt: (studentId: string, month: string) => Promise<void>
  updateMonthlyValue: (studentId: string, month: string, newValue: number) => Promise<void>
  addStudent: (student: Student) => Promise<void>
  updateStudent: (studentId: string, updates: Partial<Student>) => Promise<void>
  deleteStudent: (studentId: string) => Promise<void>
  getStudent: (id: string) => Student | undefined
  getPaymentSummary: (month?: string) => PaymentSummary
  searchStudents: (query: string) => Student[]
}

export function useStudentSupabase(): StudentsStore {
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch all students from Supabase on mount
  useEffect(() => {
    const fetchStudents = async () => {
      try {
        setLoading(true)

        // Fetch students
        const { data: studentsData, error: studentError } = await supabase.from("students").select("*")

        if (studentError) throw studentError

        // Fetch payments for all students
        const { data: paymentsData, error: paymentError } = await supabase.from("payments").select("*")

        if (paymentError) throw paymentError

        // Map payments to students
        const studentsWithPayments: Student[] = (studentsData || []).map((student: any) => ({
          id: student.id,
          name: student.name,
          rg: student.rg,
          birthDate: student.birth_date,
          responsible: student.responsible,
          responsibleCpf: student.responsible_cpf,
          responsibleEmail: student.responsible_email,
          fatherPhone: student.father_phone,
          motherPhone: student.mother_phone,
          monthlyValue: student.monthly_value,
          isActive: student.is_active,
          classSchedule: student.class_schedule,
          classDays: student.class_days,
          photo: student.photo,
          payments: (paymentsData || [])
            .filter((p: any) => p.student_id === student.id)
            .map((p: any) => ({
              month: p.month,
              status: p.status,
              value: p.value,
              postponedTo: p.postponed_to,
              receipt: p.receipt,
              paidAt: p.paid_at,
            })),
        }))

        setStudents(studentsWithPayments)
        setError(null)
      } catch (err) {
        console.error("[v0] Error fetching students:", err)
        setError(err instanceof Error ? err.message : "Failed to fetch students")
      } finally {
        setLoading(false)
      }
    }

    fetchStudents()
  }, [])

  return {
    students,
    loading,
    error,

    updatePaymentStatus: async (studentId, month, status) => {
      try {
        const { error } = await supabase
          .from("payments")
          .update({ status })
          .eq("student_id", studentId)
          .eq("month", month)

        if (error) throw error

        // Update local state
        setStudents((prev) =>
          prev.map((student) =>
            student.id === studentId
              ? {
                  ...student,
                  payments: student.payments.map((p) => (p.month === month ? { ...p, status } : p)),
                }
              : student,
          ),
        )
      } catch (err) {
        console.error("[v0] Error updating payment status:", err)
        throw err
      }
    },

    postponePayment: async (studentId, month, newDate) => {
      try {
        const { error } = await supabase
          .from("payments")
          .update({ status: "Adiado", postponed_to: newDate })
          .eq("student_id", studentId)
          .eq("month", month)

        if (error) throw error

        setStudents((prev) =>
          prev.map((student) =>
            student.id === studentId
              ? {
                  ...student,
                  payments: student.payments.map((p) =>
                    p.month === month ? { ...p, status: "Adiado", postponedTo: newDate } : p,
                  ),
                }
              : student,
          ),
        )
      } catch (err) {
        console.error("[v0] Error postponing payment:", err)
        throw err
      }
    },

    attachReceipt: async (studentId, month, receipt) => {
      try {
        const { error } = await supabase
          .from("payments")
          .update({
            receipt: String(receipt),
            status: "Pago",
            paid_at: new Date().toISOString(),
          })
          .eq("student_id", studentId)
          .eq("month", month)

        if (error) throw error

        setStudents((prev) =>
          prev.map((student) =>
            student.id === studentId
              ? {
                  ...student,
                  payments: student.payments.map((p) =>
                    p.month === month
                      ? {
                          ...p,
                          receipt: String(receipt),
                          status: "Pago",
                          paidAt: new Date().toISOString(),
                        }
                      : p,
                  ),
                }
              : student,
          ),
        )
      } catch (err) {
        console.error("[v0] Error attaching receipt:", err)
        throw err
      }
    },

    deleteReceipt: async (studentId, month) => {
      try {
        const { error } = await supabase
          .from("payments")
          .update({
            receipt: null,
            status: "Não Pagou",
            paid_at: null,
          })
          .eq("student_id", studentId)
          .eq("month", month)

        if (error) throw error

        setStudents((prev) =>
          prev.map((student) =>
            student.id === studentId
              ? {
                  ...student,
                  payments: student.payments.map((p) =>
                    p.month === month
                      ? {
                          ...p,
                          receipt: undefined,
                          status: "Não Pagou",
                          paidAt: undefined,
                        }
                      : p,
                  ),
                }
              : student,
          ),
        )
      } catch (err) {
        console.error("[v0] Error deleting receipt:", err)
        throw err
      }
    },

    updateMonthlyValue: async (studentId, month, newValue) => {
      try {
        const { error } = await supabase
          .from("payments")
          .update({ value: newValue })
          .eq("student_id", studentId)
          .eq("month", month)

        if (error) throw error

        setStudents((prev) =>
          prev.map((student) =>
            student.id === studentId
              ? {
                  ...student,
                  payments: student.payments.map((p) => (p.month === month ? { ...p, value: newValue } : p)),
                }
              : student,
          ),
        )
      } catch (err) {
        console.error("[v0] Error updating monthly value:", err)
        throw err
      }
    },

    addStudent: async (student) => {
      try {
        const { error: studentError } = await supabase.from("students").insert({
          id: student.id,
          name: student.name,
          rg: student.rg,
          birth_date: student.birthDate,
          responsible: student.responsible,
          responsible_cpf: student.responsibleCpf,
          responsible_email: student.responsibleEmail,
          father_phone: student.fatherPhone,
          mother_phone: student.motherPhone,
          monthly_value: student.monthlyValue,
          is_active: student.isActive,
          class_schedule: student.classSchedule,
          class_days: student.classDays,
          photo: student.photo,
        })

        if (studentError) throw studentError

        // Insert payments
        if (student.payments.length > 0) {
          const paymentsToInsert = student.payments.map((p) => ({
            id: `payment-${student.id}-${p.month}`,
            student_id: student.id,
            month: p.month,
            status: p.status,
            value: p.value,
            postponed_to: p.postponedTo,
            receipt: p.receipt ? String(p.receipt) : null,
            paid_at: p.paidAt,
          }))

          const { error: paymentError } = await supabase.from("payments").insert(paymentsToInsert)

          if (paymentError) throw paymentError
        }

        setStudents((prev) => [...prev, student])
      } catch (err) {
        console.error("[v0] Error adding student:", err)
        throw err
      }
    },

    updateStudent: async (studentId, updates) => {
      try {
        const updateData: Record<string, any> = {}

        if (updates.name) updateData.name = updates.name
        if (updates.rg) updateData.rg = updates.rg
        if (updates.birthDate) updateData.birth_date = updates.birthDate
        if (updates.responsible) updateData.responsible = updates.responsible
        if (updates.responsibleCpf) updateData.responsible_cpf = updates.responsibleCpf
        if (updates.responsibleEmail) updateData.responsible_email = updates.responsibleEmail
        if (updates.fatherPhone) updateData.father_phone = updates.fatherPhone
        if (updates.motherPhone) updateData.mother_phone = updates.motherPhone
        if (updates.monthlyValue !== undefined) updateData.monthly_value = updates.monthlyValue
        if (updates.isActive !== undefined) updateData.is_active = updates.isActive
        if (updates.classSchedule) updateData.class_schedule = updates.classSchedule
        if (updates.classDays) updateData.class_days = updates.classDays
        if (updates.photo) updateData.photo = updates.photo

        const { error } = await supabase.from("students").update(updateData).eq("id", studentId)

        if (error) throw error

        setStudents((prev) => prev.map((s) => (s.id === studentId ? { ...s, ...updates } : s)))
      } catch (err) {
        console.error("[v0] Error updating student:", err)
        throw err
      }
    },

    deleteStudent: async (studentId) => {
      try {
        const { error } = await supabase.from("students").delete().eq("id", studentId)

        if (error) throw error

        setStudents((prev) => prev.filter((s) => s.id !== studentId))
      } catch (err) {
        console.error("[v0] Error deleting student:", err)
        throw err
      }
    },

    getStudent: (id) => {
      return students.find((s) => s.id === id)
    },

    getPaymentSummary: (month?: string) => {
      const activeStudents = students.filter((s) => s.isActive)
      const selectedMonth = month || "Outubro"

      const currentMonthPayments = activeStudents.map((s) => {
        const payment = s.payments.find((p) => p.month === selectedMonth)
        return { student: s, payment }
      })

      const totalExpected = activeStudents.reduce((sum, s) => {
        if (s.monthlyValue > 0) return sum + s.monthlyValue
        return sum
      }, 0)

      const totalReceived = currentMonthPayments.reduce((sum, { payment }) => {
        if (payment?.status === "Pago") return sum + (payment.value || 0)
        return sum
      }, 0)

      const pendingPayments = currentMonthPayments.filter(
        ({ payment }) =>
          payment?.status === "Não Pagou" || payment?.status === "Cobrado" || payment?.status === "Em Aberto",
      ).length

      const scholarshipStudents = activeStudents.filter((s) => s.monthlyValue === 0).length

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
  }
}
