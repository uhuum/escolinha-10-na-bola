"use client"

import { usePathname } from "next/navigation"
import { TrainingCancellationRecords } from "@/components/training-cancellation-records"
import { TrainingAttendanceCalendar } from "@/components/training-attendance-calendar"

export default function AttendanceRecordsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  if (pathname !== "/presencas") return <>{children}</>
  return <>
    <div className="container mx-auto max-w-6xl px-4 pt-6"><TrainingAttendanceCalendar /></div>
    {children}
    <div className="container mx-auto max-w-6xl px-4 pb-8"><TrainingCancellationRecords /></div>
  </>
}
