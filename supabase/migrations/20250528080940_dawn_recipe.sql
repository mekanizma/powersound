/*
  # Create or update admin user

  This migration ensures the admin user exists in both auth.users and public.users tables,
  and creates associated user settings. It handles existing records carefully to avoid
  unique constraint violations.

  1. Changes:
    - Creates admin user in auth.users if not exists
    - Creates or updates admin user in public.users
    - Creates user settings for admin if not exists
    
  2. Security:
    - Sets up initial admin credentials
    - Preserves existing user data where appropriate
*/

DO $$
DECLARE
  v_auth_user_id uuid;
  v_public_user_id uuid;
  v_username text;
BEGIN
  -- First try to get existing user ID from auth.users
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

  -- Check if user exists in public.users and get current username
  SELECT id, username INTO v_public_user_id, v_username
  FROM public.users
  WHERE email = 'admin@fiu.tr';

  IF v_public_user_id IS NULL THEN
    -- Create new user record in public.users with a unique username
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
      CASE 
        WHEN EXISTS (SELECT 1 FROM public.users WHERE username = 'admin')
        THEN 'admin_' || floor(random() * 1000)::text
        ELSE 'admin'
      END,
      'System Administrator',
      'admin',
      NOW()
    );
  ELSE
    -- Update existing user record, preserving username if it exists
    UPDATE public.users
    SET
      full_name = 'System Administrator',
      role = 'admin'
    WHERE id = v_public_user_id;
  END IF;

  -- Create initial user settings if they don't exist
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