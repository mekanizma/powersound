/*
  # Create admin user and settings

  1. Changes
    - Creates admin user in auth.users if not exists
    - Creates or updates admin user in public.users
    - Sets up initial user settings
  
  2. Security
    - Ensures admin role is properly set
    - Handles existing user cases
*/

-- Create admin user if not exists
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at
)
SELECT
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'admin@fiu.tr',
  crypt('admin', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM auth.users WHERE email = 'admin@fiu.tr'
);

-- Get the admin user's ID
DO $$
DECLARE
  v_auth_user_id uuid;
BEGIN
  SELECT id INTO v_auth_user_id FROM auth.users WHERE email = 'admin@fiu.tr';

  -- Create or update user record in public.users
  INSERT INTO public.users (
    id,
    email,
    username,
    full_name,
    role
  )
  VALUES (
    v_auth_user_id,
    'admin@fiu.tr',
    'admin',
    'System Administrator',
    'admin'
  )
  ON CONFLICT (username) DO UPDATE
  SET 
    id = v_auth_user_id,
    email = 'admin@fiu.tr',
    full_name = 'System Administrator',
    role = 'admin';

  -- Create initial user settings for admin
  INSERT INTO user_settings (
    user_id,
    theme,
    language,
    notifications_enabled,
    email_notifications
  )
  VALUES (
    v_auth_user_id,
    'light',
    'tr',
    true,
    true
  )
  ON CONFLICT (user_id) DO NOTHING;
END $$;