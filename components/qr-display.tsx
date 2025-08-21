"use client"

import { useEffect, useState } from "react"
import { QRGenerator } from "@/lib/qr-generator"

interface QRDisplayProps {
  data: string | object
  width?: number
  margin?: number
  color?: {
    dark?: string
    light?: string
  }
  className?: string
  showData?: boolean
}

export function QRDisplay({
  data,
  width = 200,
  margin = 4,
  color = { dark: '#000000', light: '#FFFFFF' },
  className = "",
  showData = false,
}: QRDisplayProps) {
  const [qrDataURL, setQrDataURL] = useState<string>("")
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const generateQR = async () => {
      setIsLoading(true)
      setError(null)
      
      try {
        const qrString = typeof data === 'string' ? data : JSON.stringify(data)
        const dataURL = await QRGenerator.generateDataURL(qrString, {
          width,
          margin,
          color,
        })
        setQrDataURL(dataURL)
      } catch (err) {
        console.error('QR code generation error:', err)
        setError('QR kod oluşturulamadı')
      } finally {
        setIsLoading(false)
      }
    }

    generateQR()
  }, [data, width, margin, color])

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center bg-muted/30 rounded ${className}`} style={{ width, height: width }}>
        <div className="flex flex-col items-center gap-2">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          <span className="text-xs text-muted-foreground">QR kod oluşturuluyor...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`flex items-center justify-center bg-destructive/10 rounded border border-destructive/20 ${className}`} style={{ width, height: width }}>
        <div className="flex flex-col items-center gap-1 p-2">
          <span className="text-xs text-destructive font-medium">Hata</span>
          <span className="text-xs text-destructive/70 text-center">{error}</span>
        </div>
      </div>
    )
  }

  if (!qrDataURL) {
    return (
      <div className={`flex items-center justify-center bg-muted/30 rounded ${className}`} style={{ width, height: width }}>
        <span className="text-xs text-muted-foreground">QR kod yok</span>
      </div>
    )
  }

  return (
    <div className={`flex flex-col items-center ${className}`}>
      <div className="flex items-center justify-center bg-white p-2 rounded border">
        <img 
          src={qrDataURL} 
          alt="QR Kod" 
          className="max-w-full h-auto"
          style={{ width: width - 16, height: width - 16 }}
        />
      </div>
      
      {showData && (
        <div className="mt-2 text-xs text-muted-foreground text-center max-w-full">
          <div className="font-mono bg-muted/50 px-2 py-1 rounded text-xs break-all">
            {typeof data === 'string' ? data : JSON.stringify(data, null, 2)}
          </div>
        </div>
      )}
    </div>
  )
}