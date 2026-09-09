"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import { ShieldCheck, UsersRound } from "lucide-react"

interface SplashRoleProps {
  role: "admin" | "coach"
  userName?: string
  onComplete?: () => void
  duration?: number
}

const roleContent = {
  admin: {
    eyebrow: "SISTEMA ADMINISTRATIVO",
    title: "Bem-vindo ao sistema Administrativo",
    description: "Preparando seu painel no SIGA",
    Icon: ShieldCheck,
    accent: "bg-blue-500",
    soft: "bg-blue-500/10 text-blue-300 border-blue-400/15",
  },
  coach: {
    eyebrow: "SISTEMA DE TREINADORES",
    title: "Bem-vindo ao sistema dos Treinadores",
    description: "Preparando suas turmas e chamadas no SIGA",
    Icon: UsersRound,
    accent: "bg-red-500",
    soft: "bg-red-500/10 text-red-300 border-red-400/15",
  },
}

export function SplashRole({ role, userName, onComplete, duration = 720 }: SplashRoleProps) {
  const [closing, setClosing] = useState(false)
  const [done, setDone] = useState(false)
  const content = roleContent[role]
  const Icon = content.Icon

  useEffect(() => {
    const fadeTimer = window.setTimeout(() => setClosing(true), Math.max(250, duration - 180))
    const completeTimer = window.setTimeout(() => {
      setDone(true)
      onComplete?.()
    }, duration)

    return () => {
      window.clearTimeout(fadeTimer)
      window.clearTimeout(completeTimer)
    }
  }, [duration, onComplete])

  if (done) return null

  return (
    <div
      className={`fixed inset-0 z-[100] flex items-center justify-center overflow-hidden bg-[#081321] px-5 transition-opacity duration-200 ${closing ? "opacity-0" : "opacity-100"}`}
      role="status"
      aria-live="polite"
    >
      <div className="absolute inset-x-0 top-0 h-px bg-white/10" />
      <div className="absolute left-1/2 top-1/2 h-80 w-80 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/[0.025] blur-3xl" />

      <div className="relative z-10 w-full max-w-sm text-center">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl border border-white/10 bg-white/[0.045] shadow-2xl shadow-black/20">
          <Image src="/logo-ceap.png" alt="Logo CEAP" width={58} height={58} className="object-contain" priority />
        </div>

        <div className={`mx-auto mb-4 inline-flex items-center gap-2 rounded-full border px-3 py-1.5 ${content.soft}`}>
          <Icon className="h-3.5 w-3.5" />
          <span className="text-[10px] font-bold tracking-[0.16em]">{content.eyebrow}</span>
        </div>

        <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">{content.title}</h1>
        {userName && <p className="mt-2 text-sm font-medium text-white/75">{userName}</p>}
        <p className="mt-2 text-sm text-white/45">{content.description}</p>

        <div className="mx-auto mt-8 h-1 w-40 overflow-hidden rounded-full bg-white/10">
          <div className={`h-full w-2/3 animate-[siga-entry_0.7s_ease-in-out_infinite_alternate] rounded-full ${content.accent}`} />
        </div>
      </div>

      <style jsx>{`
        @keyframes siga-entry {
          from { transform: translateX(-65%); }
          to { transform: translateX(115%); }
        }
      `}</style>
    </div>
  )
}
