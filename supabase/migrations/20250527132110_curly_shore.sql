/*
  # Update admin user settings
  
  1. Changes
    - Updates existing admin user's role and name
    - Creates user settings if they don't exist
    - Ensures proper foreign key relationships
*/

DO $$
DECLARE
  v_auth_user_id uuid;
  v_user_id uuid;
BEGIN
  -- Get existing auth user ID
  SELECT id INTO v_auth_user_id 
  FROM auth.users 
  WHERE email = 'admin@fiu.tr';

  -- Get or create public user record
  INSERT INTO public.users (
    id,
    email,
    username,
    full_name,
    role
  )
  VALUES (
    v_auth_user_id,
    'admin@fiu.tr',
    'admin',
    'System Administrator',
    'admin'
  )
  ON CONFLICT (email) DO UPDATE
  SET role = 'admin',
      full_name = 'System Administrator'
  RETURNING id INTO v_user_id;

  -- Create initial user settings if they don't exist
  INSERT INTO user_settings (
    user_id,
    theme,
    language,
    notifications_enabled,
    email_notifications
  )
  VALUES (
    v_user_id,
    'light',
    'tr',
    true,
    true
  )
  ON CONFLICT (user_id) DO NOTHING;

END $$;