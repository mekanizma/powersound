/*
  # Create admin user if not exists

  1. Changes
    - Creates admin user in auth.users if not exists
    - Creates or updates corresponding public.users record
    - Creates user settings for admin
    
  2. Security
    - Handles duplicate email cases
    - Uses proper error handling
*/

DO $$
DECLARE
  v_auth_user_id uuid;
  v_existing_user_id uuid;
BEGIN
  -- First check if user exists in public.users
  SELECT id INTO v_existing_user_id 
  FROM public.users 
  WHERE email = 'admin@fiu.tr';

  -- If no existing user, try to create new auth user
  IF v_existing_user_id IS NULL THEN
    -- Check auth.users
    SELECT id INTO v_auth_user_id 
    FROM auth.users 
    WHERE email = 'admin@fiu.tr';

    -- Create new auth user if doesn't exist
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

    -- Create public user record
    INSERT INTO public.users (
      id,
      email,
      username,
      full_name,
      role,
      created_at
    )
    VALUES (
      COALESCE(v_auth_user_id, v_existing_user_id),
      'admin@fiu.tr',
      'admin',
      'System Administrator',
      'admin',
      NOW()
    )
    ON CONFLICT (email) 
    DO UPDATE SET
      username = EXCLUDED.username,
      full_name = EXCLUDED.full_name,
      role = EXCLUDED.role;

    -- Get the final user id
    SELECT id INTO v_auth_user_id 
    FROM public.users 
    WHERE email = 'admin@fiu.tr';

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
  END IF;
END $$;