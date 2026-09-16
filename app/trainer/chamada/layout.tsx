"use client"

import { usePathname } from "next/navigation"
import { TrainingCancellationPanel } from "@/components/training-cancellation-panel"

export default function TrainerAttendanceLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  return <>{children}{pathname === "/trainer/chamada" && <div className="mx-auto max-w-5xl px-2 pb-8 sm:px-0"><TrainingCancellationPanel /></div>}</>
}
