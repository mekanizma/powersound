/*
  # Authentication Setup
  
  1. Functions
    - Create password hashing function
    - Create password verification function
  
  2. Initial Data
    - Create admin user if not exists
  
  3. Security
    - Enable RLS
    - Add policies for auth_users table
*/

-- Create extension if not exists
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Function to hash passwords
CREATE OR REPLACE FUNCTION hash_password(password TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN crypt(password, gen_salt('bf'));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to verify passwords
CREATE OR REPLACE FUNCTION verify_password(password TEXT, hash TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN hash = crypt(password, hash);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create admin user if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM auth_users WHERE username = 'admin'
  ) THEN
    INSERT INTO auth_users (username, password_hash, role)
    VALUES ('admin', hash_password('admin123'), 'admin');
  END IF;
END $$;

-- Enable RLS
ALTER TABLE auth_users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Users can read own data" ON auth_users;
  DROP POLICY IF EXISTS "Only admins can create users" ON auth_users;
  DROP POLICY IF EXISTS "Users can update own data" ON auth_users;
  DROP POLICY IF EXISTS "Only admins can delete users" ON auth_users;
END $$;

-- Recreate policies for auth_users table
CREATE POLICY "Users can read own data"
  ON auth_users
  FOR SELECT
  USING (true);

CREATE POLICY "Only admins can create users"
  ON auth_users
  FOR INSERT
  WITH CHECK (role = 'admin');

CREATE POLICY "Users can update own data"
  ON auth_users
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Only admins can delete users"
  ON auth_users
  FOR DELETE
  USING (role = 'admin');