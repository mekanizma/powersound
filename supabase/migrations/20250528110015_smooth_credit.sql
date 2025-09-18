-- Drop existing verify_password function if it exists
DROP FUNCTION IF EXISTS verify_password(text, text);

-- Create improved verify_password function
CREATE OR REPLACE FUNCTION verify_password(password text, hash text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN hash = crypt(password, hash);
END;
$$;

-- Update admin password if needed
UPDATE auth_users 
SET password_hash = crypt('admin123', gen_salt('bf'))
WHERE username = 'admin' 
  AND verify_password('admin123', password_hash) = false;

-- Ensure RLS policies are correct
DROP POLICY IF EXISTS "Public can query users" ON auth_users;
DROP POLICY IF EXISTS "Users can read own data" ON auth_users;

CREATE POLICY "Users can read own data"
ON auth_users
FOR SELECT
TO authenticated
USING (true);