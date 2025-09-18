/*
  # Create admin user

  1. Changes
    - Disables trigger temporarily
    - Creates admin user if not exists
    - Re-enables trigger
    
  2. Security
    - Creates authenticated admin user
    - Sets up proper role and permissions
*/

-- Temporarily disable the handle_new_user trigger
ALTER TABLE auth.users DISABLE TRIGGER handle_new_user;

-- Create admin user if not exists
DO $$
DECLARE
  v_user_id uuid;
BEGIN
  -- Check if admin email exists in auth.users
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = 'admin@powersound.com';
  
  -- If admin doesn't exist, create auth user
  IF v_user_id IS NULL THEN
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
    ) RETURNING id INTO v_user_id;
  END IF;

  -- Update or insert admin user in public.users
  INSERT INTO public.users (
    id,
    email,
    username,
    full_name,
    role,
    created_at,
    updated_at
  ) VALUES (
    v_user_id,
    'admin@powersound.com',
    'admin',
    'System Admin',
    'admin',
    now(),
    now()
  )
  ON CONFLICT (username) 
  DO UPDATE SET
    email = 'admin@powersound.com',
    role = 'admin',
    full_name = 'System Admin',
    updated_at = now();
END $$;

-- Re-enable the handle_new_user trigger
ALTER TABLE auth.users ENABLE TRIGGER handle_new_user;