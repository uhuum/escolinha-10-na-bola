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
      className="fixed inset-0 z-[9999] flex items-start justify-center bg-background/72 px-4 pt-24 backdrop-blur-[1.5px] sm:pt-28"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="flex items-center gap-3 rounded-2xl border bg-background/95 px-4 py-3 shadow-lg shadow-black/5">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold leading-none text-foreground">Atualizando período</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {hasPeriod ? `${month} de ${year}` : "Carregando os pagamentos do período selecionado..."}
          </p>
        </div>
      </div>
    </div>
  )
}
