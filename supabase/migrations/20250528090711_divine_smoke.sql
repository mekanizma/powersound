/*
  # Add new admin user

  1. Changes
    - Creates a new admin user with specified credentials
    - Adds user to both auth.users and public.users tables
    - Sets up full admin privileges
*/

-- Insert admin user if not exists
DO $$
DECLARE
  user_id uuid;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM auth.users WHERE email = 'admin@powersound.com'
  ) THEN
    -- Insert into auth.users
    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      created_at,
      updated_at,
      confirmation_token,
      email_change_token_current,
      email_change_token_new,
      recovery_token
    )
    VALUES (
      '00000000-0000-0000-0000-000000000000',
      gen_random_uuid(),
      'authenticated',
      'authenticated',
      'admin@powersound.com',
      crypt('Admin123', gen_salt('bf')),
      NOW(),
      NOW(),
      NOW(),
      '',
      '',
      '',
      ''
    )
    RETURNING id INTO user_id;

    -- Insert into public.users
    INSERT INTO public.users (
      id,
      email,
      username,
      full_name,
      role
    )
    VALUES (
      user_id,
      'admin@powersound.com',
      'powersound',
      'PowerSound Admin',
      'admin'
    );
  END IF;
END $$;