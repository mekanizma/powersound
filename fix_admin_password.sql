-- Admin kullanıcısının şifresini sıfırla
-- Bu scripti Supabase SQL Editor'da çalıştırın

-- Önce verify_password fonksiyonunu oluştur
CREATE OR REPLACE FUNCTION verify_password(
  password text,
  hash text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Şifre ve hash boş olamaz
  IF password IS NULL OR hash IS NULL THEN
    RETURN false;
  END IF;
  
  -- crypt() fonksiyonu ile şifre doğrulama
  -- crypt(girilen_şifre, mevcut_hash) = mevcut_hash ise doğru
  RETURN crypt(password, hash) = hash;
END;
$$;

-- Fonksiyona execute izni ver
GRANT EXECUTE ON FUNCTION verify_password TO authenticated;
GRANT EXECUTE ON FUNCTION verify_password TO anon;

-- Admin kullanıcısının şifresini güncelle
UPDATE auth_users 
SET password_hash = crypt('admin123', gen_salt('bf'))
WHERE username = 'admin' AND id = '211c7676-7e10-4ac2-9261-5e2d597a224c';

-- Güncelleme sonucunu kontrol et
SELECT id, username, role, 
       CASE 
         WHEN password_hash IS NOT NULL THEN 'Şifre güncellendi'
         ELSE 'Şifre güncellenemedi'
       END as durum
FROM auth_users 
WHERE username = 'admin';
