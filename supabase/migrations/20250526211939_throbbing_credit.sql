-- Drop existing authenticate_user function if exists
DROP FUNCTION IF EXISTS authenticate_user(text, text);

-- Recreate authenticate_user function with improved security
CREATE OR REPLACE FUNCTION authenticate_user(
  p_username TEXT,
  p_password TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*)
  INTO v_count
  FROM users
  WHERE username = p_username
  AND password_hash = crypt(p_password, password_hash);

  RETURN v_count > 0;
END;
$$;

-- Ensure admin user exists with correct password
DO $$
BEGIN
  -- Delete existing admin user if exists
  DELETE FROM users WHERE username = 'admin';
  
  -- Create fresh admin user
  INSERT INTO users (
    id,
    username,
    password_hash,
    full_name,
    role,
    created_at,
    settings
  ) VALUES (
    gen_random_uuid(),
    'admin',
    crypt('admin123', gen_salt('bf')),
    'Admin User',
    'admin',
    now(),
    '{"company_name": "POWERSOUND", "low_stock_limit": 5, "email_notifications": false, "auto_backup": true}'::jsonb
  );
END
$$;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION authenticate_user TO authenticated, anon;