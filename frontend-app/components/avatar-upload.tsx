"use client"

import type React from "react"

import { useState, useRef, type DragEvent } from "react"
import { Camera, Upload, X, ZoomIn, ZoomOut, Check } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type AvatarUploadProps = {
  currentAvatar?: string
  fallback: string
  onUpload: (file: File) => void
}

export function AvatarUpload({ currentAvatar, fallback, onUpload }: AvatarUploadProps) {
  const [preview, setPreview] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [showEditor, setShowEditor] = useState(false)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [zoom, setZoom] = useState(1)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isDraggingImage, setIsDraggingImage] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 })

  const fileInputRef = useRef<HTMLInputElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const editorRef = useRef<HTMLDivElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)

  const handleFile = (file: File) => {
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader()
      reader.onloadend = () => {
        const img = new Image()
        img.onload = () => {
          setImageDimensions({ width: img.width, height: img.height })
          setSelectedImage(reader.result as string)
          setSelectedFile(file)
          setShowEditor(true)
          setZoom(1)
          setPosition({ x: 0, y: 0 })
        }
        img.src = reader.result as string
      }
      reader.readAsDataURL(file)
    }
  }

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }

  const handleRemove = () => {
    setPreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleImageMouseDown = (e: React.MouseEvent) => {
    setIsDraggingImage(true)
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    })
  }

  const handleImageMouseMove = (e: React.MouseEvent) => {
    if (isDraggingImage) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      })
    }
  }

  const handleImageMouseUp = () => {
    setIsDraggingImage(false)
  }

  const handleConfirm = () => {
    if (!canvasRef.current || !selectedImage || !editorRef.current || !imageRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const img = new Image()
    img.onload = () => {
      const outputSize = 200
      canvas.width = outputSize
      canvas.height = outputSize

      const editorSize = editorRef.current?.clientWidth || 400

      const imageAspect = img.width / img.height
      let displayWidth = editorSize
      let displayHeight = editorSize

      if (imageAspect > 1) {
        // Wider than tall - height is constrained
        displayHeight = editorSize / imageAspect
      } else {
        // Taller than wide - width is constrained
        displayWidth = editorSize * imageAspect
      }

      // Calculate centering offset (object-contain centers the image)
      const offsetX = (editorSize - displayWidth) / 2
      const offsetY = (editorSize - displayHeight) / 2

      // Apply zoom to dimensions
      const scaledWidth = displayWidth * zoom
      const scaledHeight = displayHeight * zoom

      // Calculate the center point of the editor
      const centerX = editorSize / 2
      const centerY = editorSize / 2

      // Calculate where the scaled image's top-left corner is
      // Start from center, subtract half the scaled size, add position offset
      const imageLeft = centerX - scaledWidth / 2 + position.x
      const imageTop = centerY - scaledHeight / 2 + position.y

      // Scale everything to output size
      const scale = outputSize / editorSize

      const outputX = imageLeft * scale
      const outputY = imageTop * scale
      const outputWidth = scaledWidth * scale
      const outputHeight = scaledHeight * scale

      console.log("[v0] Crop calculations:", {
        editorSize,
        imageAspect,
        displayWidth,
        displayHeight,
        offsetX,
        offsetY,
        zoom,
        position,
        scaledWidth,
        scaledHeight,
        imageLeft,
        imageTop,
        scale,
        outputX,
        outputY,
        outputWidth,
        outputHeight,
      })

      // Clear and prepare canvas
      ctx.clearRect(0, 0, outputSize, outputSize)
      ctx.save()

      // Create circular clipping path
      ctx.beginPath()
      ctx.arc(outputSize / 2, outputSize / 2, outputSize / 2, 0, Math.PI * 2)
      ctx.closePath()
      ctx.clip()

      // Draw the image
      ctx.drawImage(img, outputX, outputY, outputWidth, outputHeight)
      ctx.restore()

      // Convert to blob
      canvas.toBlob((blob) => {
        if (blob && selectedFile) {
          const croppedFile = new File([blob], selectedFile.name, { type: "image/png" })
          const reader = new FileReader()
          reader.onloadend = () => {
            setPreview(reader.result as string)
            setShowEditor(false)
            onUpload(croppedFile)
            console.log("[v0] Avatar uploaded:", selectedFile.name)
          }
          reader.readAsDataURL(croppedFile)
        }
      }, "image/png")
    }
    img.src = selectedImage
  }

  const handleCancel = () => {
    setShowEditor(false)
    setSelectedImage(null)
    setSelectedFile(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  return (
    <>
      <div className="flex items-center gap-6">
        {/* Avatar Preview */}
        <div className="relative group">
          <Avatar className="h-24 w-24 ring-2 ring-border transition-all group-hover:ring-primary/50">
            <AvatarImage src={preview || currentAvatar} />
            <AvatarFallback className="text-2xl">{fallback}</AvatarFallback>
          </Avatar>
          {preview && (
            <button
              onClick={handleRemove}
              className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Upload Area */}
        <div className="flex-1">
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={cn(
              "border-2 border-dashed rounded-lg p-6 transition-all cursor-pointer",
              isDragging ? "border-primary bg-primary/5 scale-[1.02]" : "border-border hover:border-primary/50",
            )}
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="flex flex-col items-center gap-2 text-center">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                {isDragging ? (
                  <Upload className="h-6 w-6 text-primary animate-bounce" />
                ) : (
                  <Camera className="h-6 w-6 text-primary" />
                )}
              </div>
              <div>
                <p className="text-sm font-medium">
                  {isDragging ? "Drop your image here" : "Click to upload or drag and drop"}
                </p>
                <p className="text-xs text-muted-foreground mt-1">PNG, JPG or GIF (max. 5MB)</p>
              </div>
            </div>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
            aria-label="Upload avatar"
          />
        </div>
      </div>

      {showEditor && selectedImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-lg shadow-lg w-full max-w-lg mx-4 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h3 className="text-lg font-semibold">Adjust Your Avatar</h3>
              <button
                onClick={handleCancel}
                className="h-8 w-8 rounded-full hover:bg-accent flex items-center justify-center transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Editor Area */}
            <div className="p-6">
              <div
                ref={editorRef}
                className="relative w-full aspect-square bg-muted rounded-lg overflow-hidden cursor-move"
                onMouseDown={handleImageMouseDown}
                onMouseMove={handleImageMouseMove}
                onMouseUp={handleImageMouseUp}
                onMouseLeave={handleImageMouseUp}
              >
                <div className="absolute inset-0 flex items-center justify-center">
                  <img
                    ref={imageRef}
                    src={selectedImage || "/placeholder.svg"}
                    alt="Preview"
                    className="max-w-full max-h-full select-none object-contain"
                    style={{
                      transform: `scale(${zoom}) translate(${position.x / zoom}px, ${position.y / zoom}px)`,
                      transition: isDraggingImage ? "none" : "transform 0.1s ease-out",
                    }}
                    draggable={false}
                  />
                </div>
                {/* Circular overlay to show crop area */}
                <div className="absolute inset-0 pointer-events-none">
                  <svg className="w-full h-full">
                    <defs>
                      <mask id="circleMask">
                        <rect width="100%" height="100%" fill="white" />
                        <circle cx="50%" cy="50%" r="50%" fill="black" />
                      </mask>
                    </defs>
                    <rect width="100%" height="100%" fill="black" fillOpacity="0.5" mask="url(#circleMask)" />
                    <circle
                      cx="50%"
                      cy="50%"
                      r="50%"
                      fill="none"
                      stroke="white"
                      strokeWidth="2"
                      strokeDasharray="5,5"
                    />
                  </svg>
                </div>
              </div>

              {/* Zoom Controls */}
              <div className="mt-6 space-y-3">
                <div className="flex items-center gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => setZoom(Math.max(0.5, zoom - 0.1))}
                    disabled={zoom <= 0.5}
                  >
                    <ZoomOut className="h-4 w-4" />
                  </Button>
                  <input
                    type="range"
                    min="0.5"
                    max="3"
                    step="0.1"
                    value={zoom}
                    onChange={(e) => setZoom(Number.parseFloat(e.target.value))}
                    className="flex-1 h-2 bg-muted rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-primary [&::-moz-range-thumb]:border-0"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => setZoom(Math.min(3, zoom + 0.1))}
                    disabled={zoom >= 3}
                  >
                    <ZoomIn className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground text-center">
                  Drag to reposition • Zoom: {Math.round(zoom * 100)}%
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 p-4 border-t border-border bg-muted/30">
              <Button type="button" variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
              <Button type="button" onClick={handleConfirm} className="gap-2">
                <Check className="h-4 w-4" />
                Apply
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Hidden canvas for image processing */}
      <canvas ref={canvasRef} className="hidden" />
    </>
  )
}
