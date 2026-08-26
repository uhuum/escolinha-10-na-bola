"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { PaymentStatusBadge } from "@/components/payment-status-badge"
import { Button } from "@/components/ui/button"
import { Eye, FileText, Banknote, QrCode } from "lucide-react"
import { formatCurrency } from "@/lib/utils/currency"
import { formatPaymentPeriod, sortPaymentsByDueDate } from "@/lib/utils/payment"
import { formatDueDate, getCurrentMonthNumber, getCurrentYear } from "@/lib/utils/date"
import type { MonthlyPayment } from "@/lib/types"
import { Badge } from "@/components/ui/badge"

interface PaymentHistoryTableProps {
  payments: MonthlyPayment[]
  onViewReceipt?: (receipt: string | File) => void
  sortOrder?: "asc" | "desc"
  isArchived?: boolean
}

export function PaymentHistoryTable({
  payments,
  onViewReceipt,
  sortOrder = "asc",
  isArchived = false,
}: PaymentHistoryTableProps) {
  const currentMonth = getCurrentMonthNumber()
  const currentYear = getCurrentYear()

  const filteredPayments = payments.filter((p) => {
    if (p.monthNumber && p.yearNumber) {
      // Only show payments up to and including current month
      if (p.yearNumber > currentYear) return false
      if (p.yearNumber === currentYear && p.monthNumber > currentMonth) return false
      return true
    }
    return true
  })

  const sortedPayments = sortPaymentsByDueDate(filteredPayments, sortOrder)

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Período</TableHead>
            <TableHead>Vencimento</TableHead>
            <TableHead className="text-right">Valor</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Tipo Pgto</TableHead>
            <TableHead>Data Pgto</TableHead>
            <TableHead className="text-center">Comprovante</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedPayments.map((payment, index) => {
            const displayStatus =
              isArchived && payment.status !== "Pago" && payment.status !== "Bolsista" ? "AFASTADO" : payment.status

            return (
              <TableRow key={index}>
                <TableCell className="font-medium">{formatPaymentPeriod(payment)}</TableCell>
                <TableCell className="text-muted-foreground">
                  {payment.dueDate ? formatDueDate(payment.dueDate) : "-"}
                </TableCell>
                <TableCell className="text-right">
                  {payment.value > 0 ? formatCurrency(payment.value) : "Isento"}
                </TableCell>
                <TableCell>
                  <PaymentStatusBadge status={displayStatus} />
                </TableCell>
                <TableCell>
                  {payment.status === "Pago" && payment.paymentType ? (
                    <Badge variant="outline" className="gap-1">
                      {payment.paymentType === "dinheiro" ? (
                        <>
                          <Banknote className="h-3 w-3" />
                          Dinheiro
                        </>
                      ) : (
                        <>
                          <QrCode className="h-3 w-3" />
                          PIX
                        </>
                      )}
                    </Badge>
                  ) : (
                    <span className="text-muted-foreground text-sm">-</span>
                  )}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {payment.paidAt ? new Date(payment.paidAt).toLocaleDateString("pt-BR") : "-"}
                </TableCell>
                <TableCell className="text-center">
                  {payment.receipt && payment.status === "Pago" && onViewReceipt ? (
                    <Button size="sm" variant="ghost" onClick={() => onViewReceipt(payment.receipt!)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                  ) : payment.status === "Pago" && payment.paymentType === "dinheiro" ? (
                    <span className="text-muted-foreground text-sm">-</span>
                  ) : payment.status === "Pago" ? (
                    <FileText className="h-4 w-4 text-muted-foreground mx-auto" />
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
