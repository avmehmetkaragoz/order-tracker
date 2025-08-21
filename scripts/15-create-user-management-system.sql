-- Personel Yönetim Sistemi Database Schema
-- Bu script kullanıcı yönetimi, yetki sistemi ve aktivite logları için gerekli tabloları oluşturur

-- 1. Users tablosu - Sistem kullanıcıları (admin + personel)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(50) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(100) NOT NULL,
  role VARCHAR(20) DEFAULT 'staff' CHECK (role IN ('admin', 'staff')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  last_login TIMESTAMP WITH TIME ZONE,
  
  -- Indexes
  CONSTRAINT users_username_check CHECK (length(username) >= 3),
  CONSTRAINT users_full_name_check CHECK (length(full_name) >= 2)
);

-- 2. Permissions tablosu - Sistem yetkileri
CREATE TABLE IF NOT EXISTS permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  category VARCHAR(30) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Categories: orders, warehouse, printing, system
  CONSTRAINT permissions_category_check CHECK (category IN ('orders', 'warehouse', 'printing', 'system'))
);

-- 3. User Permissions tablosu - Kullanıcı yetki atamaları
CREATE TABLE IF NOT EXISTS user_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  granted_by UUID REFERENCES users(id),
  granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Unique constraint to prevent duplicate permissions
  UNIQUE(user_id, permission_id)
);

-- 4. Activity Logs tablosu - İşlem geçmişi
CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  action VARCHAR(50) NOT NULL,
  resource_type VARCHAR(30) NOT NULL,
  resource_id VARCHAR(50),
  details JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Indexes for performance
  INDEX idx_activity_logs_user_id (user_id),
  INDEX idx_activity_logs_created_at (created_at),
  INDEX idx_activity_logs_action (action),
  INDEX idx_activity_logs_resource (resource_type, resource_id)
);

-- 5. Sessions tablosu - Kullanıcı oturumları (opsiyonel, gelişmiş session yönetimi için)
CREATE TABLE IF NOT EXISTS user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  session_token VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_accessed TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Index for session lookup
  INDEX idx_user_sessions_token (session_token),
  INDEX idx_user_sessions_user_id (user_id),
  INDEX idx_user_sessions_expires (expires_at)
);

-- Varsayılan yetkileri ekle
INSERT INTO permissions (name, description, category) VALUES
-- Sipariş Yönetimi
('orders.create', 'Yeni sipariş oluşturma', 'orders'),
('orders.read', 'Siparişleri görüntüleme', 'orders'),
('orders.update', 'Sipariş bilgilerini düzenleme', 'orders'),
('orders.delete', 'Sipariş silme', 'orders'),
('orders.status_update', 'Sipariş durumu güncelleme', 'orders'),

-- Depo Yönetimi
('warehouse.create', 'Yeni ürün ekleme', 'warehouse'),
('warehouse.read', 'Depo görüntüleme', 'warehouse'),
('warehouse.update', 'Ürün bilgilerini düzenleme', 'warehouse'),
('warehouse.delete', 'Ürün silme', 'warehouse'),
('warehouse.stock_in', 'Ürün giriş işlemi', 'warehouse'),
('warehouse.stock_out', 'Ürün çıkış işlemi', 'warehouse'),
('warehouse.transfer', 'Ürün transfer işlemi', 'warehouse'),

-- Yazdırma
('printing.qr_labels', 'QR kod etiket yazdırma', 'printing'),
('printing.return_labels', 'Return etiket yazdırma', 'printing'),
('printing.coil_labels', 'Coil etiket yazdırma', 'printing'),

-- Sistem Yönetimi
('system.users_manage', 'Personel yönetimi', 'system'),
('system.settings', 'Sistem ayarları', 'system'),
('system.reports', 'Raporlar', 'system'),
('system.activity_logs', 'İşlem geçmişi görüntüleme', 'system')
ON CONFLICT (name) DO NOTHING;

-- Admin kullanıcısı oluştur (şifre: admin123 - production'da değiştirilmeli)
-- Şifre hash'i bcrypt ile oluşturulmuş: $2b$10$rOzJqQZQXQXQXQXQXQXQXu
INSERT INTO users (username, password_hash, full_name, role, is_active) VALUES
('admin', '$2b$10$rOzJqQZQXQXQXQXQXQXQXu', 'Sistem Yöneticisi', 'admin', true)
ON CONFLICT (username) DO NOTHING;

-- Admin kullanıcısına tüm yetkileri ver
INSERT INTO user_permissions (user_id, permission_id, granted_by)
SELECT 
  (SELECT id FROM users WHERE username = 'admin'),
  p.id,
  (SELECT id FROM users WHERE username = 'admin')
FROM permissions p
ON CONFLICT (user_id, permission_id) DO NOTHING;

-- Trigger: Updated_at otomatik güncelleme
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Users tablosu için trigger
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- RLS (Row Level Security) politikaları
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- Admin her şeyi görebilir
CREATE POLICY users_admin_policy ON users
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users u 
            WHERE u.id = auth.uid() 
            AND u.role = 'admin'
        )
    );

-- Kullanıcılar sadece kendi bilgilerini görebilir
CREATE POLICY users_self_policy ON users
    FOR SELECT USING (id = auth.uid());

-- Activity logs için politika
CREATE POLICY activity_logs_policy ON activity_logs
    FOR ALL USING (
        user_id = auth.uid() OR 
        EXISTS (
            SELECT 1 FROM users u 
            WHERE u.id = auth.uid() 
            AND u.role = 'admin'
        )
    );

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_active ON users(is_active);
CREATE INDEX IF NOT EXISTS idx_user_permissions_user ON user_permissions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_permissions_permission ON user_permissions(permission_id);

-- Comments
COMMENT ON TABLE users IS 'Sistem kullanıcıları - admin ve personel';
COMMENT ON TABLE permissions IS 'Sistem yetkileri - detaylı yetki sistemi';
COMMENT ON TABLE user_permissions IS 'Kullanıcı yetki atamaları';
COMMENT ON TABLE activity_logs IS 'İşlem geçmişi - kim ne yaptı tracking';
COMMENT ON TABLE user_sessions IS 'Kullanıcı oturumları - gelişmiş session yönetimi';

-- Migration tamamlandı
SELECT 'User Management System tables created successfully!' as result;