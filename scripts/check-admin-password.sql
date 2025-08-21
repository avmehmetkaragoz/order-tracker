-- Check Admin User Password
-- Bu SQL'i Supabase Dashboard > SQL Editor'da çalıştırın

-- Admin kullanıcısının detaylarını göster
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

-- Doğru password hash ile güncelle
UPDATE users 
SET password_hash = '$2b$10$ovH7C1zTKY5xk5/oE4TIfOmTmcaOVWkf6SAONwqBy0zIKI6P8XNNu'
WHERE username = 'admin';

-- Güncellenmiş admin kullanıcısını kontrol et
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