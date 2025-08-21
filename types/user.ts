/**
 * User Management System Types
 * 
 * Bu dosya personel yönetim sistemi için gerekli TypeScript tiplerini içerir
 */

// Kullanıcı rolleri
export type UserRole = 'admin' | 'staff';

// Yetki kategorileri
export type PermissionCategory = 'orders' | 'warehouse' | 'printing' | 'system';

// Temel kullanıcı bilgileri
export interface User {
  id: string;
  username: string;
  full_name: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by?: string;
  last_login?: string;
}

// Kullanıcı oluşturma/güncelleme için
export interface CreateUserRequest {
  username: string;
  password: string;
  full_name: string;
  role?: UserRole;
  is_active?: boolean;
}

export interface UpdateUserRequest {
  username?: string;
  password?: string;
  full_name?: string;
  role?: UserRole;
  is_active?: boolean;
}

// Yetki sistemi
export interface Permission {
  id: string;
  name: string;
  description: string;
  category: PermissionCategory;
  created_at: string;
}

// Kullanıcı yetki ataması
export interface UserPermission {
  id: string;
  user_id: string;
  permission_id: string;
  granted_by?: string;
  granted_at: string;
  permission?: Permission; // Join ile gelen permission bilgisi
}

// Yetki kontrol sonucu
export interface PermissionCheck {
  hasPermission: boolean;
  permission?: Permission;
  reason?: string;
}

// Aktivite log
export interface ActivityLog {
  id: string;
  user_id?: string;
  action: string;
  resource_type: string;
  resource_id?: string;
  details?: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
  user?: User; // Join ile gelen user bilgisi
}

// Aktivite log oluşturma
export interface CreateActivityLogRequest {
  action: string;
  resource_type: string;
  resource_id?: string;
  details?: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
}

// Kullanıcı oturumu
export interface UserSession {
  id: string;
  user_id: string;
  session_token: string;
  expires_at: string;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
  last_accessed: string;
  user?: User;
}

// Login request/response
export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  user?: User;
  permissions?: Permission[];
  session_token?: string;
  expires_at?: string;
  error?: string;
}

// Yetki atama request
export interface AssignPermissionsRequest {
  user_id: string;
  permission_ids: string[];
}

// Kullanıcı detayları (permissions ile birlikte)
export interface UserWithPermissions extends User {
  permissions: Permission[];
}

// Yetki kategorileri ve açıklamaları
export const PERMISSION_CATEGORIES: Record<PermissionCategory, string> = {
  orders: 'Sipariş Yönetimi',
  warehouse: 'Depo Yönetimi', 
  printing: 'Yazdırma İşlemleri',
  system: 'Sistem Yönetimi'
};

// Varsayılan yetkiler
export const DEFAULT_PERMISSIONS: Record<string, { description: string; category: PermissionCategory }> = {
  // Sipariş Yönetimi
  'orders.create': { description: 'Yeni sipariş oluşturma', category: 'orders' },
  'orders.read': { description: 'Siparişleri görüntüleme', category: 'orders' },
  'orders.update': { description: 'Sipariş bilgilerini düzenleme', category: 'orders' },
  'orders.delete': { description: 'Sipariş silme', category: 'orders' },
  'orders.status_update': { description: 'Sipariş durumu güncelleme', category: 'orders' },

  // Depo Yönetimi
  'warehouse.create': { description: 'Yeni ürün ekleme', category: 'warehouse' },
  'warehouse.read': { description: 'Depo görüntüleme', category: 'warehouse' },
  'warehouse.update': { description: 'Ürün bilgilerini düzenleme', category: 'warehouse' },
  'warehouse.delete': { description: 'Ürün silme', category: 'warehouse' },
  'warehouse.stock_in': { description: 'Ürün giriş işlemi', category: 'warehouse' },
  'warehouse.stock_out': { description: 'Ürün çıkış işlemi', category: 'warehouse' },
  'warehouse.transfer': { description: 'Ürün transfer işlemi', category: 'warehouse' },

  // Yazdırma
  'printing.qr_labels': { description: 'QR kod etiket yazdırma', category: 'printing' },
  'printing.return_labels': { description: 'Return etiket yazdırma', category: 'printing' },
  'printing.coil_labels': { description: 'Coil etiket yazdırma', category: 'printing' },

  // Sistem Yönetimi
  'system.users_manage': { description: 'Personel yönetimi', category: 'system' },
  'system.settings': { description: 'Sistem ayarları', category: 'system' },
  'system.reports': { description: 'Raporlar', category: 'system' },
  'system.activity_logs': { description: 'İşlem geçmişi görüntüleme', category: 'system' }
};

// Aktivite log action tipleri
export const ACTIVITY_ACTIONS = {
  // Kullanıcı işlemleri
  USER_LOGIN: 'user.login',
  USER_LOGOUT: 'user.logout',
  USER_CREATE: 'user.create',
  USER_UPDATE: 'user.update',
  USER_DELETE: 'user.delete',
  USER_PERMISSION_GRANT: 'user.permission.grant',
  USER_PERMISSION_REVOKE: 'user.permission.revoke',

  // Sipariş işlemleri
  ORDER_CREATE: 'order.create',
  ORDER_UPDATE: 'order.update',
  ORDER_DELETE: 'order.delete',
  ORDER_STATUS_UPDATE: 'order.status.update',

  // Depo işlemleri
  WAREHOUSE_CREATE: 'warehouse.create',
  WAREHOUSE_UPDATE: 'warehouse.update',
  WAREHOUSE_DELETE: 'warehouse.delete',
  WAREHOUSE_STOCK_IN: 'warehouse.stock.in',
  WAREHOUSE_STOCK_OUT: 'warehouse.stock.out',
  WAREHOUSE_TRANSFER: 'warehouse.transfer',

  // Yazdırma işlemleri
  PRINT_QR_LABEL: 'print.qr_label',
  PRINT_RETURN_LABEL: 'print.return_label',
  PRINT_COIL_LABEL: 'print.coil_label',

  // Sistem işlemleri
  SETTINGS_UPDATE: 'settings.update',
  REPORT_GENERATE: 'report.generate',
  DATA_EXPORT: 'data.export',
  DATA_IMPORT: 'data.import'
} as const;

export type ActivityAction = typeof ACTIVITY_ACTIONS[keyof typeof ACTIVITY_ACTIONS];

// Resource tipleri
export const RESOURCE_TYPES = {
  USER: 'user',
  ORDER: 'order',
  WAREHOUSE_ITEM: 'warehouse_item',
  PERMISSION: 'permission',
  SETTING: 'setting',
  REPORT: 'report'
} as const;

export type ResourceType = typeof RESOURCE_TYPES[keyof typeof RESOURCE_TYPES];

// API Response tipleri
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T = any> extends ApiResponse<T[]> {
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Yetki kontrol helper fonksiyonları için tipler
export interface AuthContext {
  user: User | null;
  permissions: Permission[];
  hasPermission: (permission: string) => boolean;
  isAdmin: () => boolean;
  isAuthenticated: () => boolean;
}

// Form validation tipleri
export interface ValidationError {
  field: string;
  message: string;
}

export interface FormValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}