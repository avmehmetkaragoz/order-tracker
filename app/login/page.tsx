'use client'

/**
 * Personnel Login Page
 * 
 * Bu sayfa personel girişi için kullanılır
 * - Multi-user authentication
 * - Legacy admin support (deka_2025)
 * - Modern user login with bcrypt
 */

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { LoadingSpinner } from '@/components/loading-spinner'
import { Eye, EyeOff, Lock, User, AlertCircle, Info, ArrowLeft } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface LoginState {
  username: string
  password: string
  loading: boolean
  error: string | null
  showPassword: boolean
}

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const [state, setState] = useState<LoginState>({
    username: '',
    password: '',
    loading: false,
    error: null,
    showPassword: false
  })

  // Check if already authenticated
  useEffect(() => {
    checkExistingAuth()
  }, [])

  const checkExistingAuth = async () => {
    try {
      // Check if this is a logout redirect - if so, skip auth check
      const logout = searchParams.get('logout')
      if (logout === 'true') {
        return
      }

      // Add cache busting and no-cache headers
      const response = await fetch('/api/auth/check', {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        }
      })
      const data = await response.json()

      if (data.success && data.user) {
        // Already authenticated, redirect to appropriate page
        const redirect = searchParams.get('redirect') || '/'
        if (data.isAdmin && !redirect.includes('personnel')) {
          router.push('/personnel')
        } else {
          router.push(redirect)
        }
      }
    } catch (error) {
      // Not authenticated, stay on login page
    }
  }

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
          <div className="mx-auto h-16 w-16 bg-primary rounded-lg flex items-center justify-center">
            <Lock className="h-8 w-8 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Personel Girişi</h1>
            <p className="text-muted-foreground mt-2">
              Sipariş Takip - Tedarikçi Sipariş Yönetimi
            </p>
          </div>
        </div>

        {/* Login Form */}
        <Card>
          <CardHeader>
            <CardTitle className="text-center">Giriş Yap</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {state.error && (
                <Card className="border-destructive">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-destructive" />
                      <div className="text-sm text-destructive">
                        <strong>Giriş Hatası:</strong> {state.error}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="space-y-2">
                <Label htmlFor="username">Kullanıcı Adı</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="username"
                    type="text"
                    placeholder="Kullanıcı adınızı girin"
                    value={state.username}
                    onChange={(e) => handleInputChange('username', e.target.value)}
                    disabled={state.loading}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Şifre</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={state.showPassword ? 'text' : 'password'}
                    placeholder="Şifrenizi girin"
                    value={state.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    disabled={state.loading}
                    className="pl-10 pr-10"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3"
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

              <div className="text-center">
                <Button
                  type="button"
                  variant="link"
                  onClick={handleForgotPassword}
                  disabled={state.loading}
                  className="text-sm"
                >
                  Şifremi unuttum
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Info Card */}
        <Card className="bg-muted/30">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <h3 className="text-sm font-medium mb-2">Giriş Bilgileri</h3>
                <div className="text-sm text-muted-foreground space-y-1">
                  <p>• Yönetici hesabı: admin / admin123</p>
                  <p>• Legacy admin: deka_2025 şifresi</p>
                  <p>• Personel hesapları yönetici tarafından oluşturulur</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="text-center space-y-2">
          <Button
            variant="outline"
            onClick={() => router.push('/')}
            className="w-full"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Ana sayfaya dön
          </Button>
          
          <p className="text-xs text-muted-foreground">
            © 2025 Deka Plastik - Sipariş Takip Sistemi
          </p>
        </div>
      </div>
    </div>
  )
}