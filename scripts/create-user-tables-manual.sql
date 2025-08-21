-- User Management System Tables
-- Bu SQL script'ini Supabase Dashboard > SQL Editor'da çalıştırın

-- 1. Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    role VARCHAR(20) DEFAULT 'staff' CHECK (role IN ('admin', 'staff')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    last_login TIMESTAMP WITH TIME ZONE
);

-- 2. Permissions table
CREATE TABLE IF NOT EXISTS permissions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    category VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. User permissions table
CREATE TABLE IF NOT EXISTS user_permissions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    granted_by UUID REFERENCES users(id),
    granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, permission_id)
);

-- 4. Activity logs table
CREATE TABLE IF NOT EXISTS activity_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50) NOT NULL,
    resource_id VARCHAR(100),
    details JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. User sessions table
CREATE TABLE IF NOT EXISTS user_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_accessed TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_active ON users(is_active);
CREATE INDEX IF NOT EXISTS idx_user_permissions_user ON user_permissions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_permissions_permission ON user_permissions(permission_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_action ON activity_logs(action);
CREATE INDEX IF NOT EXISTS idx_activity_logs_resource ON activity_logs(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created ON activity_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires ON user_sessions(expires_at);

-- Insert default permissions
INSERT INTO permissions (name, description, category) VALUES
-- Orders
('orders.create', 'Yeni sipariş oluşturma', 'orders'),
('orders.read', 'Siparişleri görüntüleme', 'orders'),
('orders.update', 'Sipariş bilgilerini düzenleme', 'orders'),
('orders.delete', 'Sipariş silme', 'orders'),
('orders.status_update', 'Sipariş durumu güncelleme', 'orders'),

-- Warehouse
('warehouse.create', 'Yeni ürün ekleme', 'warehouse'),
('warehouse.read', 'Depo görüntüleme', 'warehouse'),
('warehouse.update', 'Ürün bilgilerini düzenleme', 'warehouse'),
('warehouse.delete', 'Ürün silme', 'warehouse'),
('warehouse.stock_in', 'Ürün giriş işlemi', 'warehouse'),
('warehouse.stock_out', 'Ürün çıkış işlemi', 'warehouse'),
('warehouse.transfer', 'Ürün transfer işlemi', 'warehouse'),

-- Printing
('printing.qr_labels', 'QR kod etiket yazdırma', 'printing'),
('printing.return_labels', 'Return etiket yazdırma', 'printing'),
('printing.coil_labels', 'Coil etiket yazdırma', 'printing'),

-- System
('system.users_manage', 'Personel yönetimi', 'system'),
('system.settings', 'Sistem ayarları', 'system'),
('system.reports', 'Raporlar', 'system'),
('system.activity_logs', 'İşlem geçmişi görüntüleme', 'system')
ON CONFLICT (name) DO NOTHING;

-- Create admin user (password: admin123)
-- Password hash for 'admin123' using bcrypt with salt rounds 10
INSERT INTO users (username, password_hash, full_name, role, is_active) VALUES
('admin', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'System Administrator', 'admin', true)
ON CONFLICT (username) DO NOTHING;

-- Assign all permissions to admin user
INSERT INTO user_permissions (user_id, permission_id)
SELECT 
    (SELECT id FROM users WHERE username = 'admin'),
    p.id
FROM permissions p
WHERE NOT EXISTS (
    SELECT 1 FROM user_permissions up 
    WHERE up.user_id = (SELECT id FROM users WHERE username = 'admin') 
    AND up.permission_id = p.id
);

-- Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (basic policies for now)
-- Users can see their own data, admins can see all
CREATE POLICY "Users can view own data" ON users
    FOR SELECT USING (auth.uid()::text = id::text OR 
                     EXISTS (SELECT 1 FROM users WHERE id::text = auth.uid()::text AND role = 'admin'));

CREATE POLICY "Admins can manage users" ON users
    FOR ALL USING (EXISTS (SELECT 1 FROM users WHERE id::text = auth.uid()::text AND role = 'admin'));

-- Permissions are readable by all authenticated users
CREATE POLICY "Authenticated users can view permissions" ON permissions
    FOR SELECT USING (auth.role() = 'authenticated');

-- User permissions are viewable by the user or admins
CREATE POLICY "Users can view own permissions" ON user_permissions
    FOR SELECT USING (auth.uid()::text = user_id::text OR 
                     EXISTS (SELECT 1 FROM users WHERE id::text = auth.uid()::text AND role = 'admin'));

-- Activity logs are viewable by the user or admins
CREATE POLICY "Users can view own activity" ON activity_logs
    FOR SELECT USING (auth.uid()::text = user_id::text OR 
                     EXISTS (SELECT 1 FROM users WHERE id::text = auth.uid()::text AND role = 'admin'));

-- User sessions are manageable by the user or admins
CREATE POLICY "Users can manage own sessions" ON user_sessions
    FOR ALL USING (auth.uid()::text = user_id::text OR 
                  EXISTS (SELECT 1 FROM users WHERE id::text = auth.uid()::text AND role = 'admin'));

-- Add comments
COMMENT ON TABLE users IS 'Sistem kullanıcıları - personel yönetimi';
COMMENT ON TABLE permissions IS 'Sistem yetkileri - detaylı yetki sistemi';
COMMENT ON TABLE user_permissions IS 'Kullanıcı yetki atamaları';
COMMENT ON TABLE activity_logs IS 'İşlem geçmişi - kim ne yaptı tracking';
COMMENT ON TABLE user_sessions IS 'Kullanıcı oturumları - gelişmiş session yönetimi';