import Image from "next/image"
import { Loader2 } from "lucide-react"

export default function Loading() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background px-6 text-center" role="status" aria-live="polite">
      <div className="relative h-24 w-24 overflow-hidden rounded-2xl bg-white p-2 shadow-lg">
        <Image src="/logo.png" alt="SIGA" fill className="object-contain p-2" priority />
      </div>
      <div className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">SIGA</h1>
        <p className="text-sm text-muted-foreground">Carregando registros de treinos...</p>
      </div>
      <Loader2 className="h-6 w-6 animate-spin text-primary" aria-hidden="true" />
    </main>
  )
}
