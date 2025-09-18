/*
  # Fix admin user authentication

  Updates the admin user's password and ensures proper configuration in both auth.users and public.users tables.

  1. Changes
    - Sets admin password to 'admin'
    - Confirms email if not already confirmed
    - Sets correct provider and role metadata
    - Updates public.users role to 'admin'
*/

-- Reset admin user password and ensure account is properly configured
DO $$
DECLARE
  v_auth_user_id uuid;
BEGIN
  -- Get admin user ID
  SELECT id INTO v_auth_user_id 
  FROM auth.users 
  WHERE email = 'admin@fiu.tr';

  -- Update auth user if exists
  IF v_auth_user_id IS NOT NULL THEN
    -- Update password and ensure email is confirmed
    UPDATE auth.users
    SET 
      encrypted_password = crypt('admin', gen_salt('bf')),
      email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
      updated_at = NOW(),
      raw_app_meta_data = jsonb_set(
        raw_app_meta_data,
        '{provider}',
        '"email"'
      ),
      raw_user_meta_data = jsonb_set(
        raw_user_meta_data,
        '{role}',
        '"admin"'
      )
    WHERE id = v_auth_user_id;

    -- Ensure correct role in public.users
    UPDATE public.users
    SET role = 'admin'
    WHERE id = v_auth_user_id;
  END IF;
END $$;