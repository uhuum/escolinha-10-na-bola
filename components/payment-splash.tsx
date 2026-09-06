"use client"

import Image from "next/image"
import { CheckCircle2, Loader2, XCircle } from "lucide-react"

type PaymentSplashStatus = "processing" | "success" | "error"

interface PaymentSplashProps {
  isOpen: boolean
  studentName: string
  studentPhoto?: string
  paymentType: "dinheiro" | "pix"
  status: PaymentSplashStatus
  errorMessage?: string
  onClose?: () => void
}

export function PaymentSplash({
  isOpen,
  studentName,
  studentPhoto,
  paymentType,
  status,
  errorMessage,
  onClose,
}: PaymentSplashProps) {
  if (!isOpen) return null

  const paymentLabel = paymentType === "dinheiro" ? "dinheiro" : "PIX"

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/65 backdrop-blur-sm" />

      <div className="relative z-10 w-full max-w-sm rounded-3xl bg-background p-6 shadow-2xl border animate-in fade-in zoom-in-95 duration-200">
        <div className="flex flex-col items-center text-center">
          <div className="relative h-20 w-20 overflow-hidden rounded-full border-2 border-primary/20 bg-muted shadow-sm">
            <Image
              src={studentPhoto || "/placeholder.svg?height=96&width=96&query=student portrait"}
              alt={studentName}
              fill
              sizes="80px"
              className="object-cover"
            />
          </div>

          <h2 className="mt-4 text-lg font-bold text-foreground text-balance">{studentName}</h2>

          {status === "processing" && (
            <div className="mt-5 flex flex-col items-center gap-3" aria-live="polite">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                <Loader2 className="h-7 w-7 animate-spin text-primary" />
              </div>
              <div>
                <p className="font-semibold">Dando baixa na mensalidade...</p>
                <p className="mt-1 text-sm text-muted-foreground">Confirmando pagamento em {paymentLabel}</p>
              </div>
            </div>
          )}

          {status === "success" && (
            <div className="mt-5 flex flex-col items-center gap-3" aria-live="polite">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100">
                <CheckCircle2 className="h-8 w-8 text-emerald-600" />
              </div>
              <div>
                <p className="font-semibold text-emerald-700">Mensalidade dada baixa!</p>
                <p className="mt-1 text-sm text-muted-foreground">Pagamento em {paymentLabel} salvo com sucesso.</p>
              </div>
            </div>
          )}

          {status === "error" && (
            <div className="mt-5 flex w-full flex-col items-center gap-3" aria-live="assertive">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-100">
                <XCircle className="h-8 w-8 text-red-600" />
              </div>
              <div>
                <p className="font-semibold text-red-700">Não foi possível dar baixa</p>
                <p className="mt-1 text-sm text-muted-foreground">{errorMessage || "Tente novamente em instantes."}</p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="mt-1 w-full rounded-xl border px-4 py-2.5 text-sm font-semibold hover:bg-muted"
              >
                Fechar
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
