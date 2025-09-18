/*
  # Authentication System Setup

  1. Changes
    - Enable pgcrypto extension
    - Create password verification function
    - Set up admin user

  2. Security
    - Password hashing using bcrypt
    - Secure password verification function
*/

-- Enable pgcrypto extension
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create verify_password function with better error handling
CREATE OR REPLACE FUNCTION verify_password(
  input_password text,
  stored_hash text
) RETURNS boolean AS $$
BEGIN
  -- Handle null inputs
  IF input_password IS NULL OR stored_hash IS NULL THEN
    RETURN false;
  END IF;

  -- Verify password using pgcrypto
  RETURN stored_hash = crypt(input_password, stored_hash);
EXCEPTION 
  WHEN OTHERS THEN
    RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create admin user if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM auth_users WHERE username = 'admin'
  ) THEN
    INSERT INTO auth_users (
      username,
      password_hash,
      role,
      full_name
    ) VALUES (
      'admin',
      crypt('admin123', gen_salt('bf')),
      'admin',
      'System Administrator'
    );
  ELSE
    UPDATE auth_users 
    SET 
      password_hash = crypt('admin123', gen_salt('bf')),
      role = 'admin',
      full_name = 'System Administrator',
      updated_at = now()
    WHERE username = 'admin';
  END IF;
END
$$;