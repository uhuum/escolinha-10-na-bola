"use client"

import { useEffect, useState } from "react"
import { createBrowserClient } from "@supabase/ssr"
import { getTodayDateString } from "@/lib/utils/date"
import type { Attendance, AttendanceRecord, ClassSchedule, WeekDay } from "../types"

const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

interface AttendanceStore {
  attendances: Attendance[]
  loading: boolean
  error: string | null
  addAttendance: (
    classSchedule: ClassSchedule,
    classDays: WeekDay[],
    trainerName: string,
    records: AttendanceRecord[],
    dayOfWeek: string,
  ) => Promise<void>
  getAttendancesByDate: (date: string) => Attendance[]
  getAttendanceById: (id: string) => Attendance | undefined
  getStudentAttendanceHistory: (studentId: string) => Attendance[]
  updateAttendance: (id: string, updatedRecords: Record<string, "Presente" | "Ausente">) => Promise<void>
  deleteAttendance: (id: string) => Promise<void>
}

export function useAttendanceSupabase(): AttendanceStore {
  const [attendances, setAttendances] = useState<Attendance[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch all attendances from Supabase on mount
  useEffect(() => {
    const fetchAttendances = async () => {
      try {
        setLoading(true)

        // Fetch attendance records
        const { data: attendanceData, error: attendanceError } = await supabase.from("attendance").select("*")

        if (attendanceError) throw attendanceError

        // Fetch attendance records
        const { data: recordsData, error: recordsError } = await supabase.from("attendance_records").select("*")

        if (recordsError) throw recordsError

        // Map records to attendance
        const attendancesWithRecords: Attendance[] = (attendanceData || []).map((att: any) => ({
          id: att.id,
          date: att.date,
          dayOfWeek: att.day_of_week,
          classSchedule: att.class_schedule,
          classDays: att.class_days,
          trainerName: att.trainer_name,
          createdAt: att.created_at,
          records: (recordsData || [])
            .filter((r: any) => r.attendance_id === att.id)
            .map((r: any) => ({
              studentId: r.student_id,
              status: r.status,
            })),
        }))

        setAttendances(attendancesWithRecords)
        setError(null)
      } catch (err) {
        console.error("[v0] Error fetching attendances:", err)
        setError(err instanceof Error ? err.message : "Failed to fetch attendances")
      } finally {
        setLoading(false)
      }
    }

    fetchAttendances()
  }, [])

  return {
    attendances,
    loading,
    error,

    addAttendance: async (classSchedule, classDays, trainerName, records, dayOfWeek) => {
      try {
        const attendanceId = `att-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

        const { error: attError } = await supabase.from("attendance").insert({
          id: attendanceId,
          date: getTodayDateString(),
          day_of_week: dayOfWeek,
          class_schedule: classSchedule,
          class_days: classDays,
          trainer_name: trainerName,
        })

        if (attError) throw attError

        // Insert records
        const recordsToInsert = records.map((r) => ({
          id: `record-${attendanceId}-${r.studentId}`,
          attendance_id: attendanceId,
          student_id: r.studentId,
          status: r.status,
        }))

        const { error: recordError } = await supabase.from("attendance_records").insert(recordsToInsert)

        if (recordError) throw recordError

        // Update local state
        const newAttendance: Attendance = {
          id: attendanceId,
          date: getTodayDateString(),
          dayOfWeek,
          classSchedule,
          classDays,
          trainerName,
          records,
          createdAt: new Date().toISOString(),
        }

        setAttendances((prev) => [...prev, newAttendance])
      } catch (err) {
        console.error("[v0] Error adding attendance:", err)
        throw err
      }
    },

    getAttendancesByDate: (date) => {
      return attendances.filter((att) => att.date === date)
    },

    getAttendanceById: (id) => {
      return attendances.find((att) => att.id === id)
    },

    getStudentAttendanceHistory: (studentId) => {
      return attendances.filter((att) => att.records.some((record) => record.studentId === studentId))
    },

    updateAttendance: async (id, updatedRecords) => {
      try {
        // Update each record
        for (const [studentId, status] of Object.entries(updatedRecords)) {
          const { error } = await supabase
            .from("attendance_records")
            .update({ status })
            .eq("attendance_id", id)
            .eq("student_id", studentId)

          if (error) throw error
        }

        // Update local state
        setAttendances((prev) =>
          prev.map((att) =>
            att.id === id
              ? {
                  ...att,
                  records: att.records.map((record) => ({
                    ...record,
                    status: updatedRecords[record.studentId] || record.status,
                  })),
                }
              : att,
          ),
        )
      } catch (err) {
        console.error("[v0] Error updating attendance:", err)
        throw err
      }
    },

    deleteAttendance: async (id) => {
      try {
        // Delete records first (cascade)
        const { error: recordError } = await supabase.from("attendance_records").delete().eq("attendance_id", id)

        if (recordError) throw recordError

        // Delete attendance
        const { error: attError } = await supabase.from("attendance").delete().eq("id", id)

        if (attError) throw attError

        setAttendances((prev) => prev.filter((att) => att.id !== id))
      } catch (err) {
        console.error("[v0] Error deleting attendance:", err)
        throw err
      }
    },
  }
}
