"use client"

import { useEffect, useState } from "react"
import Image from "next/image"

interface SplashRoleProps {
  role: "admin" | "coach"
  userName?: string
  onComplete?: () => void
  duration?: number
}

type SplashPhase = "welcome" | "loading" | "complete"

const roleMessages = {
  admin: "Bem-vindo, Administrador",
  coach: "Bem-vindo, Treinador",
}

export function SplashRole({ role, userName, onComplete, duration = 2500 }: SplashRoleProps) {
  const [phase, setPhase] = useState<SplashPhase>("welcome")
  const [fadeOut, setFadeOut] = useState(false)

  useEffect(() => {
    // Phase 1: Welcome message (1.2s)
    const welcomeTimer = setTimeout(() => {
      setPhase("loading")
    }, 1200)

    // Phase 2: Loading system data (1.3s more)
    const loadingTimer = setTimeout(() => {
      setFadeOut(true)
    }, duration - 400)

    // Complete and hide
    const completeTimer = setTimeout(() => {
      setPhase("complete")
      onComplete?.()
    }, duration)

    return () => {
      clearTimeout(welcomeTimer)
      clearTimeout(loadingTimer)
      clearTimeout(completeTimer)
    }
  }, [duration, onComplete])

  if (phase === "complete") return null

  return (
    <div
      className={`fixed inset-0 z-[100] flex items-center justify-center bg-gradient-to-br from-[#0a1628] via-[#132644] to-[#0a1628] overflow-hidden transition-opacity duration-400 ${fadeOut ? "opacity-0" : "opacity-100"}`}
    >
      {/* Background effects */}
      <div className="absolute inset-0">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-gradient-to-br from-blue-600/40 to-transparent rounded-full blur-3xl animate-pulse" />
        <div
          className="absolute top-1/3 right-0 w-80 h-80 bg-gradient-to-bl from-red-500/35 to-transparent rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "1s" }}
        />
        <div
          className="absolute -bottom-40 left-1/4 w-96 h-96 bg-gradient-to-t from-blue-600/30 to-transparent rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "2s" }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center text-center px-4">
        {/* Logo */}
        <div className="relative mb-6 sm:mb-8">
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500 to-red-500 blur-2xl opacity-50 -z-10" />
          <div className="relative w-28 h-28 sm:w-36 sm:h-36 flex items-center justify-center">
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

        {/* Title */}
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white mb-2 tracking-tighter">SIGA</h1>
        <div className="w-16 h-1 bg-gradient-to-r from-blue-500 via-white to-red-500 mx-auto mb-6 rounded-full" />

        {/* Phase-based messages */}
        <div className="min-h-[100px] flex flex-col items-center justify-center">
          {phase === "welcome" && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-2">{roleMessages[role]}</p>
              {userName && <p className="text-lg sm:text-xl text-blue-300 font-semibold">{userName}</p>}
              <p className="text-sm sm:text-base text-blue-200/70 mt-2">Sistema Integrado de Gestão de Alunos</p>
            </div>
          )}

          {phase === "loading" && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <p className="text-lg sm:text-xl text-blue-100 mb-4">Carregando dados do sistema...</p>
              <div className="flex items-center justify-center gap-2">
                <div className="w-3 h-3 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                <div className="w-3 h-3 bg-white rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                <div className="w-3 h-3 bg-red-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          )}
        </div>

        {/* Progress bar */}
        <div className="w-48 h-1 bg-white/20 rounded-full overflow-hidden mt-8">
          <div
            className={`h-full bg-gradient-to-r from-blue-500 via-white to-red-500 rounded-full transition-all ease-out ${
              phase === "welcome" ? "w-1/2 duration-1000" : "w-full duration-1300"
            }`}
          />
        </div>
      </div>
    </div>
  )
}
