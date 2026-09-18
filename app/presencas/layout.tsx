"use client"

import { usePathname } from "next/navigation"
import { AppHeader } from "@/components/app-header"
import { TrainingCancellationRecords } from "@/components/training-cancellation-records"
import { TrainingAttendanceCalendar } from "@/components/training-attendance-calendar"

export default function AttendanceRecordsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  if (pathname !== "/presencas") return <>{children}</>

  // Não renderizar a antiga página de histórico aqui: ela carregava e expandia
  // todas as chamadas e listas de alunos abaixo do calendário, criando rolagem enorme.
  // Os alunos são consultados apenas ao abrir a chamada específica pelo calendário.
  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="container mx-auto max-w-6xl space-y-6 px-4 py-6 sm:py-8">
        <header>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Relatório de Presenças</h1>
          <p className="mt-1 text-sm text-muted-foreground">Selecione uma data e abra o horário para consultar os alunos.</p>
        </header>
        <TrainingAttendanceCalendar />
        <TrainingCancellationRecords />
      </main>
    </div>
  )
}
