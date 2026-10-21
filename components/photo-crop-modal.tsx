"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Card } from "@/components/ui/card"
import { ZoomIn, RotateCw, Loader2, CheckCircle2 } from "lucide-react"

interface PhotoCropModalProps {
  isOpen: boolean
  imageSrc: string
  onCropComplete: (croppedImage: string) => void
  onCancel: () => void
}

const PREVIEW = 240
const EXPORT = 600

function drawCrop(
  canvas: HTMLCanvasElement,
  image: HTMLImageElement,
  size: number,
  zoom: number,
  rotation: number,
  offsetX: number,
  offsetY: number,
) {
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext("2d")
  if (!ctx) throw new Error("Editor de imagem indisponível")
  ctx.clearRect(0, 0, size, size)
  ctx.save()
  ctx.scale(size / PREVIEW, size / PREVIEW)
  ctx.translate(PREVIEW / 2, PREVIEW / 2)
  ctx.rotate((rotation * Math.PI) / 180)
  ctx.scale(zoom, zoom)
  ctx.translate(-PREVIEW / 2 + offsetX, -PREVIEW / 2 + offsetY)
  const scale = Math.max(PREVIEW / image.naturalWidth, PREVIEW / image.naturalHeight)
  const x = (PREVIEW - image.naturalWidth * scale) / 2
  const y = (PREVIEW - image.naturalHeight * scale) / 2
  ctx.drawImage(image, x, y, image.naturalWidth * scale, image.naturalHeight * scale)
  ctx.restore()
}

async function generateTransparentPortrait(
  imageSrc: string,
  zoom: number,
  rotation: number,
  offsetX: number,
  offsetY: number,
): Promise<string> {
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new window.Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error("Não foi possível abrir a imagem"))
    img.src = imageSrc
  })
  const canvas = document.createElement("canvas")
  drawCrop(canvas, image, EXPORT, zoom, rotation, offsetX, offsetY)
  const { removeStudentBackground } = await import("@/lib/utils/remove-student-background")
  return removeStudentBackground(canvas)
}

function friendlyCropError(cause: unknown): string {
  return cause instanceof Error && /Não foi possível|Máscara|recortar/.test(cause.message)
    ? cause.message
    : "Não foi possível remover o fundo. Confira a conexão e use Remover fundo para tentar novamente."
}


export function PhotoCropModal({ isOpen, imageSrc, onCropComplete, onCancel }: PhotoCropModalProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [zoom, setZoom] = useState(1)
  const [rotation, setRotation] = useState(0)
  const [offsetX, setOffsetX] = useState(0)
  const [offsetY, setOffsetY] = useState(0)
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null)
  const [processedPhoto, setProcessedPhoto] = useState<string | null>(null)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (!isOpen || !imageSrc || !canvasRef.current || processedPhoto) return
    const canvas = canvasRef.current
    const image = new window.Image()
    image.onload = () => drawCrop(canvas, image, PREVIEW, zoom, rotation, offsetX, offsetY)
    image.onerror = () => setError("Não foi possível abrir esta foto.")
    image.src = imageSrc
  }, [isOpen, imageSrc, zoom, rotation, offsetX, offsetY, processedPhoto])

  useEffect(() => {
    setProcessedPhoto(null)
    setError("")
    setZoom(1)
    setRotation(0)
    setOffsetX(0)
    setOffsetY(0)
  }, [imageSrc])

  const onPointerMove = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!dragStart) return
    const dx = event.clientX - dragStart.x
    const dy = event.clientY - dragStart.y
    setOffsetX(value => value + dx / zoom / 2)
    setOffsetY(value => value + dy / zoom / 2)
    setDragStart({ x: event.clientX, y: event.clientY })
  }

  // A newly selected photo is cut out automatically. The original pixels are
  // preserved; only the alpha mask is changed, and the user approves the preview.
  useEffect(() => {
    if (!isOpen || !imageSrc) return
    let active = true
    setProcessing(true)
    setError("")
    setProcessedPhoto(null)
    void generateTransparentPortrait(imageSrc, 1, 0, 0, 0)
      .then(result => {
        if (active) setProcessedPhoto(result)
      })
      .catch(cause => {
        if (active) setError(friendlyCropError(cause))
      })
      .finally(() => {
        if (active) setProcessing(false)
      })
    return () => { active = false }
  }, [isOpen, imageSrc])

  const removeBackground = async () => {
    if (processing || !imageSrc) return
    setProcessing(true)
    setError("")
    try {
      setProcessedPhoto(await generateTransparentPortrait(imageSrc, zoom, rotation, offsetX, offsetY))
    } catch (cause) {
      setError(friendlyCropError(cause))
    } finally {
      setProcessing(false)
    }
  }

  const reset = () => {
    setZoom(1)
    setRotation(0)
    setOffsetX(0)
    setOffsetY(0)
    setProcessedPhoto(null)
    setError("")
  }

  return (
    <Dialog open={isOpen} onOpenChange={open => !open && !processing && onCancel()}>
      <DialogContent className="max-h-[90vh] max-w-md overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Foto do aluno sem fundo</DialogTitle>
          <DialogDescription>
            O sistema remove o fundo automaticamente. Confira o recorte antes de salvar.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex justify-center rounded-lg bg-white p-4 sm:p-6">
            {processedPhoto ? (
              <img src={processedPhoto} alt="Prévia do aluno com fundo transparente, sobre branco"
                className="h-[240px] w-[240px] rounded-full border-4 border-primary/20 bg-white object-contain shadow-sm" />
            ) : (
              <canvas
                ref={canvasRef}
                className="max-w-full cursor-move touch-none rounded-full border-4 border-primary/20 shadow-sm"
                width={PREVIEW}
                height={PREVIEW}
                style={{ height: "auto", maxWidth: "100%" }}
                onPointerDown={event => {
                  if (processing) return
                  event.currentTarget.setPointerCapture(event.pointerId)
                  setDragStart({ x: event.clientX, y: event.clientY })
                }}
                onPointerMove={onPointerMove}
                onPointerUp={() => setDragStart(null)}
                onPointerCancel={() => setDragStart(null)}
              />
            )}
          </div>

          {processedPhoto ? (
            <div className="flex items-center gap-2 rounded-lg bg-green-50 p-3 text-sm text-green-800">
              <CheckCircle2 className="h-5 w-5 shrink-0" />
              Fundo removido. A foto será salva com transparência e aparecerá sobre branco no SIGA.
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <ZoomIn className="h-4 w-4 text-muted-foreground" />
                  <label className="text-sm font-medium">Zoom</label>
                  <span className="ml-auto text-xs text-muted-foreground">{Math.round(zoom * 100)}%</span>
                </div>
                <Slider value={[zoom]} onValueChange={value => setZoom(value[0])} min={0.5} max={3} step={0.1} disabled={processing} />
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <RotateCw className="h-4 w-4 text-muted-foreground" />
                  <label className="text-sm font-medium">Rotação</label>
                  <span className="ml-auto text-xs text-muted-foreground">{rotation}°</span>
                </div>
                <Slider value={[rotation]} onValueChange={value => setRotation(value[0])} min={0} max={360} step={5} disabled={processing} />
              </div>
              <Card className="border-primary/20 bg-primary/5 p-3">
                <p className="text-xs text-muted-foreground">
                  O recorte é feito no próprio aparelho, sem enviar a foto a outro serviço. Na primeira vez, aguarde o carregamento do modelo.
                </p>
              </Card>
            </div>
          )}

          {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}

          <div className="flex flex-col gap-2 sm:flex-row sm:gap-3">
            <Button variant="outline" disabled={processing} onClick={reset} className="flex-1">
              {processedPhoto ? "Refazer recorte" : "Redefinir"}
            </Button>
            <Button variant="outline" disabled={processing} onClick={onCancel} className="flex-1">Cancelar</Button>
            {processedPhoto ? (
              <Button className="flex-1" onClick={() => onCropComplete(processedPhoto)}>
                Confirmar foto
              </Button>
            ) : (
              <Button className="flex-1" disabled={processing} onClick={() => void removeBackground()}>
                {processing ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Removendo...</> : "Remover fundo"}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
