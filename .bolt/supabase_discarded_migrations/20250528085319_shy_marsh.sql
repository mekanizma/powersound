/*
  # Fix admin authentication

  1. Updates
    - Reset admin user password
    - Ensure admin role is set correctly
    - Update email confirmation status
    
  2. Security
    - Updates auth settings for the admin user
    - Preserves existing data
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
    SET 
      role = 'admin',
      updated_at = NOW()
    WHERE id = v_auth_user_id;
  END IF;
END $$;