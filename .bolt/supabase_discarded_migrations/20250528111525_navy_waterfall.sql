/*
  # Fix authentication and add admin user
  
  1. Changes
    - Add verify_password function for secure password verification
    - Create admin user with secure password hash
    
  2. Security
    - Uses secure password hashing with bcrypt
    - Adds proper error handling
*/

-- Enable the pgcrypto extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create verify_password function
CREATE OR REPLACE FUNCTION verify_password(
  password text,
  hash text
) RETURNS boolean AS $$
BEGIN
  RETURN (
    CASE
      WHEN password IS NULL OR hash IS NULL THEN false
      ELSE hash = crypt(password, hash)
    END
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insert admin user if not exists
INSERT INTO auth_users (username, password_hash, role, full_name)
VALUES (
  'admin',
  crypt('admin123', gen_salt('bf')),
  'admin',
  'System Administrator'
)
ON CONFLICT (username) 
DO UPDATE SET 
  password_hash = crypt('admin123', gen_salt('bf')),
  role = 'admin',
  full_name = 'System Administrator',
  updated_at = now();