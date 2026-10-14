export const runtime = "nodejs"

import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { createServerSupabaseClient } from "@/lib/supabase/server"

const BUCKET = "student-photos"

function getAdminClient() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error("Supabase server configuration is missing")
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
}

export async function GET(req: NextRequest) {
  const auth = await createServerSupabaseClient()
  const { data: authData, error: authError } = await auth.auth.getUser()
  if (authError || !authData.user) return new NextResponse("Unauthorized", { status: 401 })
  const role = authData.user.app_metadata?.role
  if (role !== "admin" && role !== "coach") return new NextResponse("Forbidden", { status: 403 })

  const path = req.nextUrl.searchParams.get("path") || ""
  if (!/^(full|thumb)\/[a-f0-9-]+\.webp$/i.test(path)) {
    return new NextResponse("Not found", { status: 404 })
  }

  try {
    const admin = getAdminClient()
    if (role === "coach") {
      // Coaches can only view the thumbnail of a registered, active student.
      if (!path.startsWith("thumb/")) return new NextResponse("Forbidden", { status: 403 })
      const { data: accessible, error: lookupError } = await admin
        .from("students")
        .select("id")
        .eq("thumbnail_url", `/api/student-photo?path=${encodeURIComponent(path)}`)
        .eq("is_active", true)
        .limit(1)
      if (lookupError || !accessible?.length) return new NextResponse("Not found", { status: 404 })
    }
    const { data, error } = await admin.storage.from(BUCKET).download(path)
    if (error || !data) return new NextResponse("Not found", { status: 404 })

    return new NextResponse(await data.arrayBuffer(), {
      headers: {
        "Content-Type": "image/webp",
        "Cache-Control": "private, no-store, max-age=0",
        "X-Content-Type-Options": "nosniff",
      },
    })
  } catch {
    return new NextResponse("Not found", { status: 404 })
  }
}
