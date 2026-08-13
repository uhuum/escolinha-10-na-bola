"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Card } from "@/components/ui/card"
import { ZoomIn, RotateCw } from "lucide-react"

interface PhotoCropModalProps {
  isOpen: boolean
  imageSrc: string
  onCropComplete: (croppedImage: string) => void
  onCancel: () => void
}

export function PhotoCropModal({ isOpen, imageSrc, onCropComplete, onCancel }: PhotoCropModalProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [zoom, setZoom] = useState(1)
  const [rotation, setRotation] = useState(0)
  const [offsetX, setOffsetX] = useState(0)
  const [offsetY, setOffsetY] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })

  const canvasSize = 240

  useEffect(() => {
    if (!isOpen || !imageSrc || !canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const img = new window.Image()
    img.crossOrigin = "anonymous"
    img.src = imageSrc
    img.onload = () => {
      canvas.width = canvasSize
      canvas.height = canvasSize

      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.save()
      ctx.translate(canvas.width / 2, canvas.height / 2)
      ctx.rotate((rotation * Math.PI) / 180)
      ctx.scale(zoom, zoom)
      ctx.translate(-canvas.width / 2 + offsetX, -canvas.height / 2 + offsetY)

      const scale = Math.max(canvas.width / img.width, canvas.height / img.height)
      const x = (canvas.width - img.width * scale) / 2
      const y = (canvas.height - img.height * scale) / 2
      ctx.drawImage(img, x, y, img.width * scale, img.height * scale)

      ctx.restore()

      // Draw circular border
      ctx.strokeStyle = "rgba(255, 255, 255, 0.5)"
      ctx.lineWidth = 3
      ctx.beginPath()
      ctx.arc(canvas.width / 2, canvas.height / 2, canvas.width / 2 - 2, 0, Math.PI * 2)
      ctx.stroke()
    }
  }, [isOpen, imageSrc, zoom, rotation, offsetX, offsetY])

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDragging(true)
    setDragStart({ x: e.clientX, y: e.clientY })
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging) return
    const deltaX = e.clientX - dragStart.x
    const deltaY = e.clientY - dragStart.y
    setOffsetX(offsetX + deltaX / zoom / 2)
    setOffsetY(offsetY + deltaY / zoom / 2)
    setDragStart({ x: e.clientX, y: e.clientY })
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (e.touches.length === 1) {
      setIsDragging(true)
      setDragStart({ x: e.touches[0].clientX, y: e.touches[0].clientY })
    }
  }

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDragging || e.touches.length !== 1) return
    const deltaX = e.touches[0].clientX - dragStart.x
    const deltaY = e.touches[0].clientY - dragStart.y
    setOffsetX(offsetX + deltaX / zoom / 2)
    setOffsetY(offsetY + deltaY / zoom / 2)
    setDragStart({ x: e.touches[0].clientX, y: e.touches[0].clientY })
  }

  const handleTouchEnd = () => {
    setIsDragging(false)
  }

  const handleSaveCrop = () => {
    if (canvasRef.current) {
      const croppedImage = canvasRef.current.toDataURL("image/jpeg", 0.9)
      onCropComplete(croppedImage)
    }
  }

  const handleReset = () => {
    setZoom(1)
    setRotation(0)
    setOffsetX(0)
    setOffsetY(0)
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="max-w-md sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Ajustar Foto do Aluno</DialogTitle>
          <DialogDescription>Redimensione e posicione a foto no círculo</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex justify-center bg-muted rounded-lg p-4 sm:p-6">
            <canvas
              ref={canvasRef}
              className="rounded-full border-4 border-primary shadow-lg cursor-move touch-none"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              width={canvasSize}
              height={canvasSize}
              style={{ maxWidth: "100%", height: "auto" }}
            />
          </div>

          {/* Controls */}
          <div className="space-y-4">
            {/* Zoom */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <ZoomIn className="h-4 w-4 text-muted-foreground" />
                <label className="text-sm font-medium">Zoom</label>
                <span className="ml-auto text-xs text-muted-foreground">{(zoom * 100).toFixed(0)}%</span>
              </div>
              <Slider
                value={[zoom]}
                onValueChange={(value) => setZoom(value[0])}
                min={0.5}
                max={3}
                step={0.1}
                className="w-full"
              />
            </div>

            {/* Rotation */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <RotateCw className="h-4 w-4 text-muted-foreground" />
                <label className="text-sm font-medium">Rotação</label>
                <span className="ml-auto text-xs text-muted-foreground">{rotation}°</span>
              </div>
              <Slider
                value={[rotation]}
                onValueChange={(value) => setRotation(value[0])}
                min={0}
                max={360}
                step={5}
                className="w-full"
              />
            </div>

            {/* Info */}
            <Card className="bg-primary/5 border-primary/20 p-3">
              <p className="text-xs text-muted-foreground">
                <strong>Dica:</strong> Arraste a foto para mover, use os controles para zoom e rotação
              </p>
            </Card>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <Button variant="outline" onClick={handleReset} className="flex-1 bg-transparent">
              Redefinir
            </Button>
            <Button onClick={onCancel} variant="outline" className="flex-1 bg-transparent">
              Cancelar
            </Button>
            <Button onClick={handleSaveCrop} className="flex-1">
              Salvar Foto
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
