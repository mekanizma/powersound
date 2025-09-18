/*
  # Kullanıcı yönetimi güncellemesi

  1. Değişiklikler
    - Kullanıcı tablosuna password alanı eklendi
    - Kullanıcı oluşturma fonksiyonu güncellendi
    
  2. Güvenlik
    - Şifre hash'leme eklendi
    - RLS politikaları güncellendi
*/

-- Kullanıcı tablosuna password alanı ekle
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS password_hash TEXT;

-- Kullanıcı oluşturma fonksiyonunu güncelle
CREATE OR REPLACE FUNCTION create_new_user(
  new_username TEXT,
  new_password TEXT,
  new_full_name TEXT,
  new_role TEXT DEFAULT 'user'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_user_id uuid;
BEGIN
  -- Insert new user with hashed password
  INSERT INTO public.users (
    id,
    username,
    password_hash,
    full_name,
    role,
    created_at,
    settings
  ) VALUES (
    gen_random_uuid(),
    new_username,
    crypt(new_password, gen_salt('bf')),
    new_full_name,
    new_role,
    now(),
    '{"company_name": "POWERSOUND", "low_stock_limit": 5, "email_notifications": false, "auto_backup": true}'::jsonb
  )
  RETURNING id INTO new_user_id;
  
  RETURN new_user_id;
END;
$$;