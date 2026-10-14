import type { Metadata, Viewport } from "next"
import { EnrollmentForm } from "@/components/enrollment/public-form"
export const metadata: Metadata = { title: "Matrícula | 10 na Bola", robots: { index: false, follow: false }, referrer: "no-referrer" }
export const viewport: Viewport = { width: "device-width", initialScale: 1, maximumScale: 5, userScalable: true }
export default async function EnrollmentPage({ searchParams }: { searchParams: Promise<{ convite?: string }> }) {
  const { convite } = await searchParams
  return <EnrollmentForm token={convite || ""} />
}
