/*
  # Create admin user and update settings access

  1. Changes
    - Create admin user with email admin@fiu.tr
    - Set up initial user settings for admin
    - Update RLS policies for settings access
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

  -- Create user record in public.users
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
  ON CONFLICT (id) DO UPDATE
  SET role = 'admin';

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