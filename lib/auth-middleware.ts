/**
 * Authentication and Authorization Middleware
 * 
 * Bu middleware API endpoint'lerinde kullanıcı kimlik doğrulama ve yetkilendirme
 * işlemlerini gerçekleştirir
 */

import { NextRequest } from 'next/server'
import { userRepo } from '@/lib/user-repo'
import type { User, Permission } from '@/types/user'

export interface AuthContext {
  user: User
  permissions: Permission[]
  isAdmin: boolean
  isLegacyAdmin: boolean
}

/**
 * Get current user from request
 */
export async function getCurrentUser(request: NextRequest): Promise<User | null> {
  const sessionCookie = request.cookies.get('auth-session')
  
  if (!sessionCookie?.value) {
    return null
  }

  // Check for legacy admin
  if (sessionCookie.value === 'legacy-admin') {
    return {
      id: 'legacy-admin',
      username: 'admin',
      full_name: 'Legacy Admin',
      role: 'admin',
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  }

  // Get user from database
  const user = await userRepo.getUserById(sessionCookie.value)
  return user
}

/**
 * Get user permissions
 */
export async function getUserPermissions(userId: string): Promise<Permission[]> {
  if (userId === 'legacy-admin') {
    // Legacy admin has all permissions
    return await userRepo.getPermissions()
  }

  return await userRepo.getUserPermissions(userId)
}

/**
 * Check if user has specific permission
 */
export function hasPermission(
  permissions: Permission[],
  permissionName: string
): boolean {
  return permissions.some(p => p.name === permissionName)
}

/**
 * Check if user has permission by category and action
 */
export function hasPermissionByCategory(
  permissions: Permission[],
  category: string,
  action: string
): boolean {
  const permissionName = `${category}.${action}`
  return hasPermission(permissions, permissionName)
}

/**
 * Check if user is admin
 */
export function isAdmin(user: User): boolean {
  return user.role === 'admin' && user.is_active
}

/**
 * Authenticate user and get context
 */
export async function authenticate(request: NextRequest): Promise<AuthContext | null> {
  try {
    const user = await getCurrentUser(request)
    
    if (!user || !user.is_active) {
      return null
    }

    const permissions = await getUserPermissions(user.id)
    const isUserAdmin = isAdmin(user)
    const isLegacyAdmin = user.id === 'legacy-admin'

    return {
      user,
      permissions,
      isAdmin: isUserAdmin,
      isLegacyAdmin
    }
  } catch (error) {
    console.error('Authentication error:', error)
    return null
  }
}

/**
 * Require authentication
 */
export async function requireAuth(request: NextRequest): Promise<AuthContext> {
  const authContext = await authenticate(request)
  
  if (!authContext) {
    throw new Error('Bu işlem için giriş yapmanız gereklidir')
  }

  return authContext
}

/**
 * Require admin role
 */
export async function requireAdmin(request: NextRequest): Promise<AuthContext> {
  const authContext = await requireAuth(request)
  
  if (!authContext.isAdmin) {
    throw new Error('Bu işlem için admin yetkisi gereklidir')
  }

  return authContext
}

/**
 * Require specific permission by name
 */
export async function requirePermission(
  request: NextRequest,
  permissionName: string
): Promise<AuthContext> {
  const authContext = await requireAuth(request)
  
  // Admin users have all permissions
  if (authContext.isAdmin) {
    return authContext
  }

  if (!hasPermission(authContext.permissions, permissionName)) {
    throw new Error(`Bu işlem için ${permissionName} yetkisi gereklidir`)
  }

  return authContext
}

/**
 * Require specific permission by category and action
 */
export async function requirePermissionByCategory(
  request: NextRequest,
  category: string,
  action: string
): Promise<AuthContext> {
  const permissionName = `${category}.${action}`
  return await requirePermission(request, permissionName)
}

/**
 * Log user activity
 */
export async function logActivity(
  request: NextRequest,
  authContext: AuthContext,
  action: string,
  resourceType: string,
  resourceId?: string,
  details?: any
): Promise<void> {
  try {
    await userRepo.logActivity({
      user_id: authContext.user.id,
      action,
      resource_type: resourceType,
      resource_id: resourceId,
      details,
      ip_address: request.headers.get('x-forwarded-for') || undefined,
      user_agent: request.headers.get('user-agent') || undefined
    })
  } catch (error) {
    console.error('Activity logging error:', error)
    // Don't throw error for logging failures
  }
}

/**
 * Permission categories and actions
 */
export const PERMISSIONS = {
  ORDERS: {
    category: 'orders',
    actions: {
      CREATE: 'create',
      READ: 'read',
      UPDATE: 'update',
      DELETE: 'delete',
      STATUS_UPDATE: 'status_update'
    }
  },
  WAREHOUSE: {
    category: 'warehouse',
    actions: {
      CREATE: 'create',
      READ: 'read',
      UPDATE: 'update',
      DELETE: 'delete',
      STOCK_IN: 'stock_in',
      STOCK_OUT: 'stock_out',
      TRANSFER: 'transfer'
    }
  },
  PRINTING: {
    category: 'printing',
    actions: {
      QR_LABELS: 'qr_labels',
      RETURN_LABELS: 'return_labels',
      COIL_LABELS: 'coil_labels'
    }
  },
  SYSTEM: {
    category: 'system',
    actions: {
      USERS_MANAGE: 'users_manage',
      SETTINGS: 'settings',
      REPORTS: 'reports',
      ACTIVITY_LOGS: 'activity_logs'
    }
  }
} as const

/**
 * Helper function to create permission checker by name
 */
export function createPermissionChecker(permissionName: string) {
  return async (request: NextRequest): Promise<AuthContext> => {
    return await requirePermission(request, permissionName)
  }
}

/**
 * Helper function to create permission checker by category and action
 */
export function createPermissionCheckerByCategory(category: string, action: string) {
  return async (request: NextRequest): Promise<AuthContext> => {
    return await requirePermissionByCategory(request, category, action)
  }
}

/**
 * Common permission checkers
 */
export const requireOrdersRead = createPermissionChecker('orders.read')
export const requireOrdersCreate = createPermissionChecker('orders.create')
export const requireOrdersUpdate = createPermissionChecker('orders.update')
export const requireOrdersStatusUpdate = createPermissionChecker('orders.status_update')

export const requireWarehouseRead = createPermissionChecker('warehouse.read')
export const requireWarehouseStockIn = createPermissionChecker('warehouse.stock_in')
export const requireWarehouseStockOut = createPermissionChecker('warehouse.stock_out')

export const requirePrintingQR = createPermissionChecker('printing.qr_labels')
export const requirePrintingReturn = createPermissionChecker('printing.return_labels')

export const requireSystemUsers = createPermissionChecker('system.users_manage')
export const requireSystemReports = createPermissionChecker('system.reports')
export const requireSystemActivityLogs = createPermissionChecker('system.activity_logs')