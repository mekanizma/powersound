/*
  # Şifre Doğrulama Fonksiyonu
  
  verify_password fonksiyonu:
  - Girilen şifreyi hash ile karşılaştırır
  - crypt() fonksiyonu ile bcrypt kullanır
  - Boolean değer döndürür
*/

-- verify_password fonksiyonu
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
