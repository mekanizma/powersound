-- Drop existing authenticate_user function
DROP FUNCTION IF EXISTS authenticate_user(text, text);

-- Create improved authenticate_user function that returns user_id
CREATE OR REPLACE FUNCTION authenticate_user(
  p_username TEXT,
  p_password TEXT
)
RETURNS TABLE (
  user_id uuid,
  authenticated boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.id,
    TRUE as authenticated
  FROM users u
  WHERE u.username = p_username
  AND u.password_hash = crypt(p_password, u.password_hash);
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