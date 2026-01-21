"use client"

import Image from "next/image"

interface LoadingStudentsProps {
  message?: string
}

export function LoadingStudents({ message = "Carregando alunos..." }: LoadingStudentsProps) {
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-gradient-to-br from-[#0a1628] via-[#132644] to-[#0a1628]">
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-32 -left-32 w-80 h-80 bg-gradient-to-br from-blue-600/30 to-transparent rounded-full blur-3xl animate-pulse" />
        <div
          className="absolute top-1/3 right-0 w-64 h-64 bg-gradient-to-bl from-red-500/25 to-transparent rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "0.5s" }}
        />
        <div
          className="absolute -bottom-32 left-1/4 w-80 h-80 bg-gradient-to-t from-blue-600/25 to-transparent rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "1s" }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center text-center px-4">
        {/* Logo */}
        <div className="relative mb-6">
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500 to-red-500 blur-xl opacity-40" />
          <div className="relative w-24 h-24 sm:w-32 sm:h-32 flex items-center justify-center">
            <Image
              src="/logo-ceap.png"
              alt="CEAP Logo"
              width={128}
              height={128}
              className="object-contain drop-shadow-xl"
              priority
            />
          </div>
        </div>

        {/* Loading animation */}
        <div className="flex items-center justify-center gap-2 mb-4">
          <div className="w-3 h-3 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
          <div className="w-3 h-3 bg-white rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
          <div className="w-3 h-3 bg-red-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
        </div>

        {/* Message */}
        <p className="text-base sm:text-lg text-white font-medium">{message}</p>
        <p className="text-sm text-blue-200/70 mt-1">Por favor, aguarde...</p>
      </div>
    </div>
  )
}
