-- Fix Admin User Password Hash
-- Bu SQL script'ini Supabase Dashboard > SQL Editor'da çalıştırın

-- Admin kullanıcısını kontrol et
SELECT * FROM users WHERE username = 'admin';

-- Admin kullanıcısının şifresini güncelle veya oluştur
INSERT INTO users (username, password_hash, full_name, role, is_active) 
VALUES ('admin', '$2b$10$ovH7C1zTKY5xk5/oE4TIfOmTmcaOVWkf6SAONwqBy0zIKI6P8XNNu', 'System Administrator', 'admin', true)
ON CONFLICT (username) DO UPDATE SET 
password_hash = '$2b$10$ovH7C1zTKY5xk5/oE4TIfOmTmcaOVWkf6SAONwqBy0zIKI6P8XNNu';

-- Admin kullanıcısına tüm yetkileri ata
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

-- Sonucu kontrol et
SELECT 
    u.username, 
    u.full_name, 
    u.role, 
    u.is_active,
    COUNT(up.permission_id) as permission_count
FROM users u
LEFT JOIN user_permissions up ON u.id = up.user_id
WHERE u.username = 'admin'
GROUP BY u.id, u.username, u.full_name, u.role, u.is_active;

-- Test için: admin123 şifresi için bcrypt hash
-- Hash: $2b$10$ovH7C1zTKY5xk5/oE4TIfOmTmcaOVWkf6SAONwqBy0zIKI6P8XNNu
-- Password: admin123