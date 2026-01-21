import type { PaymentStatus } from "@/lib/types"
import { Badge } from "@/components/ui/badge"
import { Check } from "lucide-react"

interface PaymentStatusBadgeProps {
  status: PaymentStatus
  size?: "sm" | "md" | "lg"
}

export function PaymentStatusBadge({ status, size = "sm" }: PaymentStatusBadgeProps) {
  const sizeClasses = {
    sm: "text-xs px-2 py-0.5",
    md: "text-sm px-3 py-1",
    lg: "text-base px-4 py-1.5 font-semibold",
  }

  const variants: Record<
    PaymentStatus,
    { variant: "default" | "secondary" | "destructive" | "outline"; label: string; className?: string; icon?: boolean }
  > = {
    Pago: {
      variant: "default",
      label: "PAGO",
      className: "bg-green-600 hover:bg-green-700 text-white border-green-600 shadow-sm",
      icon: true,
    },
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

  const effectiveSize = status === "Pago" && size === "sm" ? "md" : size

  return (
    <Badge
      variant={config.variant}
      className={`${sizeClasses[effectiveSize]} ${config.className || ""} inline-flex items-center gap-1`}
    >
      {config.icon && <Check className="h-3.5 w-3.5" />}
      {config.label}
    </Badge>
  )
}
