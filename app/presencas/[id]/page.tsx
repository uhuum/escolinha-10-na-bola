import { AppHeader } from "@/components/app-header"
import { AttendanceDetailContent } from "@/components/attendance-detail-content"
import { BackButton } from "./back-button"

export default async function AttendanceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <AppHeader />
      <main className="flex-1 container mx-auto px-4 py-5 sm:py-8">
        <div className="max-w-5xl mx-auto space-y-4 sm:space-y-6">
          <BackButton />
          <AttendanceDetailContent attendanceId={id} />
        </div>
      </main>
    </div>
  )
}
