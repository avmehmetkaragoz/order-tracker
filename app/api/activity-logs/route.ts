/**
 * Activity Logs API Endpoint
 * 
 * Bu endpoint işlem geçmişi (activity logs) için kullanılır
 * Admin kullanıcıları tüm logları, normal kullanıcılar sadece kendi loglarını görebilir
 */

import { NextRequest, NextResponse } from 'next/server'
import { userRepo } from '@/lib/user-repo'

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

// GET - Get activity logs
export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser(request)
    
    if (!currentUser || !currentUser.is_active) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Bu işlem için giriş yapmanız gereklidir' 
        },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const userId = searchParams.get('userId')

    // Validate limit
    if (limit < 1 || limit > 1000) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Limit 1-1000 arasında olmalıdır' 
        },
        { status: 400 }
      )
    }

    let targetUserId: string | undefined

    if (userId) {
      // Specific user's logs requested
      if (!isAdmin(currentUser) && userId !== currentUser.id) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Sadece kendi işlem geçmişinizi görüntüleyebilirsiniz' 
          },
          { status: 403 }
        )
      }
      targetUserId = userId
    } else {
      // All logs requested
      if (!isAdmin(currentUser)) {
        // Non-admin users can only see their own logs
        targetUserId = currentUser.id
      }
      // Admin users can see all logs (targetUserId remains undefined)
    }

    const logs = await userRepo.getActivityLogs(targetUserId, limit)

    // Format logs for response
    const formattedLogs = logs.map(log => ({
      id: log.id,
      user_id: log.user_id,
      user: log.user ? {
        id: log.user.id,
        username: log.user.username,
        full_name: log.user.full_name
      } : null,
      action: log.action,
      resource_type: log.resource_type,
      resource_id: log.resource_id,
      details: log.details,
      ip_address: log.ip_address,
      user_agent: log.user_agent,
      created_at: log.created_at
    }))

    return NextResponse.json({
      success: true,
      data: formattedLogs,
      meta: {
        count: formattedLogs.length,
        limit: limit,
        user_filter: targetUserId || null,
        is_admin_view: isAdmin(currentUser)
      }
    })

  } catch (error) {
    console.error('Get activity logs error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'İşlem geçmişi getirilirken bir hata oluştu' 
      },
      { status: 500 }
    )
  }
}

// POST - Create activity log (for manual logging)
export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser(request)
    
    if (!currentUser || !currentUser.is_active) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Bu işlem için giriş yapmanız gereklidir' 
        },
        { status: 401 }
      )
    }

    const body = await request.json()
    
    // Input validation
    if (!body.action || !body.resource_type) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Action ve resource_type gereklidir' 
        },
        { status: 400 }
      )
    }

    // Create activity log
    await userRepo.logActivity({
      user_id: currentUser.id,
      action: body.action,
      resource_type: body.resource_type,
      resource_id: body.resource_id,
      details: body.details,
      ip_address: request.headers.get('x-forwarded-for') || undefined,
      user_agent: request.headers.get('user-agent') || undefined
    })

    return NextResponse.json({
      success: true,
      message: 'İşlem geçmişi kaydedildi'
    })

  } catch (error) {
    console.error('Create activity log error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'İşlem geçmişi kaydedilirken bir hata oluştu' 
      },
      { status: 500 }
    )
  }
}