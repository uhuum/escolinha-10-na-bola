"use client"

import Image from "next/image"

type SectionLoadingScreenProps = {
  title: string
  description: string
}

export function SectionLoadingScreen({ title, description }: SectionLoadingScreenProps) {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden bg-gradient-to-br from-[#0a1628] via-[#132644] to-[#0a1628]" role="status" aria-live="polite" aria-busy="true">
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute -left-32 -top-32 h-80 w-80 animate-pulse rounded-full bg-gradient-to-br from-blue-600/30 to-transparent blur-3xl" />
        <div className="absolute right-0 top-1/3 h-64 w-64 animate-pulse rounded-full bg-gradient-to-bl from-red-500/25 to-transparent blur-3xl" />
        <div className="absolute -bottom-32 left-1/4 h-80 w-80 animate-pulse rounded-full bg-gradient-to-t from-blue-600/25 to-transparent blur-3xl" />
      </div>
      <div className="relative z-10 flex flex-col items-center justify-center px-5 text-center">
        <div className="relative mb-6">
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500 to-red-500 opacity-40 blur-xl" />
          <div className="relative flex h-20 w-20 items-center justify-center sm:h-24 sm:w-24">
            <Image src="/logo-ceap.png" alt="Logo 10 na Bola" width={96} height={96} className="object-contain drop-shadow-xl" priority />
          </div>
        </div>
        <div className="mb-4 flex items-center justify-center gap-2" aria-hidden="true">
          <span className="h-3 w-3 animate-bounce rounded-full bg-blue-400" style={{ animationDelay: "0ms" }} />
          <span className="h-3 w-3 animate-bounce rounded-full bg-white" style={{ animationDelay: "150ms" }} />
          <span className="h-3 w-3 animate-bounce rounded-full bg-red-400" style={{ animationDelay: "300ms" }} />
        </div>
        <p className="text-base font-medium text-white sm:text-lg">{title}</p>
        <p className="mt-1 max-w-sm text-sm text-blue-200/70">{description}</p>
      </div>
    </div>
  )
}
