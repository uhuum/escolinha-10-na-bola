import type { ClassSchedule, DayScheduleConfig, WeekDay } from "@/lib/types"

export type AttendanceEntry = {
  studentId: string
  date: string
  schedule: string
  status: "Presente" | "Ausente"
}

export type AttendanceStudent = {
  id: string
  registrationDate?: string | null
  isActive?: boolean
  archivedAt?: string | null
  classSchedule?: ClassSchedule | string | null
  classDays?: WeekDay[] | string[] | null
  scheduleConfigs?: DayScheduleConfig[] | null
}

const WEEK_DAYS: (WeekDay | null)[] = [null, "Segunda", "Terça", "Quarta", "Quinta", "Sexta", null]
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/

export function localToday(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo", year: "numeric", month: "2-digit", day: "2-digit",
  }).format(new Date())
}

export function daysBetween(first: string, second: string): number {
  return Math.round((Date.parse(second + "T12:00:00Z") - Date.parse(first + "T12:00:00Z")) / 86400000)
}

export function weekStart(date: string): string {
  const monday = new Date(date + "T12:00:00Z")
  const weekday = monday.getUTCDay()
  monday.setUTCDate(monday.getUTCDate() - (weekday === 0 ? 6 : weekday - 1))
  return monday.toISOString().slice(0, 10)
}

export function slotsForDay(student: AttendanceStudent, date: string): string[] {
  if (!ISO_DATE.test(date)) return []
  const weekday = WEEK_DAYS[new Date(date + "T12:00:00Z").getUTCDay()]
  if (!weekday) return []
  if (Array.isArray(student.scheduleConfigs) && student.scheduleConfigs.length > 0) {
    return [...new Set(student.scheduleConfigs
      .filter(item => item?.day === weekday && typeof item.schedule === "string")
      .map(item => item.schedule))]
  }
  if (student.classSchedule && student.classDays?.includes(weekday)) return [student.classSchedule]
  return []
}

export function absentForThreeConsecutiveWeeks(
  student: AttendanceStudent,
  entries: AttendanceEntry[],
  today: string,
): boolean {
  if (student.isActive === false || student.archivedAt) return false
  const registered = student.registrationDate?.slice(0, 10)
  if (!registered || !ISO_DATE.test(registered) || daysBetween(registered, today) < 21) return false

  const weeks = new Map<string, { hasPresence: boolean; hasAbsence: boolean; lastDate: string }>()
  let lastPresence: string | null = null
  for (const row of entries) {
    if (row.studentId !== student.id || !ISO_DATE.test(row.date) || row.date > today || row.date < registered) continue
    if (!slotsForDay(student, row.date).includes(row.schedule)) continue
    if (row.status === "Presente" && (!lastPresence || row.date > lastPresence)) lastPresence = row.date
    if (daysBetween(row.date, today) > 70) continue
    const monday = weekStart(row.date)
    const week = weeks.get(monday) || { hasPresence: false, hasAbsence: false, lastDate: row.date }
    if (row.status === "Presente") week.hasPresence = true
    if (row.status === "Ausente") week.hasAbsence = true
    if (row.date > week.lastDate) week.lastDate = row.date
    weeks.set(monday, week)
  }
  const lastThree = [...weeks.entries()].sort((a, b) => b[0].localeCompare(a[0])).slice(0, 3)
  return lastThree.length === 3
    && lastThree.every(([, week]) => week.hasAbsence && !week.hasPresence)
    && daysBetween(lastThree[2][0], lastThree[0][0]) === 14
    && daysBetween(lastThree[0][1].lastDate, today) <= 7
    && (!lastPresence || daysBetween(lastPresence, today) >= 21)
}

/** A ausência só é contabilizada quando existe uma chamada marcada como Ausente. */
export function monthAttendanceRows(
  student: AttendanceStudent,
  entries: AttendanceEntry[],
  cancellations: { date: string; class_schedule: string }[],
  month: string,
  today: string,
) {
  const start = month + "-01"
  const [year, monthNumber] = month.split("-").map(Number)
  const daysInMonth = new Date(Date.UTC(year, monthNumber, 0)).getUTCDate()
  const registered = student.registrationDate?.slice(0, 10)
  const records = new Map<string, AttendanceEntry>()
  for (const entry of entries) {
    if (entry.studentId !== student.id || !entry.date.startsWith(month)) continue
    records.set(`${entry.date}|${entry.schedule}`, entry)
  }
  const cancelled = new Set(cancellations.map(item => `${item.date}|${item.class_schedule}`))
  const rows: { date: string; schedule: string; status: "Presente" | "Ausente" | "Cancelado" | "Sem chamada" }[] = []
  for (let day = 1; day <= daysInMonth; day++) {
    const date = `${month}-${String(day).padStart(2, "0")}`
    if (date > today || date < start || (registered && date < registered)) continue
    for (const schedule of slotsForDay(student, date)) {
      const key = `${date}|${schedule}`
      const record = records.get(key)
      rows.push({ date, schedule, status: record?.status || (cancelled.has(key) ? "Cancelado" : "Sem chamada") })
      records.delete(key)
    }
  }
  // Preserve real historical calls even when the student's current timetable has changed.
  for (const record of records.values()) {
    if (record.date <= today) rows.push({ date: record.date, schedule: record.schedule, status: record.status })
  }
  return rows.sort((a, b) => b.date.localeCompare(a.date) || b.schedule.localeCompare(a.schedule))
}
