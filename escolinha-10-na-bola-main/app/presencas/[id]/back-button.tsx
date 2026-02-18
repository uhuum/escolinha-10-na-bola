"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"

interface BackButtonProps {
  className?: string
}

export function BackButton({ className }: BackButtonProps) {
  const router = useRouter()

  return (
    <Button onClick={() => router.push("/presencas")} variant="ghost" className={className || "mb-4"}>
      <ArrowLeft className="h-4 w-4 mr-2" />
      Voltar
    </Button>
  )
}
