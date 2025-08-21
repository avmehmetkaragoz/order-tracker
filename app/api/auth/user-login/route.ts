/**
 * Multi-User Login API Endpoint
 * 
 * Bu endpoint personel yönetim sistemi için kullanıcı girişi sağlar
 * Mevcut admin login sistemini genişletir
 */

import { NextRequest, NextResponse } from 'next/server'
import { userRepo } from '@/lib/user-repo'
import type { LoginRequest } from '@/types/user'

export async function POST(request: NextRequest) {
  try {
    const body: LoginRequest = await request.json()
    
    // Input validation
    if (!body.username || !body.password) {
      return NextResponse.json(
        {
          success: false,
          error: 'Kullanıcı adı ve şifre gereklidir'
        },
        { status: 400 }
      )
    }

    // Trim inputs
    const username = body.username.trim()
    const password = body.password.trim()

    if (username.length < 3) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Kullanıcı adı en az 3 karakter olmalıdır' 
        },
        { status: 400 }
      )
    }

    // Check for legacy admin login (backward compatibility)
    const adminPassword = process.env.AUTH_PASSWORD || process.env.ADMIN_PASSWORD || 'deka_2025'
    
    if (username === 'admin' && password === adminPassword) {
      // Legacy admin login - create session
      const response = NextResponse.json({
        success: true,
        user: {
          id: 'legacy-admin',
          username: 'admin',
          full_name: 'Sistem Yöneticisi',
          role: 'admin',
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        permissions: [], // Admin has all permissions
        legacy: true
      })

      // Set session cookie
      response.cookies.set('auth-session', 'legacy-admin', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 30 * 24 * 60 * 60 // 30 days
      })

      return response
    }

    // Try database user login
    const loginResult = await userRepo.login({ username, password })

    if (!loginResult.success) {
      // Log failed login attempt
      await userRepo.logActivity({
        action: 'user.login.failed',
        resource_type: 'user',
        details: {
          username,
          reason: loginResult.error,
          ip_address: request.headers.get('x-forwarded-for') || 'unknown',
          user_agent: request.headers.get('user-agent') || 'unknown'
        },
        ip_address: request.headers.get('x-forwarded-for') || undefined,
        user_agent: request.headers.get('user-agent') || undefined
      })

      return NextResponse.json(
        { 
          success: false, 
          error: loginResult.error 
        },
        { status: 401 }
      )
    }

    // Successful login - create session
    const response = NextResponse.json({
      success: true,
      user: loginResult.user,
      permissions: loginResult.permissions,
      legacy: false
    })

    // Set session cookie with user ID
    response.cookies.set('auth-session', loginResult.user!.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60 // 30 days
    })

    // Log successful login
    await userRepo.logActivity({
      user_id: loginResult.user!.id,
      action: 'user.login.success',
      resource_type: 'user',
      resource_id: loginResult.user!.id,
      details: {
        username: loginResult.user!.username,
        ip_address: request.headers.get('x-forwarded-for') || 'unknown',
        user_agent: request.headers.get('user-agent') || 'unknown'
      },
      ip_address: request.headers.get('x-forwarded-for') || undefined,
      user_agent: request.headers.get('user-agent') || undefined
    })

    return response

  } catch (error) {

    return NextResponse.json(
      { 
        success: false, 
        error: 'Giriş sırasında bir hata oluştu' 
      },
      { status: 500 }
    )
  }
}

// GET endpoint to check current session
export async function GET(request: NextRequest) {
  try {
    const sessionCookie = request.cookies.get('auth-session')
    
    if (!sessionCookie?.value) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Oturum bulunamadı' 
        },
        { status: 401 }
      )
    }

    // Check for legacy admin session
    if (sessionCookie.value === 'legacy-admin') {
      return NextResponse.json({
        success: true,
        user: {
          id: 'legacy-admin',
          username: 'admin',
          full_name: 'Sistem Yöneticisi',
          role: 'admin',
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        permissions: [],
        legacy: true
      })
    }

    // Get user from database
    const user = await userRepo.getUserWithPermissions(sessionCookie.value)
    
    if (!user || !user.is_active) {
      // Invalid session - clear cookie
      const response = NextResponse.json(
        { 
          success: false, 
          error: 'Geçersiz oturum' 
        },
        { status: 401 }
      )
      
      response.cookies.delete('auth-session')
      return response
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        full_name: user.full_name,
        role: user.role,
        is_active: user.is_active,
        created_at: user.created_at,
        updated_at: user.updated_at,
        created_by: user.created_by,
        last_login: user.last_login
      },
      permissions: user.permissions,
      legacy: false
    })

  } catch (error) {

    return NextResponse.json(
      { 
        success: false, 
        error: 'Oturum kontrolü sırasında bir hata oluştu' 
      },
      { status: 500 }
    )
  }
}