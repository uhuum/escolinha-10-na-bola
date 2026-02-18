"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { X, Download, ZoomIn, ZoomOut, ExternalLink } from "lucide-react"
import Image from "next/image"

interface ReceiptViewerModalProps {
  isOpen: boolean
  onClose: () => void
  receipt: string
  studentName: string
  month: string
}

export function ReceiptViewerModal({ isOpen, onClose, receipt, studentName, month }: ReceiptViewerModalProps) {
  const [zoom, setZoom] = useState(1)

  if (!isOpen) return null

  const isBase64 = receipt.startsWith("data:")
  const isPDF = receipt.toLowerCase().includes(".pdf") || receipt.includes("application/pdf")

  const handleDownload = () => {
    if (isBase64) {
      const link = document.createElement("a")
      link.href = receipt
      link.download = `comprovante-${studentName.replace(/\s+/g, "-")}-${month}.${isPDF ? "pdf" : "png"}`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } else {
      window.open(receipt, "_blank")
    }
  }

  const handleOpenInNewTab = () => {
    if (isBase64) {
      const newWindow = window.open()
      if (newWindow) {
        newWindow.document.write(`
          <html>
            <head><title>Comprovante - ${studentName} - ${month}</title></head>
            <body style="margin:0;display:flex;justify-content:center;align-items:center;min-height:100vh;background:#1a1a1a;">
              ${
                isPDF
                  ? `<embed src="${receipt}" width="100%" height="100%" type="application/pdf" />`
                  : `<img src="${receipt}" style="max-width:100%;max-height:100vh;object-fit:contain;" />`
              }
            </body>
          </html>
        `)
      }
    } else {
      window.open(receipt, "_blank")
    }
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4">
      <Card className="w-full max-w-4xl border-2 max-h-[95vh] sm:max-h-[90vh] overflow-hidden flex flex-col">
        <CardHeader className="flex-shrink-0 border-b p-3 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="min-w-0">
              <CardTitle className="text-base sm:text-lg md:text-xl truncate">Comprovante de Pagamento</CardTitle>
              <CardDescription className="text-xs sm:text-sm md:text-base truncate">
                {studentName} - {month}
              </CardDescription>
            </div>
            <div className="flex items-center gap-1 sm:gap-2 flex-wrap justify-end">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setZoom(Math.max(0.5, zoom - 0.25))}
                title="Diminuir zoom"
                className="h-8 w-8 sm:h-9 sm:w-9"
              >
                <ZoomOut className="h-3 w-3 sm:h-4 sm:w-4" />
              </Button>
              <span className="text-xs sm:text-sm text-muted-foreground w-10 sm:w-12 text-center">
                {Math.round(zoom * 100)}%
              </span>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setZoom(Math.min(3, zoom + 0.25))}
                title="Aumentar zoom"
                className="h-8 w-8 sm:h-9 sm:w-9"
              >
                <ZoomIn className="h-3 w-3 sm:h-4 sm:w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={handleOpenInNewTab}
                title="Abrir em nova aba"
                className="h-8 w-8 sm:h-9 sm:w-9 bg-transparent"
              >
                <ExternalLink className="h-3 w-3 sm:h-4 sm:w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={handleDownload}
                title="Baixar"
                className="h-8 w-8 sm:h-9 sm:w-9 bg-transparent"
              >
                <Download className="h-3 w-3 sm:h-4 sm:w-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 sm:h-9 sm:w-9">
                <X className="h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex-1 overflow-auto p-2 sm:p-4 bg-muted/30">
          <div
            className="flex items-center justify-center min-h-[250px] sm:min-h-[400px]"
            style={{ transform: `scale(${zoom})`, transformOrigin: "center center", transition: "transform 0.2s" }}
          >
            {isPDF ? (
              <div className="text-center p-4 sm:p-8">
                <p className="text-sm sm:text-base text-muted-foreground mb-4">
                  Arquivo PDF não pode ser exibido diretamente.
                </p>
                <Button onClick={handleOpenInNewTab} className="gap-2 text-sm">
                  <ExternalLink className="h-4 w-4" />
                  Abrir PDF em Nova Aba
                </Button>
              </div>
            ) : isBase64 ? (
              <img
                src={receipt || "/placeholder.svg"}
                alt={`Comprovante de ${studentName}`}
                className="max-w-full h-auto rounded-lg shadow-lg"
                style={{ maxHeight: "60vh" }}
              />
            ) : (
              <div className="relative w-full h-[300px] sm:h-[500px]">
                <Image
                  src={receipt || "/placeholder.svg"}
                  alt={`Comprovante de ${studentName}`}
                  fill
                  className="object-contain rounded-lg"
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
