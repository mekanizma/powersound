/*
  # Add admin user to Supabase auth

  1. Changes
    - Creates admin user in auth.users if not exists
    - Sets up admin user in public.users table
    - Configures initial user settings
    
  2. Security
    - Uses secure password hashing
    - Sets appropriate role and permissions
*/

-- Create admin user in auth.users if not exists
DO $$
DECLARE
  v_auth_user_id uuid;
BEGIN
  -- First try to get existing user ID
  SELECT id INTO v_auth_user_id 
  FROM auth.users 
  WHERE email = 'admin@fiu.tr';

  -- If user doesn't exist, create new auth user
  IF v_auth_user_id IS NULL THEN
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
    VALUES (
      '00000000-0000-0000-0000-000000000000',
      gen_random_uuid(),
      'authenticated',
      'authenticated',
      'admin@fiu.tr',
      crypt('admin', gen_salt('bf')),
      NOW(),
      NOW(),
      NOW()
    )
    RETURNING id INTO v_auth_user_id;
  END IF;

  -- Create or update user record in public.users
  INSERT INTO public.users (
    id,
    email,
    username,
    full_name,
    role,
    created_at
  )
  VALUES (
    v_auth_user_id,
    'admin@fiu.tr',
    'admin',
    'System Administrator',
    'admin',
    NOW()
  )
  ON CONFLICT (username) 
  DO UPDATE SET
    id = EXCLUDED.id,
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role;

  -- Create initial user settings
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