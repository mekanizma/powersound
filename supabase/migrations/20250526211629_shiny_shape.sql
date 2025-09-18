-- Kullanıcı doğrulama fonksiyonu
CREATE OR REPLACE FUNCTION authenticate_user(
  p_username TEXT,
  p_password TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM users
    WHERE username = p_username
    AND password_hash = crypt(p_password, password_hash)
  );
END;
$$;

-- Fonksiyona erişim izni ver
GRANT EXECUTE ON FUNCTION authenticate_user TO authenticated, anon;