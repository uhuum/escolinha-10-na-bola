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
const MAX_OUTPUT_BYTES = 500 * 1024
const MAX_INPUT_BYTES = 8 * 1024 * 1024
const ALLOWED_INPUT_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"])

function getAdminClient() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error("Supabase server configuration is missing")
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
}

async function compressToWebP(buffer: Buffer, width: number, quality: number): Promise<Buffer> {
  let result = await sharp(buffer, { limitInputPixels: 40_000_000, failOn: "error" })
    .rotate()
    .resize(width, width, { fit: "inside", withoutEnlargement: true })
    .webp({ quality })
    .toBuffer()

  let q = quality
  while (result.byteLength > MAX_OUTPUT_BYTES && q > 20) {
    q -= 10
    result = await sharp(buffer, { limitInputPixels: 40_000_000, failOn: "error" })
      .rotate()
      .resize(width, width, { fit: "inside", withoutEnlargement: true })
      .webp({ quality: q })
      .toBuffer()
  }

  if (result.byteLength > MAX_OUTPUT_BYTES) throw new Error("Imagem excede o limite permitido")
  return result
}

export async function POST(req: NextRequest) {
  try {
    const auth = await createServerSupabaseClient()
    const { data: authData, error: authError } = await auth.auth.getUser()
    const role = authData.user?.app_metadata?.role
    if (authError || !authData.user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    if (role !== "admin") return NextResponse.json({ error: "Acesso negado" }, { status: 403 })

    const formData = await req.formData()
    const file = formData.get("file") as File | null
    if (!file) return NextResponse.json({ error: "Nenhum arquivo enviado" }, { status: 400 })
    if (!ALLOWED_INPUT_TYPES.has(file.type.toLowerCase())) {
      return NextResponse.json({ error: "Formato de imagem não permitido" }, { status: 400 })
    }
    if (file.size <= 0 || file.size > MAX_INPUT_BYTES) {
      return NextResponse.json({ error: "Imagem muito grande" }, { status: 413 })
    }

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
      await supabase.storage.from(BUCKET).remove([fullPath, thumbPath])
      throw fullUpload.error || thumbUpload.error
    }

    const photoUrl = `/api/student-photo?path=${encodeURIComponent(fullPath)}`
    const thumbnailUrl = `/api/student-photo?path=${encodeURIComponent(thumbPath)}`

    return NextResponse.json(
      { photoUrl, thumbnailUrl },
      { headers: { "Cache-Control": "private, no-store, max-age=0", "X-Content-Type-Options": "nosniff" } },
    )
  } catch (error) {
    console.error("[SIGA] Erro ao processar imagem:", error)
    return NextResponse.json({ error: "Erro ao processar imagem" }, { status: 500 })
  }
}
