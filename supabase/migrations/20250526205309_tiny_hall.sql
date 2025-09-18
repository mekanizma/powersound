-- Drop existing policies
DROP POLICY IF EXISTS "Users can read their own data" ON users;
DROP POLICY IF EXISTS "Only admins can manage users" ON users;

-- Update users table
ALTER TABLE users
DROP COLUMN IF EXISTS password_hash CASCADE;

-- Add new columns if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'username') THEN
    ALTER TABLE users ADD COLUMN username text UNIQUE;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'role') THEN
    ALTER TABLE users ADD COLUMN role text DEFAULT 'user';
  END IF;
END $$;

-- Update or insert admin user
INSERT INTO users (id, username, full_name, role)
VALUES (
  '00000000-0000-0000-0000-000000000000',
  'admin',
  'Admin User',
  'admin'
)
ON CONFLICT (username) 
DO UPDATE SET
  full_name = 'Admin User',
  role = 'admin';

-- Update RLS policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own data"
ON users
FOR SELECT
TO authenticated
USING ((auth.uid() = id) OR ((auth.jwt() ->> 'role'::text) = 'admin'::text));

CREATE POLICY "Only admins can manage users"
ON users
FOR ALL
TO authenticated
USING ((auth.jwt() ->> 'role'::text) = 'admin'::text)
WITH CHECK ((auth.jwt() ->> 'role'::text) = 'admin'::text);