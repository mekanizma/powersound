/*
  # Create admin user and settings
  
  1. Changes
    - Creates admin user in auth.users if not exists
    - Creates or updates admin user in public.users
    - Creates admin user settings if not exists
    
  2. Security
    - Uses secure password hashing
    - Maintains referential integrity
*/

DO $$
DECLARE
  v_auth_user_id uuid;
  v_public_user_id uuid;
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

  -- Check if user exists in public.users
  SELECT id INTO v_public_user_id
  FROM public.users
  WHERE email = 'admin@fiu.tr';

  IF v_public_user_id IS NULL THEN
    -- Create new user record in public.users
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
    );
  ELSE
    -- Update existing user record
    UPDATE public.users
    SET
      username = 'admin',
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