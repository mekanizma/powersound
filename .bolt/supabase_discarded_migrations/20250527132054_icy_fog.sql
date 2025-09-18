/*
  # Update admin user settings
  
  1. Changes
    - Updates existing admin user's role to 'admin'
    - Ensures admin user settings exist
  
  2. Security
    - No sensitive data modifications
    - Safe to run multiple times
*/

DO $$
DECLARE
  v_auth_user_id uuid;
BEGIN
  -- Get existing user ID
  SELECT id INTO v_auth_user_id 
  FROM auth.users 
  WHERE email = 'admin@fiu.tr';

  -- Update existing user record in public.users
  UPDATE public.users 
  SET role = 'admin',
      full_name = 'System Administrator'
  WHERE email = 'admin@fiu.tr';

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