/*
  # Kullanıcı Yönetimi RPC Fonksiyonları
  
  1. Fonksiyonlar
    - create_user: Yeni kullanıcı oluşturur
    - delete_user: Kullanıcı siler
  
  2. Güvenlik
    - Sadece admin kullanıcılar bu fonksiyonları kullanabilir
    - Şifre hash'leme ile güvenli saklama
*/

-- create_user fonksiyonu
CREATE OR REPLACE FUNCTION create_user(
  p_username text,
  p_password text,
  p_role text DEFAULT 'user'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id uuid;
BEGIN
  -- Admin kontrolü
  IF NOT EXISTS (
    SELECT 1 FROM auth_users 
    WHERE id = auth.uid() 
    AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Sadece yöneticiler kullanıcı oluşturabilir';
  END IF;

  -- Kullanıcı adı kontrolü
  IF EXISTS (SELECT 1 FROM auth_users WHERE username = p_username) THEN
    RAISE EXCEPTION 'Bu kullanıcı adı zaten kullanılıyor';
  END IF;

  -- Yeni kullanıcı oluştur
  INSERT INTO auth_users (
    id,
    username,
    password_hash,
    role
  ) VALUES (
    gen_random_uuid(),
    p_username,
    crypt(p_password, gen_salt('bf')),
    p_role
  ) RETURNING id INTO v_user_id;

  RETURN v_user_id;
END;
$$;

-- delete_user fonksiyonu
CREATE OR REPLACE FUNCTION delete_user(
  p_user_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Admin kontrolü
  IF NOT EXISTS (
    SELECT 1 FROM auth_users 
    WHERE id = auth.uid() 
    AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Sadece yöneticiler kullanıcı silebilir';
  END IF;

  -- Kendi hesabını silme kontrolü
  IF p_user_id = auth.uid() THEN
    RAISE EXCEPTION 'Kendi hesabınızı silemezsiniz';
  END IF;

  -- Kullanıcı var mı kontrol et
  IF NOT EXISTS (SELECT 1 FROM auth_users WHERE id = p_user_id) THEN
    RAISE EXCEPTION 'Kullanıcı bulunamadı';
  END IF;

  -- Kullanıcıyı sil
  DELETE FROM auth_users WHERE id = p_user_id;

  -- İlişkili verileri de sil (ürünler, hareketler vb.)
  -- Bu kısım ihtiyaca göre genişletilebilir
  -- NOT: products tablosunda created_by kolonu var, movements tablosunda user_id var
  DELETE FROM products WHERE created_by = p_user_id;
  DELETE FROM movements WHERE user_id = p_user_id;

END;
$$;

-- Fonksiyonlara execute izni ver
GRANT EXECUTE ON FUNCTION create_user TO authenticated;
GRANT EXECUTE ON FUNCTION delete_user TO authenticated;
