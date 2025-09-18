-- Drop and recreate verify_password function with better error handling
CREATE OR REPLACE FUNCTION verify_password(password text, hash text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF password IS NULL OR hash IS NULL THEN
    RETURN false;
  END IF;
  RETURN hash = crypt(password, hash);
EXCEPTION
  WHEN OTHERS THEN
    RETURN false;
END;
$$;

-- Ensure admin user exists with correct password
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM auth_users WHERE username = 'admin') THEN
    INSERT INTO auth_users (username, password_hash, role)
    VALUES ('admin', crypt('admin123', gen_salt('bf')), 'admin');
  ELSE
    UPDATE auth_users 
    SET password_hash = crypt('admin123', gen_salt('bf'))
    WHERE username = 'admin';
  END IF;
END
$$;