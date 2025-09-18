/*
  # Create admin user

  1. Changes
    - Insert admin user with email admin@fiu.tr
    - Set role as 'admin'
    - Set password hash for password 'admin123'
*/

-- Insert admin user if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM auth.users WHERE email = 'admin@fiu.tr'
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
      'admin@fiu.tr',
      crypt('admin123', gen_salt('bf')),
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
      'admin@fiu.tr',
      'admin',
      'System Admin',
      'admin'
    );
  END IF;
END $$;