export const runtime = "nodejs"

import { NextRequest, NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import sharp from "sharp"

// The Netlify request-body limit is lower than the file-upload limit.
// Use the local HEIF decoders for larger files; this is a safe final fallback.
const MAX_INPUT_BYTES = 3_500_000
const MAX_OUTPUT_PIXELS = 40_000_000

function isHeifContainer(bytes: Buffer): boolean {
  if (bytes.length < 16 || bytes.toString("ascii", 4, 8) !== "ftyp") return false
  const header = bytes.subarray(8, Math.min(bytes.length, 64)).toString("ascii")
  return /(?:heic|heix|hevc|hevx|heis|heim|mif1|msf1|avif|avis)/i.test(header)
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data, error } = await supabase.auth.getUser()
    if (error || !data.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }
    if (data.user.app_metadata?.role !== "admin") {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 })
    }

    const file = (await req.formData()).get("file")
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Envie uma foto válida." }, { status: 400 })
    }
    if (file.size <= 0 || file.size > MAX_INPUT_BYTES) {
      return NextResponse.json({ error: "A foto é grande demais para a conversão de reserva." }, { status: 413 })
    }
    const bytes = Buffer.from(await file.arrayBuffer())
    if (!isHeifContainer(bytes)) {
      return NextResponse.json({ error: "O arquivo não contém uma imagem HEIF válida." }, { status: 415 })
    }

    // Sharp can decode certain HEIF/AVIF profiles depending on libvips. 
    // Other profiles are handled by the device-side HEIF decoders before this endpoint.
    let jpeg: Buffer
    try {
      jpeg = await sharp(bytes, { limitInputPixels: MAX_OUTPUT_PIXELS, failOn: "error" })
        .rotate()
        .resize({ width: 1800, height: 1800, fit: "inside", withoutEnlargement: true })
        .jpeg({ quality: 91, mozjpeg: true })
        .toBuffer()
    } catch {
      return NextResponse.json({
        error: "Este tipo de HEIF não é compatível com o conversor de reserva.",
      }, { status: 422 })
    }

    return new NextResponse(new Uint8Array(jpeg), {
      headers: {
        "Content-Type": "image/jpeg",
        "Cache-Control": "private, no-store, max-age=0",
        "X-Content-Type-Options": "nosniff",
      },
    })
  } catch (error) {
    console.error("[SIGA] Falha na conversão HEIF protegida:", error instanceof Error ? error.name : "UnknownError")
    return NextResponse.json({ error: "Não foi possível converter esta imagem." }, { status: 500 })
  }
}
