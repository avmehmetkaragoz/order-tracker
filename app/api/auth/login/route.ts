import { NextRequest, NextResponse } from 'next/server'

// Güvenlik için environment variable'dan şifreyi al
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123'
const AUTH_SECRET = process.env.AUTH_SECRET || 'secure-auth-token-2024'

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json()

    // Şifre kontrolü
    if (!password || password !== ADMIN_PASSWORD) {
      return NextResponse.json(
        { error: 'Geçersiz şifre' },
        { status: 401 }
      )
    }

    // Response oluştur ve cookie ayarla
    const response = NextResponse.json(
      { success: true, message: 'Giriş başarılı' },
      { status: 200 }
    )

    // Cookie ayarla (30 gün geçerli)
    response.cookies.set('auth-token', AUTH_SECRET, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 30 * 24 * 60 * 60, // 30 gün
      path: '/',
    })

    return response
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Sunucu hatası' },
      { status: 500 }
    )
  }
}