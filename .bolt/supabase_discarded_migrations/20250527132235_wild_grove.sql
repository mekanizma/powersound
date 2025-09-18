DO $$
DECLARE
  v_auth_user_id uuid;
  v_user_id uuid;
BEGIN
  -- Get existing auth user ID
  SELECT id INTO v_auth_user_id 
  FROM auth.users 
  WHERE email = 'admin@fiu.tr';

  IF v_auth_user_id IS NULL THEN
    RAISE EXCEPTION 'Admin user not found in auth.users';
  END IF;

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
  ON CONFLICT (id) DO UPDATE
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