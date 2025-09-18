-- Create admin user if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM users WHERE username = 'admin'
  ) THEN
    PERFORM create_new_user(
      'admin',
      'admin123',
      'Admin User',
      'admin'
    );
  END IF;
END
$$;