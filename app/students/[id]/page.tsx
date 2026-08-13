"use client"
import { StudentDetailClient } from "./student-detail-client"

export default async function StudentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  return <StudentDetailClient id={id} />
}
