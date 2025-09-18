/*
  # Fix authentication setup

  1. Changes
    - Remove password_hash requirement since Supabase handles auth
    - Update user table structure and policies
    - Ensure default admin user exists

  2. Security
    - Enable RLS on users table
    - Add policies for user access control
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users can read their own data" ON users;
DROP POLICY IF EXISTS "Only admins can manage users" ON users;

-- Update users table
ALTER TABLE users
DROP COLUMN IF EXISTS password_hash;

-- Update RLS policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own data"
ON users
FOR SELECT
TO authenticated
USING (
  auth.uid() = id OR 
  auth.jwt() ->> 'role' = 'admin'
);

CREATE POLICY "Only admins can manage users"
ON users
FOR ALL
TO authenticated
USING (auth.jwt() ->> 'role' = 'admin')
WITH CHECK (auth.jwt() ->> 'role' = 'admin');

-- Ensure admin user exists
INSERT INTO users (id, email, username, full_name, role)
VALUES (
  '00000000-0000-0000-0000-000000000000',
  'admin@example.com',
  'admin',
  'Admin User',
  'admin'
)
ON CONFLICT (email) DO NOTHING;