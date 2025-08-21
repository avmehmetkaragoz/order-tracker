import { NextRequest, NextResponse } from 'next/server'

// Güvenlik için environment variable'dan şifreyi al
// AUTH_PASSWORD ve ADMIN_PASSWORD'u destekle (backward compatibility)
const ADMIN_PASSWORD = process.env.AUTH_PASSWORD || process.env.ADMIN_PASSWORD || 'deka_2025'
const AUTH_SECRET = process.env.AUTH_SECRET || 'secure-auth-token-2024'

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json()

    // Production debug için environment variable kontrolü
    console.log('🔍 DEBUG - Environment Variables:')
    console.log('AUTH_PASSWORD exists:', !!process.env.AUTH_PASSWORD)
    console.log('AUTH_PASSWORD value:', process.env.AUTH_PASSWORD)
    console.log('ADMIN_PASSWORD exists:', !!process.env.ADMIN_PASSWORD)
    console.log('ADMIN_PASSWORD value:', process.env.ADMIN_PASSWORD)
    console.log('Final ADMIN_PASSWORD used:', ADMIN_PASSWORD)
    console.log('Final ADMIN_PASSWORD length:', ADMIN_PASSWORD?.length)
    console.log('Input password:', password)
    console.log('Input password length:', password?.length)
    console.log('Passwords match:', password === ADMIN_PASSWORD)
    console.log('NODE_ENV:', process.env.NODE_ENV)

    // Şifre kontrolü
    if (!password || password !== ADMIN_PASSWORD) {
      console.log('❌ Authentication failed - Password mismatch')
      return NextResponse.json(
        { error: 'Geçersiz şifre' },
        { status: 401 }
      )
    }

    console.log('✅ Authentication successful')

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