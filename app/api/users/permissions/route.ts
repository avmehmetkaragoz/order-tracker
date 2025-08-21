/**
 * User Permissions Management API
 * 
 * Bu endpoint kullanıcı yetki atama/kaldırma işlemleri için kullanılır
 * Sadece admin kullanıcıları bu endpoint'leri kullanabilir
 */

import { NextRequest, NextResponse } from 'next/server'
import { userRepo } from '@/lib/user-repo'
import type { AssignPermissionsRequest } from '@/types/user'

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

// GET - Get all permissions
export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (userId) {
      // Get specific user's permissions
      const permissions = await userRepo.getUserPermissions(userId)
      return NextResponse.json({
        success: true,
        data: permissions
      })
    } else {
      // Get all available permissions
      const permissions = await userRepo.getPermissions()
      return NextResponse.json({
        success: true,
        data: permissions
      })
    }

  } catch (error) {
    console.error('Get permissions error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Yetkiler getirilirken bir hata oluştu' 
      },
      { status: 500 }
    )
  }
}

// POST - Assign permissions to user
export async function POST(request: NextRequest) {
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

    const body: AssignPermissionsRequest = await request.json()
    
    // Input validation
    if (!body.user_id) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Kullanıcı ID gereklidir' 
        },
        { status: 400 }
      )
    }

    if (!Array.isArray(body.permission_ids)) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Yetki ID listesi gereklidir' 
        },
        { status: 400 }
      )
    }

    // Check if user exists
    const targetUser = await userRepo.getUserById(body.user_id)
    if (!targetUser) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Kullanıcı bulunamadı' 
        },
        { status: 404 }
      )
    }

    // Assign permissions
    const result = await userRepo.assignPermissions(body, currentUser.id)
    
    if (!result.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: result.error 
        },
        { status: 400 }
      )
    }

    // Get updated permissions
    const updatedPermissions = await userRepo.getUserPermissions(body.user_id)

    return NextResponse.json({
      success: true,
      data: updatedPermissions,
      message: 'Yetkiler başarıyla atandı'
    })

  } catch (error) {
    console.error('Assign permissions error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Yetkiler atanırken bir hata oluştu' 
      },
      { status: 500 }
    )
  }
}

// PUT - Update user permissions (same as POST for simplicity)
export async function PUT(request: NextRequest) {
  return POST(request)
}

// DELETE - Remove all permissions from user
export async function DELETE(request: NextRequest) {
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

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    
    if (!userId) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Kullanıcı ID gereklidir' 
        },
        { status: 400 }
      )
    }

    // Check if user exists
    const targetUser = await userRepo.getUserById(userId)
    if (!targetUser) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Kullanıcı bulunamadı' 
        },
        { status: 404 }
      )
    }

    // Remove all permissions (assign empty array)
    const result = await userRepo.assignPermissions(
      { user_id: userId, permission_ids: [] }, 
      currentUser.id
    )
    
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
      message: 'Tüm yetkiler başarıyla kaldırıldı'
    })

  } catch (error) {
    console.error('Remove permissions error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Yetkiler kaldırılırken bir hata oluştu' 
      },
      { status: 500 }
    )
  }
}