"use client"

import { FilesetResolver, ImageSegmenter } from "@mediapipe/tasks-vision"

const MODEL = "https://storage.googleapis.com/mediapipe-models/image_segmenter/selfie_segmenter/float16/latest/selfie_segmenter.tflite"
const WASM = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.35/wasm"

let segmenterPromise: Promise<ImageSegmenter> | null = null

async function loadSegmenter() {
  if (!segmenterPromise) {
    segmenterPromise = (async () => {
      const vision = await FilesetResolver.forVisionTasks(WASM)
      return ImageSegmenter.createFromOptions(vision, {
        baseOptions: { modelAssetPath: MODEL, delegate: "CPU" },
        runningMode: "IMAGE",
        outputCategoryMask: false,
        outputConfidenceMasks: true,
      })
    })().catch(error => {
      segmenterPromise = null
      throw error
    })
  }
  return segmenterPromise
}

/** Remove the surroundings locally. The original pixels never leave the browser for AI processing. */
export async function removeStudentBackground(image: HTMLCanvasElement): Promise<string> {
  const segmenter = await loadSegmenter()
  const output = segmenter.segment(image)
  try {
    // MediaPipe SelfieSegmenter normally outputs a single confidence mask:
    // the foreground/person probability. Other segmentation models provide
    // separate background (0) and foreground (1) masks.
    // Do not assume mask[1] exists: this falsely rejected real portraits.
    const confidenceMasks = output.confidenceMasks
    const person = confidenceMasks?.length === 1
      ? confidenceMasks[0]
      : confidenceMasks?.[1]
    if (!person) {
      throw new Error("O modelo de recorte não retornou uma máscara de pessoa. Tente novamente.")
    }

    const confidence = person.getAsFloat32Array()
    const width = person.width, height = person.height
    if (!width || !height || confidence.length !== width * height) {
      throw new Error("Máscara de fundo inválida")
    }
    let visible = 0, highest = 0
    const maskCanvas = document.createElement("canvas")
    maskCanvas.width = width
    maskCanvas.height = height
    const maskContext = maskCanvas.getContext("2d")
    if (!maskContext) throw new Error("Não foi possível processar a transparência")
    const mask = maskContext.createImageData(width, height)
    for (let i = 0; i < confidence.length; i++) {
      const score = Number.isFinite(confidence[i]) ? confidence[i] : 0
      highest = Math.max(highest, score)
      const alpha = Math.max(0, Math.min(1, (score - 0.10) / 0.82))
      if (alpha > 0.5) visible++
      mask.data[i * 4] = 255
      mask.data[i * 4 + 1] = 255
      mask.data[i * 4 + 2] = 255
      mask.data[i * 4 + 3] = Math.round(alpha * 255)
    }
    if (highest < 0.5 || visible < width * height * 0.02 || visible > width * height * 0.97) {
      throw new Error("Não foi possível recortar a pessoa com segurança. Tente outra foto.")
    }
    maskContext.putImageData(mask, 0, 0)

    const canvas = document.createElement("canvas")
    canvas.width = image.width
    canvas.height = image.height
    const ctx = canvas.getContext("2d")
    if (!ctx) throw new Error("Não foi possível montar a foto recortada")
    ctx.drawImage(image, 0, 0)
    ctx.globalCompositeOperation = "destination-in"
    ctx.imageSmoothingEnabled = true
    ctx.drawImage(maskCanvas, 0, 0, canvas.width, canvas.height)
    ctx.globalCompositeOperation = "source-over"
    return canvas.toDataURL("image/png")
  } finally {
    output.close()
  }
}
