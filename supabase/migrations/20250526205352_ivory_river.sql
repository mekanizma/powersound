-- Drop existing policies
DROP POLICY IF EXISTS "Users can read their own data" ON users;
DROP POLICY IF EXISTS "Only admins can manage users" ON users;

-- Update users table structure
ALTER TABLE users
DROP COLUMN IF EXISTS password_hash CASCADE;

-- Ensure required columns exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'settings') THEN
    ALTER TABLE users ADD COLUMN settings jsonb DEFAULT '{}'::jsonb;
  END IF;
END $$;

-- Update admin user with default settings
UPDATE users 
SET settings = jsonb_build_object(
  'company_name', 'POWERSOUND',
  'low_stock_limit', 5,
  'email_notifications', false,
  'auto_backup', true
)
WHERE username = 'admin';

-- Create RLS policies
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
    AND (auth.jwt() ->> 'role'::text) = 'admin'::text
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