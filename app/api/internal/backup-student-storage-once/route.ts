export const runtime = "nodejs"

import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// One-time backup endpoint. Authenticated by a short-lived bearer token stored
// only in Supabase Vault. Never expose the service role or student photo data
// through unauthenticated endpoints.
export async function POST(request: NextRequest) {
  const bearer = request.headers.get("authorization")?.match(/^Bearer\\s+(\\S+)$/i)?.[1] || ""
  if (!/^[a-f0-9]{64}$/i.test(bearer)) {
    return new NextResponse("Unauthorized", { status: 401 })
  }

  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return new NextResponse("Unavailable", { status: 503 })

  const db = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  const { data: permitted, error: permissionError } =
    await db.rpc("verify_siga_storage_backup_token", { p_token: bearer })

  if (permissionError || permitted !== true) {
    return new NextResponse("Unauthorized", { status: 401 })
  }

  try {
    const bucket = "student-photos"
    const prefixes = ["full", "thumb"] as const
    const listing = await Promise.all(prefixes.map(async prefix => {
      const { data, error } = await db.storage.from(bucket).list(prefix, {
        limit: 1000, offset: 0, sortBy: { column: "name", order: "asc" },
      })
      if (error || !data) throw new Error("Failed to list storage files")
      const paths = data.filter(entry => /^[a-f0-9-]+\\.webp$/i.test(entry.name))
        .map(entry => prefix + "/" + entry.name)
      if (paths.length !== data.length) throw new Error("Unexpected storage file")
      return paths
    }))
    const paths = listing.flat()
    if (paths.length > 1000) throw new Error("Too many storage files")

    const photos = await Promise.all(paths.map(async name => {
      const { data, error } = await db.storage.from(bucket).download(name)
      if (error || !data) throw new Error("Storage download failed")
      const bytes = Buffer.from(await data.arrayBuffer())
      return { bucket, path: name, size: bytes.length,
        content_type: "image/webp", base64: bytes.toString("base64") }
    }))

    return NextResponse.json({
      project_id: "giatwiftvtxqwdljfuil",
      exported_at: new Date().toISOString(),
      files_count: photos.length,
      total_bytes: photos.reduce((sum, photo) => sum + photo.size, 0),
      files: photos,
    }, { headers: { "Cache-Control": "private, no-store" } })
  } catch (error) {
    console.error("[SIGA] One-time storage export failed")
    return new NextResponse("Backup unavailable", { status: 503 })
  }
}
