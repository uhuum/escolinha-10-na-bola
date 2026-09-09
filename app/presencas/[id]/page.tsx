import { AppHeader } from "@/components/app-header"
import { AttendanceDetailContent } from "@/components/attendance-detail-content"
import { BackButton } from "./back-button"

export default async function AttendanceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  return (
    <div className="min-h-screen w-full max-w-full overflow-x-hidden flex flex-col bg-background">
      <AppHeader />
      <main className="flex-1 w-full max-w-full min-w-0 px-4 py-5 sm:container sm:mx-auto sm:py-8">
        <div className="mx-auto w-full max-w-5xl min-w-0 space-y-4 sm:space-y-6">
          <BackButton />
          <AttendanceDetailContent attendanceId={id} />
        </div>
      </main>
    </div>
  )
}
