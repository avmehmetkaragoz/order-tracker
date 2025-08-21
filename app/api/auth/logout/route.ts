import { NextResponse } from 'next/server'

export async function POST() {
  try {
    // Response oluştur
    const response = NextResponse.json(
      { success: true, message: 'Çıkış başarılı' },
      { status: 200 }
    )

    // Auth cookie'sini sil
    response.cookies.set('auth-token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 0, // Hemen sil
      path: '/',
    })

    return response
  } catch (error) {
    console.error('Logout error:', error)
    return NextResponse.json(
      { error: 'Sunucu hatası' },
      { status: 500 }
    )
  }
}