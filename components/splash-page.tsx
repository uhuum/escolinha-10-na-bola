"use client"

import { useEffect, useState } from "react"
import Image from "next/image"

interface SplashPageProps {
  onComplete?: () => void
  duration?: number
}

export function SplashPage({ onComplete, duration = 800 }: SplashPageProps) {
  const [isVisible, setIsVisible] = useState(true)
  const [phase, setPhase] = useState<"intro" | "animate" | "exit">("intro")

  useEffect(() => {
    const timings = [
      { phase: "animate", time: 300 },
      { phase: "exit", time: duration - 200 },
    ]

    const timers = timings.map((timing) =>
      setTimeout(() => {
        setPhase(timing.phase as any)
      }, timing.time),
    )

    const finalTimer = setTimeout(() => {
      setIsVisible(false)
      onComplete?.()
    }, duration)

    return () => {
      timers.forEach((timer) => clearTimeout(timer))
      clearTimeout(finalTimer)
    }
  }, [duration, onComplete])

  if (!isVisible) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-blue-950 via-slate-950 to-blue-950 overflow-hidden">
      <div className="absolute inset-0">
        {/* Accent lights - using CEAP blue and red colors */}
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-gradient-to-br from-blue-600/40 to-transparent rounded-full blur-3xl animate-pulse" />
        <div
          className="absolute bottom-0 right-0 w-80 h-80 bg-gradient-to-bl from-red-600/30 to-transparent rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "1s" }}
        />
        <div
          className="absolute top-1/3 right-1/4 w-72 h-72 bg-gradient-to-bl from-yellow-400/20 to-transparent rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "0.5s" }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center text-center px-4">
        {/* Logo container */}
        <div
          className={`transition-all duration-700 ease-out transform ${
            phase === "intro"
              ? "scale-0 opacity-0 -rotate-12"
              : phase === "animate"
                ? "scale-100 opacity-100 rotate-0"
                : "scale-95 opacity-50"
          }`}
        >
          <div className="w-28 h-28 sm:w-36 sm:h-36 flex items-center justify-center bg-gradient-to-br from-white/10 to-white/5 rounded-full p-2 backdrop-blur-sm border border-white/10 shadow-2xl">
            <Image
              src="/logo-ceap.png"
              alt="CEAP Logo"
              width={144}
              height={144}
              className="object-contain drop-shadow-2xl"
              priority
            />
          </div>
        </div>

        {/* Text content */}
        <div
          className={`transition-all duration-700 ease-out delay-200 mt-6 sm:mt-8 ${
            phase === "intro" ? "opacity-0 translate-y-4" : "opacity-100 translate-y-0"
          }`}
        >
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-1 drop-shadow-lg">Sistema SIGA</h2>
          <p className="text-xs sm:text-sm text-blue-100 drop-shadow">Gerenciamento de Alunos e Pagamentos</p>
        </div>

        {/* Loading indicator */}
        <div
          className={`transition-all duration-500 ease-out delay-300 mt-6 sm:mt-8 ${
            phase === "intro" ? "opacity-0" : "opacity-100"
          }`}
        >
          <div className="flex gap-1">
            <div
              className="w-2 h-2 sm:w-2.5 sm:h-2.5 bg-blue-400 rounded-full animate-bounce"
              style={{ animationDelay: "0ms" }}
            />
            <div
              className="w-2 h-2 sm:w-2.5 sm:h-2.5 bg-red-400 rounded-full animate-bounce"
              style={{ animationDelay: "150ms" }}
            />
            <div
              className="w-2 h-2 sm:w-2.5 sm:h-2.5 bg-yellow-400 rounded-full animate-bounce"
              style={{ animationDelay: "300ms" }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
