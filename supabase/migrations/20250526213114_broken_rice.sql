-- Drop existing authenticate_user function
DROP FUNCTION IF EXISTS authenticate_user(text, text);

-- Create improved authenticate_user function that returns user_id and role
CREATE OR REPLACE FUNCTION authenticate_user(
  p_username TEXT,
  p_password TEXT
)
RETURNS TABLE (
  user_id uuid,
  role text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Log authentication attempt
  RAISE NOTICE 'Authentication attempt for username: %', p_username;
  
  RETURN QUERY
  SELECT 
    u.id,
    u.role
  FROM users u
  WHERE u.username = p_username
  AND u.password_hash = crypt(p_password, u.password_hash);
END;
$$;

-- Ensure admin user exists with correct credentials
DO $$
BEGIN
  -- Delete existing admin user if exists
  DELETE FROM users WHERE username = 'Admin';
  
  -- Create fresh admin user with specified credentials
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
    'Admin',
    crypt('Admin1234', gen_salt('bf')),
    'Admin User',
    'admin',
    now(),
    '{"company_name": "POWERSOUND", "low_stock_limit": 5, "email_notifications": false, "auto_backup": true}'::jsonb
  );
  
  RAISE NOTICE 'Admin user created successfully';
END
$$;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION authenticate_user TO authenticated, anon;