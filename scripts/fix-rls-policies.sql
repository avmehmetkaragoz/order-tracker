-- Fix RLS Policies - Infinite Recursion Problem
-- Bu SQL'i Supabase Dashboard > SQL Editor'da çalıştırın

-- Önce tüm mevcut politikaları sil
DROP POLICY IF EXISTS "Users can view own data" ON users;
DROP POLICY IF EXISTS "Admins can manage users" ON users;
DROP POLICY IF EXISTS "Authenticated users can view permissions" ON permissions;
DROP POLICY IF EXISTS "Users can view own permissions" ON user_permissions;
DROP POLICY IF EXISTS "Users can view own activity" ON activity_logs;
DROP POLICY IF EXISTS "Users can manage own sessions" ON user_sessions;

-- RLS'i geçici olarak devre dışı bırak
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE permissions DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_permissions DISABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions DISABLE ROW LEVEL SECURITY;

-- Test için RLS olmadan çalışmasını sağla
-- Production'da RLS'i tekrar aktif edebiliriz

-- Alternatif: Basit RLS politikaları (sonsuz döngü olmadan)
-- Bu politikalar auth.uid() kullanmaz, sadece temel kontroller yapar

-- Users tablosu için basit politika
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all operations for now" ON users FOR ALL USING (true);

-- Permissions tablosu için basit politika  
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow read permissions" ON permissions FOR SELECT USING (true);

-- User permissions tablosu için basit politika
ALTER TABLE user_permissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all user_permissions" ON user_permissions FOR ALL USING (true);

-- Activity logs tablosu için basit politika
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all activity_logs" ON activity_logs FOR ALL USING (true);

-- User sessions tablosu için basit politika
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all user_sessions" ON user_sessions FOR ALL USING (true);

-- Test: Admin kullanıcısını kontrol et
SELECT 
    id, 
    username, 
    full_name, 
    role, 
    is_active,
    password_hash
FROM users 
WHERE username = 'admin';