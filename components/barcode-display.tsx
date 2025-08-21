"use client"

import { useEffect, useState } from "react"
import { BarcodeGenerator } from "@/lib/barcode-generator"
import { QRDisplay } from "./qr-display"
import { Badge } from "./ui/badge"

interface BarcodeDisplayProps {
  text: string
  width?: number
  height?: number
  fontSize?: number
  showText?: boolean
  className?: string
  type?: 'barcode' | 'qr' | 'both'
  qrData?: object
}

export function BarcodeDisplay({
  text,
  width = 200,
  height = 60,
  fontSize = 12,
  showText = true,
  className = "",
  type = 'qr', // Default to QR code now
  qrData,
}: BarcodeDisplayProps) {
  const [barcodeDataURL, setBarcodeDataURL] = useState<string>("")

  useEffect(() => {
    if (type === 'barcode' || type === 'both') {
      const dataURL = BarcodeGenerator.generateDataURL(text, {
        width,
        height,
        fontSize,
        showText,
      })
      setBarcodeDataURL(dataURL)
    }
  }, [text, width, height, fontSize, showText, type])

  if (type === 'qr') {
    return (
      <div className={`flex flex-col items-center ${className}`}>
        <Badge variant="secondary" className="mb-2 text-xs">QR Kod</Badge>
        <QRDisplay
          data={qrData || text}
          width={width}
          className="border border-gray-200 rounded"
        />
      </div>
    )
  }

  if (type === 'barcode') {
    if (!barcodeDataURL) {
      return (
        <div className={`flex items-center justify-center bg-muted/30 rounded ${className}`} style={{ width, height }}>
          <span className="text-xs text-muted-foreground">Barkod oluşturuluyor...</span>
        </div>
      )
    }

    return (
      <div className={`flex flex-col items-center ${className}`}>
        <Badge variant="outline" className="mb-2 text-xs">Barkod</Badge>
        <img src={barcodeDataURL || "/placeholder.svg"} alt={`Barkod: ${text}`} className="max-w-full h-auto" />
      </div>
    )
  }

  if (type === 'both') {
    return (
      <div className={`flex flex-col items-center space-y-4 ${className}`}>
        {/* QR Code */}
        <div className="flex flex-col items-center">
          <Badge variant="secondary" className="mb-2 text-xs">QR Kod (Yeni)</Badge>
          <QRDisplay
            data={qrData || text}
            width={Math.min(width, 150)}
            className="border border-blue-200 rounded"
          />
        </div>
        
        {/* Barcode */}
        <div className="flex flex-col items-center">
          <Badge variant="outline" className="mb-2 text-xs">Barkod (Eski)</Badge>
          {barcodeDataURL ? (
            <img
              src={barcodeDataURL}
              alt={`Barkod: ${text}`}
              className="max-w-full h-auto opacity-60"
              style={{ maxWidth: width, maxHeight: height }}
            />
          ) : (
            <div className="flex items-center justify-center bg-muted/30 rounded opacity-60" style={{ width, height }}>
              <span className="text-xs text-muted-foreground">Barkod oluşturuluyor...</span>
            </div>
          )}
        </div>
      </div>
    )
  }

  return null
}
