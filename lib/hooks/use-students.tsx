"use client"

import { useState, useEffect, useCallback } from "react"
import { getBrowserClient } from "@/lib/supabase/client"
import type { Student, PaymentStatus, PaymentSummary } from "../types"

interface StudentsStore {
  students: Student[]
  isLoading: boolean
  updatePaymentStatus: (studentId: string, month: string, status: PaymentStatus) => Promise<void>
  postponePayment: (studentId: string, month: string, newDate: string) => Promise<void>
  attachReceipt: (studentId: string, month: string, receipt: File | string) => Promise<void>
  deleteReceipt: (studentId: string, month: string) => Promise<void>
  updateMonthlyValue: (studentId: string, month: string, newValue: number) => Promise<void>
  addStudent: (student: Omit<Student, "id">) => Promise<void>
  updateStudent: (studentId: string, updates: Partial<Student>) => Promise<void>
  deleteStudent: (studentId: string) => Promise<void>
  importStudents: (students: Omit<Student, "id">[]) => Promise<void>
  getStudent: (id: string) => Promise<Student | null>
  getPaymentSummary: (month?: string) => PaymentSummary
  searchStudents: (query: string) => Student[]
  filterByPaymentStatus: (status: PaymentStatus, month: string) => Student[]
  getMonthlyReport: (month: string) => {
    totalReceived: number
    pendingAmount: number
    defaultedStudents: Student[]
    newStudents: Student[]
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

        console.log("[v0] Fetching students from database...")

        const { data: studentsData, error: studentError } = await supabase
          .from("students")
          .select("*")
          .order("name", { ascending: true })

        if (studentError) throw studentError

        const { data: paymentsData, error: paymentsError } = await supabase.from("payments").select("*")
        if (paymentsError) throw paymentsError

        const sortedStudents = (studentsData || []).sort((a, b) =>
          a.name.localeCompare(b.name, "pt-BR", { sensitivity: "base" }),
        )

        const studentsWithPayments: Student[] = sortedStudents.map((dbStudent: any) => ({
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
          classSchedule: dbStudent.class_schedule || undefined,
          classDays: dbStudent.class_days || [],
          photo: dbStudent.photo || undefined,
          payments: (paymentsData || [])
            .filter((p: any) => p.student_id === dbStudent.id)
            .map((p: any) => ({
              month: p.month,
              status: p.status,
              value: p.value,
              receipt: p.receipt || undefined,
              paidAt: p.paid_at || undefined,
              postponedTo: p.postponed_to || undefined,
            })),
        }))

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
      const { data: paymentsData } = await supabase.from("payments").select("*")

      const sortedStudents = (studentsData || []).sort((a, b) =>
        a.name.localeCompare(b.name, "pt-BR", { sensitivity: "base" }),
      )

      const studentsWithPayments: Student[] = sortedStudents.map((dbStudent: any) => ({
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
        classSchedule: dbStudent.class_schedule || undefined,
        classDays: dbStudent.class_days || [],
        photo: dbStudent.photo || undefined,
        payments: (paymentsData || [])
          .filter((p: any) => p.student_id === dbStudent.id)
          .map((p: any) => ({
            month: p.month,
            status: p.status,
            value: p.value,
            receipt: p.receipt || undefined,
            paidAt: p.paid_at || undefined,
            postponedTo: p.postponed_to || undefined,
          })),
      }))

      setStudents(studentsWithPayments)
    } catch (error) {
      console.error("Error refreshing students:", error)
    }
  }, [supabase])

  const getStudent = useCallback(
    async (id: string): Promise<Student | null> => {
      console.log("[v0] Procurando aluno com ID:", id)
      const local = students.find((s) => s.id === id)
      if (local) {
        console.log("[v0] Aluno encontrado localmente:", local.name)
        return local
      }

      console.log("[v0] Buscando aluno direto no Supabase...")

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

      if (paymentsError) {
        console.error("[v0] Erro ao buscar pagamentos:", paymentsError.message)
      }

      const student: Student = {
        id: studentData.id,
        name: studentData.name,
        rg: studentData.rg || "",
        birthDate: studentData.birth_date || "",
        responsible: studentData.responsible,
        responsibleCpf: studentData.responsible_cpf || "",
        responsibleEmail: studentData.responsible_email || "",
        fatherPhone: studentData.father_phone || "",
        motherPhone: studentData.mother_phone || "",
        monthlyValue: studentData.monthly_value || 0,
        isActive: studentData.is_active ?? true,
        classSchedule: studentData.class_schedule || undefined,
        classDays: studentData.class_days || [],
        photo: studentData.photo || undefined,
        payments: (paymentsData || []).map((p: any) => ({
          month: p.month,
          status: p.status,
          value: p.value,
          receipt: p.receipt || undefined,
          paidAt: p.paid_at || undefined,
          postponedTo: p.postponed_to || undefined,
        })),
      }

      console.log("[v0] Aluno carregado diretamente do banco:", student.name)
      return student
    },
    [students, supabase],
  )

  const addStudent = useCallback(
    async (student: Omit<Student, "id">) => {
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
          class_schedule: student.classSchedule || null,
          class_days: student.classDays || [],
          photo: student.photo || null,
        })
        .select()
        .single()

      if (insertError) throw insertError

      const studentId = newStudent.id
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

      // Get current month index
      const currentDate = new Date()
      const currentMonthIndex = currentDate.getMonth()

      // Create payments only from current month onwards
      const paymentsToInsert = months.slice(currentMonthIndex).map((month) => ({
        student_id: studentId,
        month,
        status: "Em Aberto",
        value: student.monthlyValue,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }))

      const { error: paymentError } = await supabase.from("payments").insert(paymentsToInsert)
      if (paymentError) throw paymentError
      await refreshStudents()
    },
    [supabase, refreshStudents],
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
          class_schedule: updates.classSchedule || null,
          class_days: updates.classDays || [],
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

  const updatePaymentStatus = useCallback(
    async (studentId: string, month: string, status: PaymentStatus) => {
      const updateData: any = {
        status,
        updated_at: new Date().toISOString(),
      }
      if (status === "Pago") updateData.paid_at = new Date().toISOString()

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
    async (studentId: string, month: string, receipt: File | string) => {
      const receiptData = typeof receipt === "string" ? receipt : receipt.name
      const { error } = await supabase
        .from("payments")
        .update({
          receipt: receiptData,
          status: "Pago",
          paid_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("student_id", studentId)
        .eq("month", month)

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

  const importStudents = useCallback(
    async (newStudents: Omit<Student, "id">[]) => {
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

      const currentDate = new Date()
      const currentMonthIndex = currentDate.getMonth()

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
            class_schedule: student.classSchedule || null,
            class_days: student.classDays || [],
            photo: student.photo || null,
          })
          .select()
          .single()

        if (insertError) throw insertError

        const studentId = created.id

        // Create payments only from current month onwards
        const paymentsToInsert = months.slice(currentMonthIndex).map((month) => ({
          student_id: studentId,
          month,
          status: "Em Aberto",
          value: student.monthlyValue,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }))

        const { error: paymentError } = await supabase.from("payments").insert(paymentsToInsert)
        if (paymentError) throw paymentError
      }

      await refreshStudents()
    },
    [supabase, refreshStudents],
  )

  return {
    students,
    isLoading,
    updatePaymentStatus,
    postponePayment,
    attachReceipt,
    deleteReceipt,
    updateMonthlyValue,
    addStudent,
    updateStudent,
    deleteStudent,
    importStudents,
    getStudent,
    getPaymentSummary: (month?: string) => {
      const activeStudents = students.filter((s) => s.isActive)
      const selectedMonth = month || "Outubro"

      const currentMonthPayments = activeStudents.map((s) => {
        const payment = s.payments.find((p) => p.month === selectedMonth)
        return { student: s, payment }
      })

      const totalExpected = activeStudents.reduce((sum, s) => sum + (s.monthlyValue || 0), 0)
      const totalReceived = currentMonthPayments.reduce(
        (sum, { payment }) => (payment?.status === "Pago" ? sum + (payment.value || 0) : sum),
        0,
      )

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

    filterByPaymentStatus: (status, month) => {
      return students.filter((s) => s.payments.some((p) => p.month === month && p.status === status))
    },

    getMonthlyReport: (month: string) => {
      const activeStudents = students.filter((s) => s.isActive)

      const totalReceived = activeStudents.reduce((sum, s) => {
        const payment = s.payments.find((p) => p.month === month)
        return payment?.status === "Pago" ? sum + (payment.value || 0) : sum
      }, 0)

      const totalExpected = activeStudents.reduce((sum, s) => sum + (s.monthlyValue || 0), 0)
      const pendingAmount = totalExpected - totalReceived

      const defaultedStudents = activeStudents.filter((s) => {
        const payment = s.payments.find((p) => p.month === month)
        return payment?.status === "Não Pagou"
      })

      return {
        totalReceived,
        pendingAmount,
        defaultedStudents,
        newStudents: [],
      }
    },
  }
}
