/**
 * Authentication Check API Endpoint
 * 
 * Bu endpoint mevcut kullanıcının kimlik doğrulama durumunu kontrol eder
 */

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser, isAdmin } from '@/lib/auth-middleware'

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    
    if (!user || !user.is_active) {
      const response = NextResponse.json({
        success: false,
        authenticated: false,
        user: null,
        isAdmin: false,
        message: 'Kullanıcı kimlik doğrulaması gerekli'
      })
      
      // Add cache control headers to prevent caching
      response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate')
      response.headers.set('Pragma', 'no-cache')
      response.headers.set('Expires', '0')
      
      return response
    }

    const userIsAdmin = isAdmin(user)

    const response = NextResponse.json({
      success: true,
      authenticated: true,
      user: {
        id: user.id,
        username: user.username,
        full_name: user.full_name,
        role: user.role,
        is_active: user.is_active,
        last_login: user.last_login
      },
      isAdmin: userIsAdmin,
      message: 'Kullanıcı kimlik doğrulaması başarılı'
    })
    
    // Add cache control headers to prevent caching
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate')
    response.headers.set('Pragma', 'no-cache')
    response.headers.set('Expires', '0')
    
    return response

  } catch (error) {
    const response = NextResponse.json({
      success: false,
      authenticated: false,
      user: null,
      isAdmin: false,
      error: 'Kimlik doğrulama kontrolü sırasında bir hata oluştu'
    }, { status: 500 })
    
    // Add cache control headers to prevent caching
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate')
    response.headers.set('Pragma', 'no-cache')
    response.headers.set('Expires', '0')
    
    return response
  }
}