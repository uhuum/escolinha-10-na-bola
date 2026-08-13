"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import { LogOut, Loader2 } from "lucide-react"

interface LogoutSplashProps {
  isOpen: boolean
  userName: string
  onComplete: () => void
}

export function LogoutSplash({ isOpen, userName, onComplete }: LogoutSplashProps) {
  const [phase, setPhase] = useState<"processing" | "complete">("processing")

  useEffect(() => {
    if (isOpen) {
      setPhase("processing")
      // After 1 second, show complete message
      const timer1 = setTimeout(() => {
        setPhase("complete")
      }, 1000)

      // After 2 seconds total, close the splash and logout
      const timer2 = setTimeout(() => {
        onComplete()
      }, 2000)

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
        {/* Logo */}
        <div className="relative h-24 w-24 sm:h-32 sm:w-32 mb-6">
          <Image src="/logo-ceap.png" alt="Logo CEAP" fill className="object-contain" />
        </div>

        {/* User name */}
        <h2 className="text-xl sm:text-2xl font-bold text-white text-center mb-2 text-balance">
          Até logo, {userName}!
        </h2>

        {/* Status message */}
        <div className="flex flex-col items-center gap-3 mt-4">
          {phase === "processing" ? (
            <>
              <Loader2 className="h-8 w-8 text-primary animate-spin" />
              <p className="text-base sm:text-lg text-white/90 animate-pulse">Encerrando sessão...</p>
            </>
          ) : (
            <>
              <div className="h-16 w-16 rounded-full bg-primary flex items-center justify-center animate-in zoom-in duration-300">
                <LogOut className="h-8 w-8 text-white" />
              </div>
              <p className="text-lg sm:text-xl font-semibold text-primary animate-in fade-in duration-300">
                Sessão encerrada!
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
