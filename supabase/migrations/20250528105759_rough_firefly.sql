/*
  # Admin kullanıcısı oluşturma

  1. Değişiklikler
    - Admin kullanıcısı için yeni kayıt ekleme
    
  2. Güvenlik
    - Şifre hash'lenerek saklanacak
*/

-- Önce mevcut admin kullanıcısını siliyoruz (eğer varsa)
DELETE FROM auth_users WHERE username = 'admin';

-- Yeni admin kullanıcısı ekliyoruz
INSERT INTO auth_users (
  username,
  password_hash,
  role
) VALUES (
  'admin',
  crypt('admin123', gen_salt('bf')),
  'admin'
);