"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import Image from "next/image"
import { Eye, EyeOff, LogIn, Lock, ArrowLeft, Info } from "lucide-react"
import { LoadingSpinner } from "@/components/loading-spinner"
import { ActivityLogger } from "@/lib/activity-logger"

interface LoginState {
  username: string
  password: string
  showPassword: boolean
  loading: boolean
  error: string | null
}

function LoginContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  
  const [state, setState] = useState<LoginState>({
    username: '',
    password: '',
    showPassword: false,
    loading: false,
    error: null
  })

  // Check if user is already authenticated
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/check', {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache'
          }
        })
        const data = await response.json()

        if (data.success && data.user) {
          // User is already authenticated, redirect to main page
          router.push('/')
        }
      } catch (error) {
        // Not authenticated, stay on login page
      }
    }

    // Only check auth if not coming from logout
    const isLogout = searchParams.get('logout')
    if (!isLogout) {
      checkAuth()
    }
  }, [router, searchParams])

  const handleInputChange = (field: keyof LoginState, value: string | boolean) => {
    setState(prev => ({
      ...prev,
      [field]: value,
      error: null // Clear error when user types
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!state.username.trim() || !state.password.trim()) {
      setState(prev => ({
        ...prev,
        error: 'Kullanıcı adı ve şifre gereklidir'
      }))
      return
    }

    setState(prev => ({ ...prev, loading: true, error: null }))

    try {
      // Try multi-user login first
      const response = await fetch('/api/auth/user-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username: state.username,
          password: state.password
        })
      })

      const data = await response.json()

      if (data.success) {
        // Login successful
        
        toast({
          title: "Giriş Başarılı",
          description: `Hoş geldiniz, ${data.user.full_name || data.user.username}!`
        })
        
        // Log activity
        ActivityLogger.userLogin({
          username: state.username,
          login_type: 'database'
        })
        
        // Redirect based on user role or redirect parameter
        const redirect = searchParams.get('redirect') || '/'
        if (data.user.role === 'admin' && !redirect.includes('personnel')) {
          router.push('/personnel')
        } else {
          router.push(redirect)
        }
      } else {
        setState(prev => ({
          ...prev,
          error: data.error || 'Giriş başarısız',
          loading: false
        }))
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: 'Giriş sırasında bir hata oluştu',
        loading: false
      }))
    }
  }

  const handleForgotPassword = () => {
    toast({
      title: "Şifre Sıfırlama",
      description: "Şifre sıfırlama özelliği yakında eklenecek. Lütfen yöneticinizle iletişime geçin.",
      variant: "default"
    })
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <Image
            src="/images/company-logo.png"
            alt="Şirket Logosu"
            width={80}
            height={80}
            className="mx-auto"
          />
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Hoş Geldiniz</h1>
            <p className="text-muted-foreground mt-2">Hesabınıza giriş yapın</p>
          </div>
        </div>

        {/* Login Form */}
        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center">Giriş Yap</CardTitle>
            <CardDescription className="text-center">
              Kullanıcı adınız ve şifrenizi girin
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {state.error && (
                <div className="p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md">
                  {state.error}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="username">Kullanıcı Adı</Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="Kullanıcı adınızı girin"
                  value={state.username}
                  onChange={(e) => handleInputChange('username', e.target.value)}
                  disabled={state.loading}
                  autoComplete="username"
                  autoFocus
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Şifre</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={state.showPassword ? "text" : "password"}
                    placeholder="Şifrenizi girin"
                    value={state.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    disabled={state.loading}
                    autoComplete="current-password"
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => handleInputChange('showPassword', !state.showPassword)}
                    disabled={state.loading}
                  >
                    {state.showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <Button
                type="submit"
                disabled={state.loading}
                className="w-full"
                size="lg"
              >
                {state.loading ? (
                  <>
                    <LoadingSpinner size="sm" />
                    <span className="ml-2">Giriş yapılıyor...</span>
                  </>
                ) : (
                  'Giriş Yap'
                )}
              </Button>

            </form>
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="text-center space-y-2">
          <p className="text-xs text-muted-foreground pt-4">
            © 2025 Deka Plastik - Sipariş Takip Sistemi
          </p>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center py-12 px-4">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center space-y-4">
            <div className="mx-auto h-16 w-16 bg-primary rounded-lg flex items-center justify-center">
              <Lock className="h-8 w-8 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Yükleniyor...</h1>
              <p className="text-muted-foreground mt-2">Giriş sayfası hazırlanıyor</p>
            </div>
          </div>
        </div>
      </div>
    }>
      <LoginContent />
    </Suspense>
  )
}
