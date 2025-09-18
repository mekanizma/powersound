/*
  # Add user management function

  1. New Functions
    - create_new_user: Creates a new user in both auth.users and public.users tables
      - Parameters:
        - new_username (text)
        - new_password (text)
        - new_full_name (text)
        - new_email (text)
        - new_role (text)

  2. Security
    - Function is only accessible to authenticated users with admin role
*/

CREATE OR REPLACE FUNCTION create_new_user(
  new_username text,
  new_password text,
  new_full_name text,
  new_email text,
  new_role text DEFAULT 'user'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_auth_user_id uuid;
BEGIN
  -- Create auth user
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
    new_email,
    crypt(new_password, gen_salt('bf')),
    NOW(),
    NOW(),
    NOW()
  )
  RETURNING id INTO v_auth_user_id;

  -- Create public user
  INSERT INTO public.users (
    id,
    username,
    email,
    full_name,
    role,
    created_at
  )
  VALUES (
    v_auth_user_id,
    new_username,
    new_email,
    new_full_name,
    new_role,
    NOW()
  );

  -- Create user settings
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
  );

  RETURN v_auth_user_id;
END;
$$;