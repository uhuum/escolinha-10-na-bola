import { NextRequest, NextResponse } from "next/server"
import sharp from "sharp"

const MAX_WIDTH = 800
const THUMB_WIDTH = 200
const WEBP_QUALITY = 70
const THUMB_QUALITY = 60
const MAX_SIZE_BYTES = 500 * 1024 // 500KB

async function compressToWebP(
  buffer: Buffer,
  width: number,
  quality: number,
): Promise<Buffer> {
  let result = await sharp(buffer)
    .resize(width, width, { fit: "inside", withoutEnlargement: true })
    .webp({ quality })
    .toBuffer()

  // If still too large, reduce quality iteratively
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
    const formData = await req.formData()
    const file = formData.get("file") as File | null

    if (!file) {
      return NextResponse.json({ error: "Nenhum arquivo enviado" }, { status: 400 })
    }

    const arrayBuffer = await file.arrayBuffer()
    const inputBuffer = Buffer.from(arrayBuffer)

    // Generate full-size photo (max 800px wide, WebP ~70%)
    const fullBuffer = await compressToWebP(inputBuffer, MAX_WIDTH, WEBP_QUALITY)

    // Generate thumbnail (200px wide, WebP ~60%)
    const thumbBuffer = await compressToWebP(inputBuffer, THUMB_WIDTH, THUMB_QUALITY)

    const toBase64 = (buf: Buffer) =>
      `data:image/webp;base64,${buf.toString("base64")}`

    return NextResponse.json(
      {
        photo: toBase64(fullBuffer),
        thumbnail: toBase64(thumbBuffer),
      },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      },
    )
  } catch (error) {
    console.error("[upload-photo] Error processing image:", error)
    return NextResponse.json({ error: "Erro ao processar imagem" }, { status: 500 })
  }
}
