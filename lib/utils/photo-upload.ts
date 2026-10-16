"use client"

const MAX_FILE_BYTES = 20 * 1024 * 1024
const HEIF_EXTENSION = /\.(?:heic|heif)$/i
const ACCEPTED_TYPE = /^(image\/(?:jpeg|png|webp|heic|heif|heic-sequence|heif-sequence))$/i

function readDataUrl(file: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => typeof reader.result === "string" ? resolve(reader.result) : reject(new Error("Falha ao abrir imagem"))
    reader.onerror = () => reject(new Error("Falha ao ler a imagem"))
    reader.readAsDataURL(file)
  })
}

async function convertWithBrowser(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file)
  try {
    const canvas = document.createElement("canvas")
    const scale = Math.min(1, 1800 / Math.max(bitmap.width, bitmap.height))
    canvas.width = Math.max(1, Math.round(bitmap.width * scale))
    canvas.height = Math.max(1, Math.round(bitmap.height * scale))
    const ctx = canvas.getContext("2d")
    if (!ctx) throw new Error("Canvas indisponível")
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
    return await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error("Falha na conversão")), "image/jpeg", 0.92)
    })
  } finally {
    bitmap.close()
  }
}

/** Only a JPEG preview is generated; the final portrait is a transparent PNG. */
export async function photoPreviewDataUrl(file: File): Promise<string> {
  const heif = HEIF_EXTENSION.test(file.name) || /image\/hei[cf]/i.test(file.type)
  if (!heif && !ACCEPTED_TYPE.test(file.type)) {
    throw new Error("Selecione uma foto JPG, PNG, WebP, HEIC ou HEIF.")
  }
  if (!file.size || file.size > MAX_FILE_BYTES) {
    throw new Error("A foto precisa ter até 20 MB.")
  }

  if (!heif) return readDataUrl(file)

  // Try the device decoder first (Safari), then an offline, on-device HEIF decoder.
  try {
    return await readDataUrl(await convertWithBrowser(file))
  } catch {
    try {
      const { default: heic2any } = await import("heic2any")
      const conversion = await heic2any({ blob: file, toType: "image/jpeg", quality: 0.92 })
      const jpeg = Array.isArray(conversion) ? conversion[0] : conversion
      if (!jpeg) throw new Error("Sem imagem")
      return await readDataUrl(jpeg)
    } catch {
      throw new Error("Este arquivo HEIF não pôde ser convertido. Exporte a foto como JPEG e tente novamente.")
    }
  }
}
