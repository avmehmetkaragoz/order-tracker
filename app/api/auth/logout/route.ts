/**
 * Logout API Endpoint
 * 
 * Bu endpoint kullanıcı çıkışı için kullanılır
 * - Session cookie'sini temizler
 * - Cache'i invalidate eder
 */

import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    // Create response
    const response = NextResponse.json({
      success: true,
      message: 'Başarıyla çıkış yapıldı'
    })

    // Clear auth session cookie
    response.cookies.set('auth-session', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0, // Immediately expire
      path: '/'
    })

    // Add cache control headers to prevent caching
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate')
    response.headers.set('Pragma', 'no-cache')
    response.headers.set('Expires', '0')

    return response

  } catch (error) {
    return NextResponse.json(
      { 
        success: false, 
        error: 'Çıkış sırasında bir hata oluştu' 
      },
      { status: 500 }
    )
  }
}

// Also support GET for simple logout links
export async function GET(request: NextRequest) {
  return POST(request)
}