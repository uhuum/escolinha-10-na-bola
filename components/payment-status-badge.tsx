import type { PaymentStatus } from "@/lib/types"
import { Badge } from "@/components/ui/badge"

interface PaymentStatusBadgeProps {
  status: PaymentStatus
}

export function PaymentStatusBadge({ status }: PaymentStatusBadgeProps) {
  const variants: Record<
    PaymentStatus,
    { variant: "default" | "secondary" | "destructive" | "outline"; label: string; className?: string }
  > = {
    Pago: { variant: "default", label: "Pago", className: "bg-accent text-accent-foreground" },
    "Não Pagou": { variant: "destructive", label: "Não Pagou" },
    "Em Aberto": {
      variant: "outline",
      label: "Em Aberto",
      className: "border-yellow-500 text-yellow-700 dark:text-yellow-400",
    },
    Bolsista: { variant: "secondary", label: "Bolsista" },
    AFASTADO: { variant: "outline", label: "Afastado" },
    Novo: { variant: "secondary", label: "Novo" },
    Cobrado: {
      variant: "outline",
      label: "Cobrado",
      className: "border-orange-500 text-orange-700 dark:text-orange-400",
    },
    Adiado: { variant: "outline", label: "Adiado", className: "border-blue-500 text-blue-700 dark:text-blue-400" },
  }

  const config = variants[status]

  return (
    <Badge variant={config.variant} className={`text-xs ${config.className || ""}`}>
      {config.label}
    </Badge>
  )
}
