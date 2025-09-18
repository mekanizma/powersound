-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can read own data" ON users;
DROP POLICY IF EXISTS "Users can read their own data" ON users;
DROP POLICY IF EXISTS "Only admins can insert users" ON users;
DROP POLICY IF EXISTS "Only admins can manage users" ON users;

-- Update users table structure
ALTER TABLE users
ALTER COLUMN password_hash DROP NOT NULL;

-- Create auth schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS auth;

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

-- Insert default admin user if not exists
INSERT INTO users (id, email, username, full_name, role)
SELECT 
  '00000000-0000-0000-0000-000000000000',
  'admin@example.com',
  'admin',
  'Admin User',
  'admin'
WHERE NOT EXISTS (
  SELECT 1 FROM users WHERE email = 'admin@example.com'
);