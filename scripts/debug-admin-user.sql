-- Debug Admin User
-- Bu SQL'i Supabase Dashboard > SQL Editor'da çalıştırın

-- 1. Admin kullanıcısını kontrol et
SELECT 
    id, 
    username, 
    full_name, 
    role, 
    is_active,
    password_hash,
    created_at
FROM users 
WHERE username = 'admin';

-- 2. Tüm kullanıcıları listele
SELECT 
    id, 
    username, 
    full_name, 
    role, 
    is_active,
    created_at
FROM users 
ORDER BY created_at DESC;

-- 3. Permissions tablosunu kontrol et
SELECT 
    id,
    name,
    description,
    category
FROM permissions 
ORDER BY category, name;

-- 4. Admin kullanıcısının yetkilerini kontrol et
SELECT 
    up.id,
    u.username,
    p.name as permission_name,
    p.category,
    up.granted_at
FROM user_permissions up
JOIN users u ON up.user_id = u.id
JOIN permissions p ON up.permission_id = p.id
WHERE u.username = 'admin'
ORDER BY p.category, p.name;