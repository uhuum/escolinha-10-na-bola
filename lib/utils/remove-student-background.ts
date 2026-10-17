"use client"

import { FilesetResolver, ImageSegmenter } from "@mediapipe/tasks-vision"

const PERSON_MODEL = "https://storage.googleapis.com/mediapipe-models/image_segmenter/selfie_segmenter/float16/latest/selfie_segmenter.tflite"
const HAIR_MODEL = "https://storage.googleapis.com/mediapipe-models/image_segmenter/hair_segmenter/float32/latest/hair_segmenter.tflite"
const WASM = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.35/wasm"

let visionPromise: ReturnType<typeof FilesetResolver.forVisionTasks> | null = null
let personPromise: Promise<ImageSegmenter> | null = null
let hairPromise: Promise<ImageSegmenter> | null = null

function loadVision() {
  if (!visionPromise) {
    visionPromise = FilesetResolver.forVisionTasks(WASM).catch(error => {
      visionPromise = null
      throw error
    })
  }
  return visionPromise
}

function loadPersonSegmenter() {
  if (!personPromise) {
    personPromise = (async () => ImageSegmenter.createFromOptions(await loadVision(), {
      baseOptions: { modelAssetPath: PERSON_MODEL, delegate: "CPU" },
      runningMode: "IMAGE",
      outputCategoryMask: false,
      outputConfidenceMasks: true,
    }))().catch(error => {
      personPromise = null
      throw error
    })
  }
  return personPromise
}

function loadHairSegmenter() {
  if (!hairPromise) {
    hairPromise = (async () => ImageSegmenter.createFromOptions(await loadVision(), {
      baseOptions: { modelAssetPath: HAIR_MODEL, delegate: "CPU" },
      runningMode: "IMAGE",
      outputCategoryMask: false,
      outputConfidenceMasks: true,
    }))().catch(error => {
      hairPromise = null
      throw error
    })
  }
  return hairPromise
}

type SegmentationMask = { width: number; height: number; confidence: Float32Array }

function getForegroundMask(segmenter: ImageSegmenter, image: HTMLCanvasElement): SegmentationMask {
  const output = segmenter.segment(image)
  try {
    // Models with two categories expose background at 0 and person/hair at 1.
    // Some models expose just the foreground confidence mask.
    const masks = output.confidenceMasks
    const foreground = masks?.length === 1 ? masks[0] : masks?.[1]
    if (!foreground) throw new Error("O modelo de recorte não retornou uma máscara válida.")
    const confidence = new Float32Array(foreground.getAsFloat32Array())
    const { width, height } = foreground
    if (!width || !height || confidence.length !== width * height) {
      throw new Error("Máscara de fundo inválida")
    }
    return { width, height, confidence }
  } finally {
    output.close()
  }
}

function clamp(value: number) {
  return Math.max(0, Math.min(1, value))
}

function smoothstep(start: number, end: number, value: number) {
  const t = clamp((value - start) / (end - start))
  return t * t * (3 - 2 * t)
}

/** Upsample the model's confidence without quantizing it to an 8-bit image. */
function upsampleMask(mask: SegmentationMask, width: number, height: number): Float32Array {
  const result = new Float32Array(width * height)
  const xs = new Float32Array(width)
  const ys = new Float32Array(height)
  for (let x = 0; x < width; x++) xs[x] = Math.max(0, Math.min(mask.width - 1, (x + 0.5) * mask.width / width - 0.5))
  for (let y = 0; y < height; y++) ys[y] = Math.max(0, Math.min(mask.height - 1, (y + 0.5) * mask.height / height - 0.5))
  for (let y = 0; y < height; y++) {
    const cy = ys[y], y0 = Math.floor(cy), y1 = Math.min(mask.height - 1, y0 + 1), fy = cy - y0
    for (let x = 0; x < width; x++) {
      const cx = xs[x], x0 = Math.floor(cx), x1 = Math.min(mask.width - 1, x0 + 1), fx = cx - x0
      const a = mask.confidence[y0 * mask.width + x0]
      const b = mask.confidence[y0 * mask.width + x1]
      const c = mask.confidence[y1 * mask.width + x0]
      const d = mask.confidence[y1 * mask.width + x1]
      result[y * width + x] = clamp(((a * (1 - fx) + b * fx) * (1 - fy)) + ((c * (1 - fx) + d * fx) * fy))
    }
  }
  return result
}

/** Only accept extra hair strands connected to the original person silhouette. */
function closeToPerson(person: Float32Array, x: number, y: number, width: number, height: number): boolean {
  const radius = Math.max(7, Math.round(Math.min(width, height) * 0.025))
  const offsets = [-radius, 0, radius]
  for (const dy of offsets) {
    const ny = Math.max(0, Math.min(height - 1, y + dy))
    for (const dx of offsets) {
      const nx = Math.max(0, Math.min(width - 1, x + dx))
      if (person[ny * width + nx] > 0.42) return true
    }
  }
  return false
}

/** Preserve small hairs by smoothing transparency only between visually similar pixels. */
function refineEdges(matte: Float32Array, pixels: Uint8ClampedArray, width: number, height: number) {
  const refined = new Float32Array(matte.length)
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = y * width + x
      const alpha = matte[i]
      if (alpha <= 0.02 || alpha >= 0.98) {
        refined[i] = alpha
        continue
      }
      const center = i * 4
      let weighted = 0, total = 0
      for (let dy = -2; dy <= 2; dy++) {
        const ny = y + dy
        if (ny < 0 || ny >= height) continue
        for (let dx = -2; dx <= 2; dx++) {
          const nx = x + dx
          if (nx < 0 || nx >= width) continue
          const ni = ny * width + nx
          const n = ni * 4
          const dr = pixels[center] - pixels[n]
          const dg = pixels[center + 1] - pixels[n + 1]
          const db = pixels[center + 2] - pixels[n + 2]
          const colorWeight = 1 / (1 + (dr * dr + dg * dg + db * db) / 1200)
          const spatialWeight = 1 / (1 + (dx * dx + dy * dy) * 0.5)
          const weight = colorWeight * spatialWeight
          weighted += matte[ni] * weight
          total += weight
        }
      }
      refined[i] = clamp(alpha * 0.45 + (weighted / total) * 0.55)
    }
  }
  return refined
}

/** Remove the surroundings locally; never redraw or modify the student's face or hair pixels. */
export async function removeStudentBackground(image: HTMLCanvasElement): Promise<string> {
  const personMask = getForegroundMask(await loadPersonSegmenter(), image)
  const width = image.width, height = image.height
  if (!width || !height) throw new Error("Foto inválida")
  const person = upsampleMask(personMask, width, height)
  let visible = 0, highest = 0
  for (const value of person) {
    if (value > 0.5) visible++
    if (value > highest) highest = value
  }
  if (highest < 0.5 || visible < width * height * 0.02 || visible > width * height * 0.97) {
    throw new Error("Não foi possível recortar a pessoa com segurança. Tente outra foto.")
  }

  // Higher-resolution model specialized in hair; if it cannot load (for example
  // offline on a mobile phone), keep the original person mask as a safe fallback.
  let hair: Float32Array | null = null
  try {
    hair = upsampleMask(getForegroundMask(await loadHairSegmenter(), image), width, height)
  } catch (error) {
    console.warn("[SIGA] Refinamento de cabelo indisponível; usando recorte padrão:", error)
  }

  const canvas = document.createElement("canvas")
  canvas.width = width
  canvas.height = height
  const context = canvas.getContext("2d", { willReadFrequently: true })
  if (!context) throw new Error("Não foi possível montar a foto recortada")
  context.drawImage(image, 0, 0)
  const imageData = context.getImageData(0, 0, width, height)
  const matte = new Float32Array(width * height)
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = y * width + x
      const base = smoothstep(0.05, 0.94, person[i])
      let alpha = base
      if (hair && hair[i] > 0.12 && closeToPerson(person, x, y, width, height)) {
        alpha = Math.max(alpha, smoothstep(0.12, 0.90, hair[i]))
      }
      matte[i] = alpha
    }
  }

  const refined = refineEdges(matte, imageData.data, width, height)
  for (let i = 0; i < refined.length; i++) {
    // Do not erase pre-existing transparency when a photo is moved or zoomed.
    imageData.data[i * 4 + 3] = Math.round(imageData.data[i * 4 + 3] * refined[i])
  }
  context.putImageData(imageData, 0, 0)
  return canvas.toDataURL("image/png")
}
