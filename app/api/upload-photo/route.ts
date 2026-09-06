export const runtime = "nodejs"

import { randomUUID } from "crypto"
import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import sharp from "sharp"
import { createServerSupabaseClient } from "@/lib/supabase/server"

const BUCKET = "student-photos"
const MAX_WIDTH = 800
const THUMB_WIDTH = 200
const WEBP_QUALITY = 70
const THUMB_QUALITY = 60
const MAX_SIZE_BYTES = 500 * 1024

function getAdminClient() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error("Supabase server configuration is missing")
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
}

async function compressToWebP(buffer: Buffer, width: number, quality: number): Promise<Buffer> {
  let result = await sharp(buffer)
    .resize(width, width, { fit: "inside", withoutEnlargement: true })
    .webp({ quality })
    .toBuffer()

  let q = quality
  while (result.byteLength > MAX_SIZE_BYTES && q > 20) {
    q -= 10
    result = await sharp(buffer)
      .resize(width, width, { fit: "inside", withoutEnlargement: true })
      .webp({ quality: q })
      .toBuffer()
  }
  return result
}

export async function POST(req: NextRequest) {
  try {
    const auth = await createServerSupabaseClient()
    const { data: authData, error: authError } = await auth.auth.getUser()
    if (authError || !authData.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const formData = await req.formData()
    const file = formData.get("file") as File | null
    if (!file) return NextResponse.json({ error: "Nenhum arquivo enviado" }, { status: 400 })
    if (!file.type.startsWith("image/")) return NextResponse.json({ error: "Arquivo inválido" }, { status: 400 })

    const inputBuffer = Buffer.from(await file.arrayBuffer())
    const [fullBuffer, thumbBuffer] = await Promise.all([
      compressToWebP(inputBuffer, MAX_WIDTH, WEBP_QUALITY),
      compressToWebP(inputBuffer, THUMB_WIDTH, THUMB_QUALITY),
    ])

    const supabase = getAdminClient()
    const id = randomUUID()
    const fullPath = `full/${id}.webp`
    const thumbPath = `thumb/${id}.webp`

    const [fullUpload, thumbUpload] = await Promise.all([
      supabase.storage.from(BUCKET).upload(fullPath, fullBuffer, { contentType: "image/webp", upsert: false }),
      supabase.storage.from(BUCKET).upload(thumbPath, thumbBuffer, { contentType: "image/webp", upsert: false }),
    ])

    if (fullUpload.error || thumbUpload.error) {
      // Best-effort rollback prevents orphan files when only one upload succeeds.
      await supabase.storage.from(BUCKET).remove([fullPath, thumbPath])
      throw fullUpload.error || thumbUpload.error
    }

    // The bucket is private. The browser receives only same-origin proxy URLs,
    // never the service key or a permanently public Storage URL.
    const photoUrl = `/api/student-photo?path=${encodeURIComponent(fullPath)}`
    const thumbnailUrl = `/api/student-photo?path=${encodeURIComponent(thumbPath)}`

    return NextResponse.json({ photoUrl, thumbnailUrl }, { headers: { "Cache-Control": "no-store" } })
  } catch (error) {
    console.error("[upload-photo] Error processing image:", error)
    return NextResponse.json({ error: "Erro ao processar imagem" }, { status: 500 })
  }
}
