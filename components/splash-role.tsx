"use client"

import { useEffect, useState } from "react"
import Image from "next/image"

interface SplashRoleProps {
  role: "admin" | "coach"
  userName?: string
  onComplete?: () => void
  duration?: number
}

const roleMessages = {
  admin: "Bem-vindo, Administrador",
  coach: "Bem-vindo, Treinador",
}

export function SplashRole({ role, userName, onComplete, duration = 1000 }: SplashRoleProps) {
  const [isVisible, setIsVisible] = useState(true)
  const [showText, setShowText] = useState(false)

  useEffect(() => {
    // Show text after a slight delay
    const textTimer = setTimeout(() => setShowText(true), 300)

    // Hide splash after duration
    const hideTimer = setTimeout(() => {
      setIsVisible(false)
      onComplete?.()
    }, duration)

    return () => {
      clearTimeout(textTimer)
      clearTimeout(hideTimer)
    }
  }, [duration, onComplete])

  if (!isVisible) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-primary via-primary/95 to-accent/20">
      {/* Animated accent shapes */}
      <div className="absolute inset-0 overflow-hidden opacity-20">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-accent rounded-full" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-accent/30 rounded-full" />
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center space-y-6">
        <div className="animate-bounce-slow">
          <div className="relative w-28 h-28">
            <Image src="/logo.png" alt="Logo CEAP" fill className="object-contain drop-shadow-lg" priority />
          </div>
        </div>

        {showText && (
          <div className="text-center animate-fade-in">
            <h2 className="text-3xl font-bold text-white mb-2">{roleMessages[role]}</h2>
            {userName && <p className="text-accent text-lg font-semibold">{userName}</p>}
          </div>
        )}

        {/* Progress indicator */}
        <div className="w-12 h-1 bg-white/20 rounded-full overflow-hidden mt-8">
          <div className="h-full bg-gradient-to-r from-accent to-accent/50 rounded-full animate-progress" />
        </div>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes bounce-slow {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-20px);
          }
        }

        @keyframes progress {
          from {
            width: 0;
          }
          to {
            width: 100%;
          }
        }

        .animate-fade-in {
          animation: fade-in 0.6s ease-out;
        }

        .animate-bounce-slow {
          animation: bounce-slow 2s ease-in-out;
        }

        .animate-progress {
          animation: progress 1s ease-out forwards;
        }
      `}</style>
    </div>
  )
}
