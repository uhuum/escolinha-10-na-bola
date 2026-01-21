"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import { CheckCircle2, Loader2 } from "lucide-react"

interface AttendanceSplashProps {
  isOpen: boolean
  studentName: string
  studentPhoto?: string
  onComplete: () => void
}

export function AttendanceSplash({ isOpen, studentName, studentPhoto, onComplete }: AttendanceSplashProps) {
  const [phase, setPhase] = useState<"processing" | "complete">("processing")

  useEffect(() => {
    if (isOpen) {
      setPhase("processing")
      // After 1.5 seconds, show complete message
      const timer1 = setTimeout(() => {
        setPhase("complete")
      }, 1500)

      // After 2.5 seconds total, close the splash
      const timer2 = setTimeout(() => {
        onComplete()
      }, 2500)

      return () => {
        clearTimeout(timer1)
        clearTimeout(timer2)
      }
    }
  }, [isOpen, onComplete])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Blurred background */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-md" />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center p-6 animate-in fade-in zoom-in duration-300">
        {/* Student photo */}
        <div className="relative h-32 w-32 sm:h-40 sm:w-40 rounded-full overflow-hidden border-4 border-primary shadow-2xl mb-6">
          <Image
            src={studentPhoto || "/placeholder.svg?height=160&width=160&query=student portrait"}
            alt={studentName}
            fill
            className="object-cover"
          />
        </div>

        {/* Student name */}
        <h2 className="text-xl sm:text-2xl font-bold text-white text-center mb-4 text-balance">{studentName}</h2>

        {/* Status message */}
        <div className="flex flex-col items-center gap-3">
          {phase === "processing" ? (
            <>
              <Loader2 className="h-8 w-8 text-primary animate-spin" />
              <p className="text-base sm:text-lg text-white/90 animate-pulse">Dando baixa no sistema...</p>
            </>
          ) : (
            <>
              <div className="h-16 w-16 rounded-full bg-green-500 flex items-center justify-center animate-in zoom-in duration-300">
                <CheckCircle2 className="h-10 w-10 text-white" />
              </div>
              <p className="text-lg sm:text-xl font-semibold text-green-400 animate-in fade-in duration-300">
                Concluído!
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
