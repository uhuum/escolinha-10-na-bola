"use client"

import { useState, useEffect, useCallback } from "react"
import { getBrowserClient } from "@/lib/supabase/client"
import { getTodayDateString } from "@/lib/utils/date"
import type { Attendance, AttendanceRecord, ClassSchedule, WeekDay } from "../types"

interface AttendanceStore {
  attendances: Attendance[]
  isLoading: boolean
  addAttendance: (
    classSchedule: ClassSchedule,
    classDays: WeekDay[],
    trainerName: string,
    trainerId: string, // Added trainerId parameter
    records: AttendanceRecord[],
    dayOfWeek: string,
  ) => Promise<void>
  getAttendancesByDate: (date: string) => Attendance[]
  getAttendanceById: (id: string) => Attendance | undefined
  getStudentAttendanceHistory: (studentId: string) => Attendance[]
  updateAttendance: (id: string, updatedRecords: Record<string, "Presente" | "Ausente">) => Promise<void>
  deleteAttendance: (id: string) => Promise<void>
}

export function useAttendance(): AttendanceStore {
  const [attendances, setAttendances] = useState<Attendance[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const supabase = getBrowserClient()

  const fetchAttendances = useCallback(async () => {
    try {
      setIsLoading(true)
      // Fetch both datasets in parallel and transfer only the columns used by the UI.
      const [attendanceResponse, recordsResponse] = await Promise.all([
        supabase
          .from("attendance")
          .select("id,date,day_of_week,class_schedule,trainer_name,trainer_id,created_at")
          .order("created_at", { ascending: false }),
        supabase
          .from("attendance_records")
          .select("attendance_id,student_id,status"),
      ])

      if (attendanceResponse.error) throw attendanceResponse.error
      if (recordsResponse.error) throw recordsResponse.error

      const attendanceData = attendanceResponse.data
      const recordsData = recordsResponse.data

      // Group records once. This keeps the merge O(attendances + records) instead
      // of scanning every record again for every attendance.
      const recordsByAttendance = new Map<string, AttendanceRecord[]>()
      for (const record of recordsData || []) {
        const list = recordsByAttendance.get(record.attendance_id) || []
        list.push({
          studentId: record.student_id,
          status: record.status as "Presente" | "Ausente",
        })
        recordsByAttendance.set(record.attendance_id, list)
      }

      const combined: Attendance[] = (attendanceData || []).map((att: any) => ({
        id: att.id,
        date: att.date,
        dayOfWeek: att.day_of_week,
        classSchedule: att.class_schedule,
        classDays: [],
        trainerName: att.trainer_name,
        trainerId: att.trainer_id || "",
        createdAt: att.created_at,
        records: recordsByAttendance.get(att.id) || [],
      }))

      setAttendances(combined)
    } catch (error) {
      console.error("[v0] Error fetching attendances:", error)
    } finally {
      setIsLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    fetchAttendances()
  }, [fetchAttendances])

  const addAttendance = useCallback(
    async (
      classSchedule: ClassSchedule,
      classDays: WeekDay[],
      trainerName: string,
      trainerId: string, // Added trainerId parameter
      records: AttendanceRecord[],
      dayOfWeek: string,
    ) => {
      try {
        console.log("[v0] Adding attendance for class:", classSchedule, "by trainer:", trainerId)

        const today = getTodayDateString()

        const { data: attendanceData, error: attendanceError } = await supabase
          .from("attendance")
          .insert({
            class_schedule: classSchedule,
            date: today,
            day_of_week: dayOfWeek,
            trainer_name: trainerName,
            trainer_id: trainerId,
          })
          .select()
          .single()

        if (attendanceError) throw attendanceError

        const attendanceId = attendanceData?.id
        if (!attendanceId) throw new Error("Erro ao criar registro de presença")

        console.log("[v0] Attendance record created with ID:", attendanceId)

        const { error: recordsError } = await supabase.from("attendance_records").insert(
          records.map((record) => ({
            attendance_id: attendanceId,
            student_id: record.studentId,
            status: record.status,
          })),
        )

        if (recordsError) throw recordsError

        console.log("[v0] Attendance records created:", records.length)
        await fetchAttendances()
      } catch (error) {
        console.error("[v0] Error adding attendance:", error)
        alert("Erro ao registrar presença: " + (error instanceof Error ? error.message : String(error)))
        throw error
      }
    },
    [supabase, fetchAttendances],
  )

  const getAttendancesByDate = useCallback(
    (date: string) => {
      return attendances.filter((att) => att.date === date)
    },
    [attendances],
  )

  const getAttendanceById = useCallback(
    (id: string) => {
      return attendances.find((att) => att.id === id)
    },
    [attendances],
  )

  const getStudentAttendanceHistory = useCallback(
    (studentId: string) => {
      return attendances.filter((att) => att.records.some((record) => record.studentId === studentId))
    },
    [attendances],
  )

  const updateAttendance = useCallback(
    async (id: string, updatedRecords: Record<string, "Presente" | "Ausente">) => {
      try {
        const { error: deleteError } = await supabase
          .from("attendance_records")
          .delete()
          .eq("attendance_id", id)
          .throwOnError()

        if (deleteError) throw deleteError

        const records = Object.entries(updatedRecords).map(([studentId, status]) => ({
          attendance_id: id,
          student_id: studentId,
          status,
        }))

        const { error: insertError } = await supabase.from("attendance_records").insert(records).throwOnError()

        if (insertError) throw insertError

        console.log("[v0] Attendance updated:", id)
        await fetchAttendances()
      } catch (error) {
        console.error("[v0] Error updating attendance:", error)
        alert("Erro ao atualizar presença: " + (error instanceof Error ? error.message : String(error)))
        throw error
      }
    },
    [supabase, fetchAttendances],
  )

  const deleteAttendance = useCallback(
    async (id: string) => {
      try {
        const { error } = await supabase.from("attendance").delete().eq("id", id).throwOnError()

        if (error) throw error
        console.log("[v0] Attendance deleted:", id)
        setAttendances((prev) => prev.filter((a) => a.id !== id))
      } catch (error) {
        console.error("[v0] Error deleting attendance:", error)
        alert("Erro ao deletar presença: " + (error instanceof Error ? error.message : String(error)))
        throw error
      }
    },
    [supabase],
  )

  return {
    attendances,
    isLoading,
    addAttendance,
    getAttendancesByDate,
    getAttendanceById,
    getStudentAttendanceHistory,
    updateAttendance,
    deleteAttendance,
  }
}
