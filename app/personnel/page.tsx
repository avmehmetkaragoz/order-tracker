'use client'

/**
 * Personnel Management Page
 * 
 * Bu sayfa personel yönetimi için kullanılır
 * - Kullanıcı listesi
 * - Yeni kullanıcı ekleme
 * - Kullanıcı düzenleme
 * - Yetki atama
 * - İşlem geçmişi
 */

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import type { User, Permission, ActivityLog, CreateUserRequest, UpdateUserRequest, UserRole } from '@/types/user'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { LoadingSpinner } from '@/components/loading-spinner'
import { ArrowLeft, Plus, Users, Settings, Activity, Trash2, Edit, Shield, Eye, EyeOff } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { DEFAULT_PERMISSIONS, PERMISSION_CATEGORIES } from '@/types/user'

interface PersonnelPageState {
  users: User[]
  permissions: Permission[]
  activityLogs: ActivityLog[]
  loading: boolean
  error: string | null
  selectedUser: User | null
  showAddUser: boolean
  showEditUser: boolean
  showPermissions: boolean
  showActivityLogs: boolean
  userPermissions: Permission[]
  availablePermissions: Permission[]
}

interface AddUserForm {
  username: string
  password: string
  full_name: string
  role: UserRole
  is_active: boolean
}

interface EditUserForm {
  username: string
  password: string
  full_name: string
  role: UserRole
  is_active: boolean
}

export default function PersonnelPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [state, setState] = useState<PersonnelPageState>({
    users: [],
    permissions: [],
    activityLogs: [],
    loading: true,
    error: null,
    selectedUser: null,
    showAddUser: false,
    showEditUser: false,
    showPermissions: false,
    showActivityLogs: false,
    userPermissions: [],
    availablePermissions: []
  })

  const [addUserForm, setAddUserForm] = useState<AddUserForm>({
    username: '',
    password: '',
    full_name: '',
    role: 'staff',
    is_active: true
  })

  const [editUserForm, setEditUserForm] = useState<EditUserForm>({
    username: '',
    password: '',
    full_name: '',
    role: 'staff',
    is_active: true
  })

  const [showPassword, setShowPassword] = useState(false)
  const [showEditPassword, setShowEditPassword] = useState(false)
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([])
  const [submitting, setSubmitting] = useState(false)

  // Check authentication and admin permission
  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      // Check if user is authenticated and has admin permission
      const response = await fetch('/api/auth/check')
      const data = await response.json()

      if (!data.success || !data.isAdmin) {
        router.push('/login')
        return
      }

      // Load initial data
      await loadUsers()
      await loadPermissions()
    } catch (error) {
      console.error('Auth check error:', error)
      router.push('/login')
    }
  }

  const loadUsers = async () => {
    try {
      setState(prev => ({ ...prev, loading: true }))
      
      const response = await fetch('/api/users')
      const data = await response.json()

      if (data.success) {
        setState(prev => ({ 
          ...prev, 
          users: data.data || [],
          loading: false,
          error: null
        }))
      } else {
        setState(prev => ({ 
          ...prev, 
          error: data.error || 'Kullanıcılar yüklenemedi',
          loading: false
        }))
      }
    } catch (error) {
      console.error('Load users error:', error)
      setState(prev => ({ 
        ...prev, 
        error: 'Kullanıcılar yüklenirken bir hata oluştu',
        loading: false
      }))
    }
  }

  const loadPermissions = async () => {
    try {
      const response = await fetch('/api/users/permissions')
      const data = await response.json()

      if (data.success) {
        setState(prev => ({ 
          ...prev, 
          availablePermissions: data.data || []
        }))
      }
    } catch (error) {
      console.error('Load permissions error:', error)
    }
  }

  const loadActivityLogs = async (userId?: string) => {
    try {
      const url = userId ? `/api/activity-logs?userId=${userId}` : '/api/activity-logs'
      const response = await fetch(url)
      const data = await response.json()

      if (data.success) {
        setState(prev => ({ 
          ...prev, 
          activityLogs: data.data || []
        }))
      }
    } catch (error) {
      console.error('Load activity logs error:', error)
    }
  }

  const loadUserPermissions = async (userId: string) => {
    try {
      const response = await fetch(`/api/users/permissions?userId=${userId}`)
      const data = await response.json()

      if (data.success) {
        const userPerms = data.data || []
        setState(prev => ({ 
          ...prev, 
          userPermissions: userPerms
        }))
        setSelectedPermissions(userPerms.map((p: Permission) => p.id))
      }
    } catch (error) {
      console.error('Load user permissions error:', error)
    }
  }

  const handleAddUser = () => {
    setAddUserForm({
      username: '',
      password: '',
      full_name: '',
      role: 'staff',
      is_active: true
    })
    setState(prev => ({ 
      ...prev, 
      showAddUser: true,
      selectedUser: null
    }))
  }

  const handleEditUser = (user: User) => {
    setEditUserForm({
      username: user.username,
      password: '',
      full_name: user.full_name,
      role: user.role,
      is_active: user.is_active
    })
    setState(prev => ({ 
      ...prev, 
      showEditUser: true,
      selectedUser: user
    }))
  }

  const handleManagePermissions = async (user: User) => {
    setState(prev => ({ 
      ...prev, 
      showPermissions: true,
      selectedUser: user
    }))
    await loadUserPermissions(user.id)
  }

  const handleViewActivity = (user: User) => {
    setState(prev => ({ 
      ...prev, 
      showActivityLogs: true,
      selectedUser: user
    }))
    loadActivityLogs(user.id)
  }

  const handleDeleteUser = async (user: User) => {
    if (!confirm(`${user.full_name} kullanıcısını silmek istediğinizden emin misiniz?`)) {
      return
    }

    try {
      const response = await fetch(`/api/users/${user.id}`, {
        method: 'DELETE'
      })

      const data = await response.json()

      if (data.success) {
        await loadUsers()
        toast({
          title: "Başarılı",
          description: "Kullanıcı başarıyla silindi"
        })
      } else {
        toast({
          title: "Hata",
          description: data.error || 'Kullanıcı silinirken bir hata oluştu',
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Delete user error:', error)
      toast({
        title: "Hata",
        description: 'Kullanıcı silinirken bir hata oluştu',
        variant: "destructive"
      })
    }
  }

  const handleSubmitAddUser = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(addUserForm)
      })

      const data = await response.json()

      if (data.success) {
        await loadUsers()
        closeModals()
        toast({
          title: "Başarılı",
          description: "Kullanıcı başarıyla oluşturuldu"
        })
      } else {
        toast({
          title: "Hata",
          description: data.error || 'Kullanıcı oluşturulurken bir hata oluştu',
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Create user error:', error)
      toast({
        title: "Hata",
        description: 'Kullanıcı oluşturulurken bir hata oluştu',
        variant: "destructive"
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleSubmitEditUser = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!state.selectedUser) return

    setSubmitting(true)

    try {
      const updateData: any = {
        id: state.selectedUser.id,
        username: editUserForm.username,
        full_name: editUserForm.full_name,
        role: editUserForm.role,
        is_active: editUserForm.is_active
      }

      // Only include password if it's provided
      if (editUserForm.password.trim()) {
        updateData.password = editUserForm.password
      }

      const response = await fetch('/api/users', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      })

      const data = await response.json()

      if (data.success) {
        await loadUsers()
        closeModals()
        toast({
          title: "Başarılı",
          description: "Kullanıcı başarıyla güncellendi"
        })
      } else {
        toast({
          title: "Hata",
          description: data.error || 'Kullanıcı güncellenirken bir hata oluştu',
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Update user error:', error)
      toast({
        title: "Hata",
        description: 'Kullanıcı güncellenirken bir hata oluştu',
        variant: "destructive"
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleSubmitPermissions = async () => {
    if (!state.selectedUser) return

    setSubmitting(true)

    try {
      const response = await fetch('/api/users/permissions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          user_id: state.selectedUser.id,
          permission_ids: selectedPermissions
        })
      })

      const data = await response.json()

      if (data.success) {
        closeModals()
        toast({
          title: "Başarılı",
          description: "Yetkiler başarıyla güncellendi"
        })
      } else {
        toast({
          title: "Hata",
          description: data.error || 'Yetkiler güncellenirken bir hata oluştu',
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Update permissions error:', error)
      toast({
        title: "Hata",
        description: 'Yetkiler güncellenirken bir hata oluştu',
        variant: "destructive"
      })
    } finally {
      setSubmitting(false)
    }
  }

  const closeModals = () => {
    setState(prev => ({ 
      ...prev, 
      showAddUser: false,
      showEditUser: false,
      showPermissions: false,
      showActivityLogs: false,
      selectedUser: null
    }))
    setShowPassword(false)
    setShowEditPassword(false)
    setSelectedPermissions([])
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('tr-TR')
  }

  const getRoleText = (role: string) => {
    return role === 'admin' ? 'Yönetici' : 'Personel'
  }

  const getStatusText = (isActive: boolean) => {
    return isActive ? 'Aktif' : 'Pasif'
  }

  const groupPermissionsByCategory = (permissions: Permission[]) => {
    const grouped: Record<string, Permission[]> = {}
    permissions.forEach(permission => {
      if (!grouped[permission.category]) {
        grouped[permission.category] = []
      }
      grouped[permission.category].push(permission)
    })
    return grouped
  }

  if (state.loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="text-muted-foreground mt-4">Personel bilgileri yükleniyor...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="container mx-auto px-4 py-4 max-w-md">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => router.push('/')}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-lg font-semibold">Personel Yönetimi</h1>
              <p className="text-sm text-muted-foreground">Sistem kullanıcılarını yönetin</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 max-w-md space-y-6">
        {/* Error Display */}
        {state.error && (
          <Card className="border-destructive">
            <CardContent className="p-4">
              <div className="text-sm text-destructive">
                <strong>Hata:</strong> {state.error}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-5 w-5" />
              Personel Özeti
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-primary">{state.users.length}</div>
                <div className="text-xs text-muted-foreground">Toplam</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-500">
                  {state.users.filter(u => u.is_active).length}
                </div>
                <div className="text-xs text-muted-foreground">Aktif</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-500">
                  {state.users.filter(u => u.role === 'admin').length}
                </div>
                <div className="text-xs text-muted-foreground">Yönetici</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Add User Button */}
        <Button onClick={handleAddUser} className="w-full" size="lg">
          <Plus className="h-4 w-4 mr-2" />
          Yeni Personel Ekle
        </Button>

        {/* Users List */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Personel Listesi ({state.users.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {state.users.length === 0 ? (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">Henüz personel kaydı bulunmuyor</p>
                <Button onClick={handleAddUser}>
                  <Plus className="h-4 w-4 mr-2" />
                  İlk Personeli Ekle
                </Button>
              </div>
            ) : (
              state.users.map((user) => (
                <div key={user.id} className="p-4 bg-muted/30 rounded-lg space-y-3">
                  {/* User Info */}
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">{user.full_name}</span>
                        <Badge variant={user.role === 'admin' ? 'default' : 'secondary'} className="text-xs">
                          {getRoleText(user.role)}
                        </Badge>
                        <Badge variant={user.is_active ? 'default' : 'destructive'} className="text-xs">
                          {getStatusText(user.is_active)}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        @{user.username}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        Son giriş: {user.last_login ? formatDate(user.last_login) : 'Hiç giriş yapmadı'}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Oluşturulma: {formatDate(user.created_at)}
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2 flex-wrap">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditUser(user)}
                      className="flex-1"
                    >
                      <Edit className="h-3 w-3 mr-1" />
                      Düzenle
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleManagePermissions(user)}
                      className="flex-1"
                    >
                      <Shield className="h-3 w-3 mr-1" />
                      Yetkiler
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewActivity(user)}
                      className="flex-1"
                    >
                      <Activity className="h-3 w-3 mr-1" />
                      Geçmiş
                    </Button>
                    {user.username !== 'admin' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteUser(user)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Add User Modal */}
      {state.showAddUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>Yeni Personel Ekle</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmitAddUser} className="space-y-4">
                <div>
                  <Label htmlFor="add-username">Kullanıcı Adı</Label>
                  <Input
                    id="add-username"
                    type="text"
                    value={addUserForm.username}
                    onChange={(e) => setAddUserForm(prev => ({ ...prev, username: e.target.value }))}
                    placeholder="kullanici_adi"
                    required
                    minLength={3}
                  />
                </div>

                <div>
                  <Label htmlFor="add-password">Şifre</Label>
                  <div className="relative">
                    <Input
                      id="add-password"
                      type={showPassword ? "text" : "password"}
                      value={addUserForm.password}
                      onChange={(e) => setAddUserForm(prev => ({ ...prev, password: e.target.value }))}
                      placeholder="••••••••"
                      required
                      minLength={6}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                <div>
                  <Label htmlFor="add-fullname">Tam Ad</Label>
                  <Input
                    id="add-fullname"
                    type="text"
                    value={addUserForm.full_name}
                    onChange={(e) => setAddUserForm(prev => ({ ...prev, full_name: e.target.value }))}
                    placeholder="Ad Soyad"
                    required
                    minLength={2}
                  />
                </div>

                <div>
                  <Label htmlFor="add-role">Rol</Label>
                  <Select
                    value={addUserForm.role}
                    onValueChange={(value: UserRole) => setAddUserForm(prev => ({ ...prev, role: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="staff">Personel</SelectItem>
                      <SelectItem value="admin">Yönetici</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="add-active"
                    checked={addUserForm.is_active}
                    onCheckedChange={(checked) => setAddUserForm(prev => ({ ...prev, is_active: !!checked }))}
                  />
                  <Label htmlFor="add-active">Aktif kullanıcı</Label>
                </div>

                <div className="flex gap-2">
                  <Button type="button" variant="outline" onClick={closeModals} className="flex-1">
                    İptal
                  </Button>
                  <Button type="submit" disabled={submitting} className="flex-1">
                    {submitting ? <LoadingSpinner size="sm" /> : 'Oluştur'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Edit User Modal */}
      {state.showEditUser && state.selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>Personel Düzenle: {state.selectedUser.full_name}</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmitEditUser} className="space-y-4">
                <div>
                  <Label htmlFor="edit-username">Kullanıcı Adı</Label>
                  <Input
                    id="edit-username"
                    type="text"
                    value={editUserForm.username}
                    onChange={(e) => setEditUserForm(prev => ({ ...prev, username: e.target.value }))}
                    placeholder="kullanici_adi"
                    required
                    minLength={3}
                  />
                </div>

                <div>
                  <Label htmlFor="edit-password">Yeni Şifre (boş bırakın değiştirmek istemiyorsanız)</Label>
                  <div className="relative">
                    <Input
                      id="edit-password"
                      type={showEditPassword ? "text" : "password"}
                      value={editUserForm.password}
                      onChange={(e) => setEditUserForm(prev => ({ ...prev, password: e.target.value }))}
                      placeholder="••••••••"
                      minLength={6}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowEditPassword(!showEditPassword)}
                    >
                      {showEditPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                <div>
                  <Label htmlFor="edit-fullname">Tam Ad</Label>
                  <Input
                    id="edit-fullname"
                    type="text"
                    value={editUserForm.full_name}
                    onChange={(e) => setEditUserForm(prev => ({ ...prev, full_name: e.target.value }))}
                    placeholder="Ad Soyad"
                    required
                    minLength={2}
                  />
                </div>

                <div>
                  <Label htmlFor="edit-role">Rol</Label>
                  <Select
                    value={editUserForm.role}
                    onValueChange={(value: UserRole) => setEditUserForm(prev => ({ ...prev, role: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="staff">Personel</SelectItem>
                      <SelectItem value="admin">Yönetici</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="edit-active"
                    checked={editUserForm.is_active}
                    onCheckedChange={(checked) => setEditUserForm(prev => ({ ...prev, is_active: !!checked }))}
                  />
                  <Label htmlFor="edit-active">Aktif kullanıcı</Label>
                </div>

                <div className="flex gap-2">
                  <Button type="button" variant="outline" onClick={closeModals} className="flex-1">
                    İptal
                  </Button>
                  <Button type="submit" disabled={submitting} className="flex-1">
                    {submitting ? <LoadingSpinner size="sm" /> : 'Güncelle'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Permissions Modal */}
      {state.showPermissions && state.selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-hidden">
            <CardHeader>
              <CardTitle>Yetki Yönetimi: {state.selectedUser.full_name}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="max-h-96 overflow-y-auto space-y-4">
                {Object.entries(groupPermissionsByCategory(state.availablePermissions)).map(([category, permissions]) => (
                  <div key={category} className="space-y-2">
                    <h4 className="font-medium text-sm">{PERMISSION_CATEGORIES[category as keyof typeof PERMISSION_CATEGORIES]}</h4>
                    <div className="space-y-2 pl-4">
                      {permissions.map((permission) => (
                        <div key={permission.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`perm-${permission.id}`}
                            checked={selectedPermissions.includes(permission.id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedPermissions(prev => [...prev, permission.id])
                              } else {
                                setSelectedPermissions(prev => prev.filter(id => id !== permission.id))
                              }
                            }}
                          />
                          <Label htmlFor={`perm-${permission.id}`} className="text-sm">
                            {permission.description}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={closeModals} className="flex-1">
                  İptal
                </Button>
                <Button onClick={handleSubmitPermissions} disabled={submitting} className="flex-1">
                  {submitting ? <LoadingSpinner size="sm" /> : 'Kaydet'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Activity Logs Modal */}
      {state.showActivityLogs && state.selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-hidden">
            <CardHeader>
              <CardTitle>İşlem Geçmişi: {state.selectedUser.full_name}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="max-h-96 overflow-y-auto space-y-3">
                {state.activityLogs.length > 0 ? (
                  state.activityLogs.map((log) => (
                    <div key={log.id} className="p-3 bg-muted/30 rounded-lg border-l-4 border-primary">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="text-sm font-medium">
                            {log.action}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {log.resource_type} {log.resource_id && `(${log.resource_id})`}
                          </p>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {formatDate(log.created_at)}
                        </span>
                      </div>
                      {log.details && (
                        <pre className="text-xs text-muted-foreground bg-muted/50 p-2 rounded overflow-x-auto">
                          {JSON.stringify(log.details, null, 2)}
                        </pre>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">İşlem geçmişi bulunamadı</p>
                  </div>
                )}
              </div>
              <Button onClick={closeModals} variant="outline" className="w-full">
                Kapat
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}