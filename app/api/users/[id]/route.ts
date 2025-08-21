/**
 * Individual User Management API Endpoints
 * 
 * Bu endpoint tek kullanıcı için CRUD operasyonları sağlar
 * Sadece admin kullanıcıları bu endpoint'leri kullanabilir
 */

import { NextRequest, NextResponse } from 'next/server'
import { userRepo } from '@/lib/user-repo'
import type { UpdateUserRequest } from '@/types/user'

// Helper function to get current user from session
async function getCurrentUser(request: NextRequest) {
  const sessionCookie = request.cookies.get('auth-session')
  
  if (!sessionCookie?.value) {
    return null
  }

  // Check for legacy admin
  if (sessionCookie.value === 'legacy-admin') {
    return {
      id: 'legacy-admin',
      username: 'admin',
      role: 'admin',
      is_active: true
    }
  }

  // Get user from database
  const user = await userRepo.getUserById(sessionCookie.value)
  return user
}

// Helper function to check admin permission
function isAdmin(user: any): boolean {
  return user?.role === 'admin' && user?.is_active
}

// GET - Get specific user (Admin only)
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const currentUser = await getCurrentUser(request)
    
    if (!currentUser || !isAdmin(currentUser)) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Bu işlem için admin yetkisi gereklidir' 
        },
        { status: 403 }
      )
    }

    const user = await userRepo.getUserById(params.id)
    
    if (!user) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Kullanıcı bulunamadı' 
        },
        { status: 404 }
      )
    }

    // Don't return password hash
    const safeUser = {
      id: user.id,
      username: user.username,
      full_name: user.full_name,
      role: user.role,
      is_active: user.is_active,
      created_at: user.created_at,
      updated_at: user.updated_at,
      created_by: user.created_by,
      last_login: user.last_login
    }

    return NextResponse.json({
      success: true,
      data: safeUser
    })

  } catch (error) {
    console.error('Get user error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Kullanıcı getirilirken bir hata oluştu' 
      },
      { status: 500 }
    )
  }
}

// PUT - Update specific user (Admin only)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const currentUser = await getCurrentUser(request)
    
    if (!currentUser || !isAdmin(currentUser)) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Bu işlem için admin yetkisi gereklidir' 
        },
        { status: 403 }
      )
    }

    const body: UpdateUserRequest = await request.json()
    
    // Validate inputs if provided
    if (body.username && body.username.length < 3) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Kullanıcı adı en az 3 karakter olmalıdır' 
        },
        { status: 400 }
      )
    }

    if (body.password && body.password.length < 6) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Şifre en az 6 karakter olmalıdır' 
        },
        { status: 400 }
      )
    }

    if (body.full_name && body.full_name.length < 2) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Tam ad en az 2 karakter olmalıdır' 
        },
        { status: 400 }
      )
    }

    // Update user
    const result = await userRepo.updateUser(params.id, body, currentUser.id)
    
    if (!result.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: result.error 
        },
        { status: 400 }
      )
    }

    // Return user without password hash
    const safeUser = {
      id: result.data!.id,
      username: result.data!.username,
      full_name: result.data!.full_name,
      role: result.data!.role,
      is_active: result.data!.is_active,
      created_at: result.data!.created_at,
      updated_at: result.data!.updated_at,
      created_by: result.data!.created_by,
      last_login: result.data!.last_login
    }

    return NextResponse.json({
      success: true,
      data: safeUser,
      message: 'Kullanıcı başarıyla güncellendi'
    })

  } catch (error) {
    console.error('Update user error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Kullanıcı güncellenirken bir hata oluştu' 
      },
      { status: 500 }
    )
  }
}

// DELETE - Delete specific user (Admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const currentUser = await getCurrentUser(request)
    
    if (!currentUser || !isAdmin(currentUser)) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Bu işlem için admin yetkisi gereklidir' 
        },
        { status: 403 }
      )
    }

    // Prevent self-deletion
    if (params.id === currentUser.id) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Kendi hesabınızı silemezsiniz' 
        },
        { status: 400 }
      )
    }

    // Check if user exists
    const user = await userRepo.getUserById(params.id)
    if (!user) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Kullanıcı bulunamadı' 
        },
        { status: 404 }
      )
    }

    // Prevent deleting admin user
    if (user.username === 'admin') {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Admin kullanıcısı silinemez' 
        },
        { status: 400 }
      )
    }

    // Delete user
    const result = await userRepo.deleteUser(params.id, currentUser.id)
    
    if (!result.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: result.error 
        },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Kullanıcı başarıyla silindi'
    })

  } catch (error) {
    console.error('Delete user error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Kullanıcı silinirken bir hata oluştu' 
      },
      { status: 500 }
    )
  }
}