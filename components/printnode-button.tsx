"use client"

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Printer, Loader2, CheckCircle, XCircle } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface PrintNodeButtonProps {
  zplData: string
  label?: string
  title?: string
  onSuccess?: () => void
  onError?: (error: string) => void
  variant?: 'default' | 'outline' | 'secondary' | 'destructive' | 'ghost' | 'link'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  className?: string
  disabled?: boolean
}

export function PrintNodeButton({
  zplData,
  label = 'PrintNode Yazdır',
  title = 'Etiket Yazdırma',
  onSuccess,
  onError,
  variant = 'default',
  size = 'sm',
  className = '',
  disabled = false
}: PrintNodeButtonProps) {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [lastResult, setLastResult] = useState<'success' | 'error' | null>(null)

  const handlePrint = async () => {
    if (!zplData || disabled) return

    setIsLoading(true)
    setLastResult(null)

    try {
      const response = await fetch('/api/print', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          zplData,
          title
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Yazdırma hatası')
      }

      // Başarılı yazdırma
      setLastResult('success')
      
      toast({
        title: "PrintNode Yazdırma Başarılı ✅",
        description: `${result.message} (Job ID: ${result.jobId})`,
      })

      onSuccess?.()

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Bilinmeyen hata'
      
      setLastResult('error')
      
      console.error('PrintNode print error:', error)

      toast({
        title: "PrintNode Yazdırma Hatası ❌",
        description: errorMessage,
        variant: "destructive",
      })

      onError?.(errorMessage)
    } finally {
      setIsLoading(false)
      
      // 3 saniye sonra result state'ini temizle
      setTimeout(() => {
        setLastResult(null)
      }, 3000)
    }
  }

  const getIcon = () => {
    if (isLoading) {
      return <Loader2 className="h-4 w-4 animate-spin" />
    }
    
    if (lastResult === 'success') {
      return <CheckCircle className="h-4 w-4 text-green-500" />
    }
    
    if (lastResult === 'error') {
      return <XCircle className="h-4 w-4 text-red-500" />
    }
    
    return <Printer className="h-4 w-4" />
  }

  const getButtonText = () => {
    if (isLoading) {
      return 'Yazdırılıyor...'
    }
    
    if (lastResult === 'success') {
      return 'Başarılı!'
    }
    
    if (lastResult === 'error') {
      return 'Hata!'
    }
    
    return label
  }

  return (
    <Button
      onClick={handlePrint}
      disabled={isLoading || disabled || !zplData}
      variant={variant}
      size={size}
      className={`${className} ${lastResult === 'success' ? 'bg-green-600 hover:bg-green-700' : ''} ${lastResult === 'error' ? 'bg-red-600 hover:bg-red-700' : ''}`}
    >
      {getIcon()}
      <span className="ml-1">{getButtonText()}</span>
    </Button>
  )
}

// Hook for easy PrintNode printing
export function usePrintNode() {
  const { toast } = useToast()

  const printZPL = async (zplData: string, title = 'Etiket Yazdırma') => {
    try {
      const response = await fetch('/api/print', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          zplData,
          title
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Yazdırma hatası')
      }

      toast({
        title: "PrintNode Yazdırma Başarılı ✅",
        description: `${result.message} (Job ID: ${result.jobId})`,
      })

      return result

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Bilinmeyen hata'
      
      toast({
        title: "PrintNode Yazdırma Hatası ❌",
        description: errorMessage,
        variant: "destructive",
      })

      throw error
    }
  }

  return { printZPL }
}
