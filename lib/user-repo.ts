/**
 * User Repository - Kullanıcı yönetimi için database işlemleri
 * 
 * Bu dosya personel yönetim sistemi için gerekli database operasyonlarını içerir
 */

import { supabase } from './supabase'
import * as bcrypt from 'bcryptjs'
import type {
  User,
  CreateUserRequest,
  UpdateUserRequest,
  Permission,
  UserPermission,
  UserWithPermissions,
  ActivityLog,
  CreateActivityLogRequest,
  LoginRequest,
  LoginResponse,
  AssignPermissionsRequest,
  ApiResponse
} from '@/types/user'

export class UserRepository {
  /**
   * Kullanıcı girişi
   */
  async login(request: LoginRequest): Promise<LoginResponse> {
    try {
      // Kullanıcıyı username ile bul
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('username', request.username)
        .eq('is_active', true)
        .single()

      if (userError || !user) {
        return {
          success: false,
          error: 'Kullanıcı adı veya şifre hatalı'
        }
      }

      // Şifre kontrolü
      const isPasswordValid = await bcrypt.compare(request.password, user.password_hash)
      
      if (!isPasswordValid) {
        return {
          success: false,
          error: 'Kullanıcı adı veya şifre hatalı'
        }
      }

      // Kullanıcı yetkilerini getir
      const { data: permissions, error: permError } = await supabase
        .from('user_permissions')
        .select(`
          permission_id,
          permissions (
            id,
            name,
            description,
            category
          )
        `)
        .eq('user_id', user.id)

      if (permError) {
        console.error('Permission fetch error:', permError)
      }

      const userPermissions = permissions?.map(up => up.permissions as unknown as Permission).filter(Boolean) || []

      // Son giriş zamanını güncelle
      await supabase
        .from('users')
        .update({ last_login: new Date().toISOString() })
        .eq('id', user.id)

      // Giriş aktivitesini logla
      await this.logActivity({
        user_id: user.id,
        action: 'user.login',
        resource_type: 'user',
        resource_id: user.id,
        details: { username: user.username }
      })

      return {
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
        permissions: userPermissions
      }
    } catch (error) {
      console.error('Login error:', error)
      return {
        success: false,
        error: 'Giriş sırasında bir hata oluştu'
      }
    }
  }

  /**
   * Tüm kullanıcıları listele
   */
  async getUsers(): Promise<User[]> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Get users error:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('Get users error:', error)
      return []
    }
  }

  /**
   * Kullanıcıyı ID ile getir
   */
  async getUserById(id: string): Promise<User | null> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        console.error('Get user by ID error:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('Get user by ID error:', error)
      return null
    }
  }

  /**
   * Kullanıcıyı yetkiler ile birlikte getir
   */
  async getUserWithPermissions(id: string): Promise<UserWithPermissions | null> {
    try {
      const user = await this.getUserById(id)
      if (!user) return null

      const permissions = await this.getUserPermissions(id)

      return {
        ...user,
        permissions
      }
    } catch (error) {
      console.error('Get user with permissions error:', error)
      return null
    }
  }

  /**
   * Yeni kullanıcı oluştur
   */
  async createUser(request: CreateUserRequest, createdBy?: string): Promise<ApiResponse<User>> {
    try {
      // Username kontrolü
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('username', request.username)
        .single()

      if (existingUser) {
        return {
          success: false,
          error: 'Bu kullanıcı adı zaten kullanılıyor'
        }
      }

      // Şifreyi hash'le
      const passwordHash = await bcrypt.hash(request.password, 10)

      // Kullanıcıyı oluştur
      const { data, error } = await supabase
        .from('users')
        .insert({
          username: request.username,
          password_hash: passwordHash,
          full_name: request.full_name,
          role: request.role || 'staff',
          is_active: request.is_active !== undefined ? request.is_active : true,
          created_by: createdBy
        })
        .select()
        .single()

      if (error) {
        console.error('Create user error:', error)
        return {
          success: false,
          error: 'Kullanıcı oluşturulurken bir hata oluştu'
        }
      }

      // Aktiviteyi logla
      if (createdBy) {
        await this.logActivity({
          user_id: createdBy,
          action: 'user.create',
          resource_type: 'user',
          resource_id: data.id,
          details: { 
            username: data.username,
            full_name: data.full_name,
            role: data.role
          }
        })
      }

      return {
        success: true,
        data
      }
    } catch (error) {
      console.error('Create user error:', error)
      return {
        success: false,
        error: 'Kullanıcı oluşturulurken bir hata oluştu'
      }
    }
  }

  /**
   * Kullanıcı güncelle
   */
  async updateUser(id: string, request: UpdateUserRequest, updatedBy?: string): Promise<ApiResponse<User>> {
    try {
      const updateData: any = {}

      if (request.username) {
        // Username kontrolü
        const { data: existingUser } = await supabase
          .from('users')
          .select('id')
          .eq('username', request.username)
          .neq('id', id)
          .single()

        if (existingUser) {
          return {
            success: false,
            error: 'Bu kullanıcı adı zaten kullanılıyor'
          }
        }
        updateData.username = request.username
      }

      if (request.password) {
        updateData.password_hash = await bcrypt.hash(request.password, 10)
      }

      if (request.full_name) updateData.full_name = request.full_name
      if (request.role) updateData.role = request.role
      if (request.is_active !== undefined) updateData.is_active = request.is_active

      const { data, error } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        console.error('Update user error:', error)
        return {
          success: false,
          error: 'Kullanıcı güncellenirken bir hata oluştu'
        }
      }

      // Aktiviteyi logla
      if (updatedBy) {
        await this.logActivity({
          user_id: updatedBy,
          action: 'user.update',
          resource_type: 'user',
          resource_id: id,
          details: updateData
        })
      }

      return {
        success: true,
        data
      }
    } catch (error) {
      console.error('Update user error:', error)
      return {
        success: false,
        error: 'Kullanıcı güncellenirken bir hata oluştu'
      }
    }
  }

  /**
   * Kullanıcı sil
   */
  async deleteUser(id: string, deletedBy?: string): Promise<ApiResponse<void>> {
    try {
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', id)

      if (error) {
        console.error('Delete user error:', error)
        return {
          success: false,
          error: 'Kullanıcı silinirken bir hata oluştu'
        }
      }

      // Aktiviteyi logla
      if (deletedBy) {
        await this.logActivity({
          user_id: deletedBy,
          action: 'user.delete',
          resource_type: 'user',
          resource_id: id,
          details: {}
        })
      }

      return {
        success: true
      }
    } catch (error) {
      console.error('Delete user error:', error)
      return {
        success: false,
        error: 'Kullanıcı silinirken bir hata oluştu'
      }
    }
  }

  /**
   * Tüm yetkileri getir
   */
  async getPermissions(): Promise<Permission[]> {
    try {
      const { data, error } = await supabase
        .from('permissions')
        .select('*')
        .order('category, name')

      if (error) {
        console.error('Get permissions error:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('Get permissions error:', error)
      return []
    }
  }

  /**
   * Kullanıcının yetkilerini getir
   */
  async getUserPermissions(userId: string): Promise<Permission[]> {
    try {
      const { data, error } = await supabase
        .from('user_permissions')
        .select(`
          permissions (
            id,
            name,
            description,
            category,
            created_at
          )
        `)
        .eq('user_id', userId)

      if (error) {
        console.error('Get user permissions error:', error)
        return []
      }

      return data?.map(up => up.permissions as unknown as Permission).filter(Boolean) || []
    } catch (error) {
      console.error('Get user permissions error:', error)
      return []
    }
  }

  /**
   * Kullanıcıya yetki ata
   */
  async assignPermissions(request: AssignPermissionsRequest, assignedBy?: string): Promise<ApiResponse<void>> {
    try {
      // Önce mevcut yetkileri sil
      await supabase
        .from('user_permissions')
        .delete()
        .eq('user_id', request.user_id)

      // Yeni yetkileri ekle
      if (request.permission_ids.length > 0) {
        const userPermissions = request.permission_ids.map(permissionId => ({
          user_id: request.user_id,
          permission_id: permissionId,
          granted_by: assignedBy
        }))

        const { error } = await supabase
          .from('user_permissions')
          .insert(userPermissions)

        if (error) {
          console.error('Assign permissions error:', error)
          return {
            success: false,
            error: 'Yetkiler atanırken bir hata oluştu'
          }
        }
      }

      // Aktiviteyi logla
      if (assignedBy) {
        await this.logActivity({
          user_id: assignedBy,
          action: 'user.permission.grant',
          resource_type: 'user',
          resource_id: request.user_id,
          details: { 
            permission_ids: request.permission_ids,
            permission_count: request.permission_ids.length
          }
        })
      }

      return {
        success: true
      }
    } catch (error) {
      console.error('Assign permissions error:', error)
      return {
        success: false,
        error: 'Yetkiler atanırken bir hata oluştu'
      }
    }
  }

  /**
   * Kullanıcının belirli bir yetkisi var mı kontrol et
   */
  async hasPermission(userId: string, permissionName: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('user_permissions')
        .select(`
          permissions!inner (
            name
          )
        `)
        .eq('user_id', userId)
        .eq('permissions.name', permissionName)
        .single()

      return !error && !!data
    } catch (error) {
      console.error('Has permission error:', error)
      return false
    }
  }

  /**
   * Aktivite logla
   */
  async logActivity(request: CreateActivityLogRequest & { user_id?: string }): Promise<void> {
    try {
      await supabase
        .from('activity_logs')
        .insert({
          user_id: request.user_id,
          action: request.action,
          resource_type: request.resource_type,
          resource_id: request.resource_id,
          details: request.details,
          ip_address: request.ip_address,
          user_agent: request.user_agent
        })
    } catch (error) {
      console.error('Log activity error:', error)
      // Activity log hatası sistem işleyişini etkilemez
    }
  }

  /**
   * Aktivite loglarını getir
   */
  async getActivityLogs(userId?: string, limit: number = 50): Promise<ActivityLog[]> {
    try {
      let query = supabase
        .from('activity_logs')
        .select(`
          *,
          users (
            id,
            username,
            full_name
          )
        `)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (userId) {
        query = query.eq('user_id', userId)
      }

      const { data, error } = await query

      if (error) {
        
        return []
      }

      return data || []
    } catch (error) {
      
      return []
    }
  }
}

// Singleton instance
export const userRepo = new UserRepository()