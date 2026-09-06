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

  const path = req.nextUrl.searchParams.get("path") || ""
  if (!/^(full|thumb)\/[a-f0-9-]+\.webp$/i.test(path)) {
    return new NextResponse("Not found", { status: 404 })
  }

  try {
    const { data, error } = await getAdminClient().storage.from(BUCKET).download(path)
    if (error || !data) return new NextResponse("Not found", { status: 404 })

    return new NextResponse(await data.arrayBuffer(), {
      headers: {
        "Content-Type": "image/webp",
        "Cache-Control": "private, max-age=86400, stale-while-revalidate=604800",
        "X-Content-Type-Options": "nosniff",
      },
    })
  } catch {
    return new NextResponse("Not found", { status: 404 })
  }
}
