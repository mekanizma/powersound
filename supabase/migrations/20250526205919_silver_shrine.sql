-- Add settings column to users table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'settings') THEN
    ALTER TABLE users ADD COLUMN settings jsonb DEFAULT '{}'::jsonb;
  END IF;
END $$;

-- Update or create RLS policies for user management
DROP POLICY IF EXISTS "Users can read their own data" ON users;
DROP POLICY IF EXISTS "Only admins can manage users" ON users;

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

-- Create function to update user settings
CREATE OR REPLACE FUNCTION update_user_settings(
  user_id uuid,
  new_settings jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM users 
    WHERE id = user_id 
    AND (auth.jwt() ->> 'role') = 'admin'
  ) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  UPDATE users
  SET settings = new_settings
  WHERE id = user_id
  RETURNING settings;

  RETURN new_settings;
END;
$$;

-- Ensure admin user exists with default settings
INSERT INTO users (id, username, full_name, role, settings)
VALUES (
  '00000000-0000-0000-0000-000000000000',
  'admin',
  'Admin User',
  'admin',
  '{
    "company_name": "POWERSOUND",
    "low_stock_limit": 5,
    "email_notifications": false,
    "auto_backup": true
  }'::jsonb
)
ON CONFLICT (username) 
DO UPDATE SET
  settings = EXCLUDED.settings,
  role = 'admin';