"use client"

import { usePathname } from "next/navigation"
import { TrainingCancellationRecords } from "@/components/training-cancellation-records"

export default function AttendanceRecordsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  return <>{children}{pathname === "/presencas" && <div className="container mx-auto max-w-6xl px-4 pb-8"><TrainingCancellationRecords /></div>}</>
}
