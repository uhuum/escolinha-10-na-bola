"use client"

const MAX_FILE_BYTES = 20 * 1024 * 1024
const HEIF_EXTENSION = /\.(?:heic|heif)$/i
const ACCEPTED_TYPE = /^(image\/(?:jpeg|png|webp|heic|heif|heic-sequence|heif-sequence))$/i
const ACCEPTED_EXTENSION = /\.(?:jpe?g|png|webp|heic|heif)$/i

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
  if (!heif && !ACCEPTED_TYPE.test(file.type) && !ACCEPTED_EXTENSION.test(file.name)) {
    throw new Error("Selecione uma foto JPG, PNG, WebP, HEIC ou HEIF.")
  }
  if (!file.size || file.size > MAX_FILE_BYTES) {
    throw new Error("A foto precisa ter até 20 MB.")
  }

  if (!heif) return readDataUrl(file)

  // The device decoder works on some Apple browsers; newer HEIF/HEIC files
  // require libheif. All conversion is local to the browser, not a photo API.
  try {
    return await readDataUrl(await convertWithBrowser(file))
  } catch {
    // Prefer a current libheif decoder for modern iPhone HEIF variants.
    // Imported only when a user actually chooses a HEIF/HEIC image.
    try {
      const { heicTo } = await import("heic-to")
      const converted = await heicTo({ blob: file, type: "image/jpeg", quality: 0.92 })
      if (!converted || converted.size === 0) throw new Error("Arquivo não decodificado")
      // Downsample large camera files before opening the crop editor.
      try {
        const jpeg = new File([converted], "foto-decodificada.jpg", { type: "image/jpeg" })
        return await readDataUrl(await convertWithBrowser(jpeg))
      } catch {
        return await readDataUrl(converted)
      }
    } catch (modernError) {
      console.warn("[SIGA] Conversão HEIF moderna não disponível:", modernError)
      // Backward-compatible decoder for HEIC files supported by the old codec.
      try {
        const { default: heic2any } = await import("heic2any")
        const conversion = await heic2any({ blob: file, toType: "image/jpeg", quality: 0.9 })
        const jpeg = Array.isArray(conversion) ? conversion[0] : conversion
        if (!jpeg || jpeg.size === 0) throw new Error("Arquivo não decodificado")
        return await readDataUrl(jpeg)
      } catch {
        throw new Error("Não foi possível decodificar esta foto HEIF/HEIC. Verifique se o arquivo terminou de ser transferido e tente novamente.")
      }
    }
  }
}
