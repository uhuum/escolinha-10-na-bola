"use client"

import { useEffect, useState } from "react"
import Image from "next/image"

interface SplashStartProps {
  onComplete?: () => void
  duration?: number
}

export function SplashStart({ onComplete, duration = 3000 }: SplashStartProps) {
  const [isVisible, setIsVisible] = useState(true)
  const [phase, setPhase] = useState<"intro" | "animate" | "exit">("intro")

  useEffect(() => {
    const timings = [
      { phase: "animate", time: 800 },
      { phase: "exit", time: duration - 400 },
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-[#0a1628] via-[#132644] to-[#0a1628] overflow-hidden">
      <div className="absolute inset-0">
        {/* Top accent light - blue */}
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-gradient-to-br from-blue-600/40 to-transparent rounded-full blur-3xl animate-pulse" />
        {/* Middle accent - red */}
        <div
          className="absolute top-1/3 right-0 w-80 h-80 bg-gradient-to-bl from-red-500/35 to-transparent rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "1s" }}
        />
        {/* Bottom accent - blue */}
        <div
          className="absolute -bottom-40 left-1/4 w-96 h-96 bg-gradient-to-t from-blue-600/30 to-transparent rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "2s" }}
        />

        {/* Soccer field grid pattern */}
        <div className="absolute inset-0 opacity-5">
          <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="field" x="80" y="80" width="160" height="160" patternUnits="userSpaceOnUse">
                <rect width="160" height="160" fill="none" stroke="white" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#field)" />
          </svg>
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center text-center px-4">
        {/* Logo container with enhanced animation */}
        <div
          className={`transition-all duration-1000 ease-out transform ${
            phase === "intro"
              ? "scale-150 opacity-0"
              : phase === "animate"
                ? "scale-100 opacity-100"
                : "scale-95 opacity-50"
          }`}
        >
          <div className="relative">
            {/* Glow effect - blue to red */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500 to-red-500 blur-2xl opacity-50 -z-10" />
            <div className="relative w-40 h-40 sm:w-56 sm:h-56 flex items-center justify-center">
              <Image
                src="/logo-ceap.png"
                alt="CEAP Logo"
                width={224}
                height={224}
                className="object-contain drop-shadow-2xl"
                priority
              />
            </div>
          </div>
        </div>

        {/* Text content */}
        <div
          className={`transition-all duration-1000 ease-out delay-300 mt-6 sm:mt-8 ${
            phase === "intro" ? "opacity-0 translate-y-8" : "opacity-100 translate-y-0"
          }`}
        >
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black text-white mb-2 tracking-tighter">SIGA</h1>
          {/* Gradient line - blue, white, red */}
          <div className="w-20 h-1.5 bg-gradient-to-r from-blue-500 via-white to-red-500 mx-auto mb-4 rounded-full" />
          <p className="text-lg sm:text-xl text-blue-100 font-bold mb-1">Sistema Integrado de Gestão de Alunos</p>
          <p className="text-sm sm:text-base text-slate-300">Centro de Educação Além da Educação - CEAP</p>
        </div>

        {/* Loading indicator - blue, white, red */}
        <div
          className={`transition-all duration-700 delay-700 mt-8 sm:mt-12 ${
            phase === "exit" ? "opacity-0" : "opacity-100"
          }`}
        >
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-3 h-3 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
            <div className="w-3 h-3 bg-white rounded-full animate-bounce" style={{ animationDelay: "200ms" }} />
            <div className="w-3 h-3 bg-red-400 rounded-full animate-bounce" style={{ animationDelay: "400ms" }} />
          </div>
          <p className="text-xs sm:text-sm text-slate-300 font-light">Carregando sistema...</p>
        </div>
      </div>
    </div>
  )
}
