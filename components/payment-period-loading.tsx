"use client"

import { Loader2 } from "lucide-react"

interface PaymentPeriodLoadingProps {
  month?: string
  year?: number
}

export function PaymentPeriodLoading({ month, year }: PaymentPeriodLoadingProps) {
  const hasPeriod = Boolean(month && year)

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-background/55 px-4 backdrop-blur-md"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="flex w-full max-w-sm items-center gap-4 rounded-2xl border bg-background/95 px-5 py-5 shadow-xl shadow-black/10">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10">
          <Loader2 className="h-6 w-6 animate-spin text-primary" aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <p className="text-base font-semibold text-foreground">Atualizando período</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {hasPeriod ? `Carregando pagamentos de ${month} de ${year}...` : "Carregando os pagamentos do período selecionado..."}
          </p>
        </div>
      </div>
    </div>
  )
}
