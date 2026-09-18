"use client"

import Image from "next/image"
import { useEffect, useState } from "react"

interface LoadingStudentsProps {
  message?: string
  description?: string
}

// O estado persiste enquanto o módulo estiver carregado: voltar à aba continua
// exibindo a tela de entrada pela rota loading.tsx; mudanças de período usam
// o aviso compacto, sem repetir a tela azul.
let paymentsInitialLoadCompleted = false

export function LoadingStudents({ message = "Carregando alunos...", description }: LoadingStudentsProps) {
  const isPayments = message.toLowerCase().includes("pagamento")
  const [isPeriodChange] = useState(() => isPayments && paymentsInitialLoadCompleted)

  useEffect(() => {
    if (isPayments && !isPeriodChange) paymentsInitialLoadCompleted = true
  }, [isPayments, isPeriodChange])

  if (isPeriodChange) {
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-background/65 p-4 backdrop-blur-md" role="status" aria-live="polite" aria-busy="true">
        <div className="flex w-full max-w-md items-center gap-4 rounded-2xl border bg-card p-5 shadow-xl">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-muted" aria-hidden="true">
            <span className="h-6 w-6 animate-spin rounded-full border-[3px] border-primary border-r-transparent" />
          </span>
          <div className="min-w-0">
            <p className="text-base font-semibold text-foreground">Atualizando período</p>
            <p className="mt-1 text-sm text-muted-foreground">Carregando os pagamentos do período selecionado...</p>
          </div>
        </div>
      </div>
    )
  }

  const subtitle = description ?? (isPayments
    ? "Sincronizando mensalidades e registros financeiros..."
    : "Sincronizando apenas o necessário...")

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-gradient-to-br from-[#0a1628] via-[#132644] to-[#0a1628]" role="status" aria-live="polite" aria-busy="true">
      <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute -top-32 -left-32 h-80 w-80 rounded-full bg-gradient-to-br from-blue-600/30 to-transparent blur-3xl animate-pulse" />
        <div className="absolute right-0 top-1/3 h-64 w-64 rounded-full bg-gradient-to-bl from-red-500/25 to-transparent blur-3xl animate-pulse" style={{ animationDelay: "0.5s" }} />
        <div className="absolute -bottom-32 left-1/4 h-80 w-80 rounded-full bg-gradient-to-t from-blue-600/25 to-transparent blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
      </div>
      <div className="relative z-10 flex flex-col items-center justify-center px-4 text-center">
        <div className="relative mb-6">
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500 to-red-500 opacity-40 blur-xl" />
          <div className="relative flex h-20 w-20 items-center justify-center sm:h-24 sm:w-24">
            <Image src="/logo-ceap.png" alt="Logo 10 na Bola" width={96} height={96} className="object-contain drop-shadow-xl" priority />
          </div>
        </div>
        <div className="mb-4 flex items-center justify-center gap-2" aria-hidden="true">
          <div className="h-3 w-3 animate-bounce rounded-full bg-blue-400" style={{ animationDelay: "0ms" }} />
          <div className="h-3 w-3 animate-bounce rounded-full bg-white" style={{ animationDelay: "150ms" }} />
          <div className="h-3 w-3 animate-bounce rounded-full bg-red-400" style={{ animationDelay: "300ms" }} />
        </div>
        <p className="text-base font-medium text-white sm:text-lg">{message}</p>
        <p className="mt-1 text-sm text-blue-200/70">{subtitle}</p>
      </div>
    </div>
  )
}
