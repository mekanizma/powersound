/*
  # Fix Admin User Authentication
  
  1. Changes
    - Create admin user in auth_users table
    - Set correct password hash
    - Ensure proper role assignment
*/

-- Enable pgcrypto extension if not exists
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create verify_password function if not exists
CREATE OR REPLACE FUNCTION verify_password(password TEXT, hash TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN hash = crypt(password, hash);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create admin user in auth_users table
DO $$ 
BEGIN
  -- Delete existing admin user if exists
  DELETE FROM auth_users WHERE username = 'admin';
  
  -- Create fresh admin user
  INSERT INTO auth_users (
    username,
    password_hash,
    role
  ) VALUES (
    'admin',
    crypt('admin123', gen_salt('bf')),
    'admin'
  );
END $$;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION verify_password TO authenticated, anon;


