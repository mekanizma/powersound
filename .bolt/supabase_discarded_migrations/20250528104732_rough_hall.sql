/*
  # Create admin user
  
  1. Changes
    - Creates admin user in auth.users
    - Adds admin user details to public.users
    - Handles existing username case
  
  2. Security
    - Sets admin role and permissions
*/

-- First check if admin user exists
DO $$
DECLARE
  auth_user_id uuid;
BEGIN
  -- Create auth user if not exists
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'admin@powersound.com') THEN
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
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      gen_random_uuid(),
      'authenticated',
      'authenticated',
      'admin@powersound.com',
      crypt('admin123', gen_salt('bf')),
      now(),
      now(),
      now()
    ) RETURNING id INTO auth_user_id;

    -- Add user details if auth user was created
    INSERT INTO public.users (
      id,
      email,
      username,
      full_name,
      role,
      created_at
    ) VALUES (
      auth_user_id,
      'admin@powersound.com',
      'admin',
      'System Admin',
      'admin',
      now()
    )
    ON CONFLICT (username) DO UPDATE
    SET
      role = 'admin',
      full_name = 'System Admin',
      updated_at = now();
  END IF;
END $$;