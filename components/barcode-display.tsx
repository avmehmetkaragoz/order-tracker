"use client"

import { useEffect, useState } from "react"
import { BarcodeGenerator } from "@/lib/barcode-generator"

interface BarcodeDisplayProps {
  text: string
  width?: number
  height?: number
  fontSize?: number
  showText?: boolean
  className?: string
}

export function BarcodeDisplay({
  text,
  width = 200,
  height = 60,
  fontSize = 12,
  showText = true,
  className = "",
}: BarcodeDisplayProps) {
  const [barcodeDataURL, setBarcodeDataURL] = useState<string>("")

  useEffect(() => {
    const dataURL = BarcodeGenerator.generateDataURL(text, {
      width,
      height,
      fontSize,
      showText,
    })
    setBarcodeDataURL(dataURL)
  }, [text, width, height, fontSize, showText])

  if (!barcodeDataURL) {
    return (
      <div className={`flex items-center justify-center bg-muted/30 rounded ${className}`} style={{ width, height }}>
        <span className="text-xs text-muted-foreground">Barkod oluşturuluyor...</span>
      </div>
    )
  }

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <img src={barcodeDataURL || "/placeholder.svg"} alt={`Barkod: ${text}`} className="max-w-full h-auto" />
    </div>
  )
}
