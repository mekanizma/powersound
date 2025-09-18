-- Create trigger function for new users
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, username, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(
      (NEW.raw_user_meta_data->>'username')::text,
      SPLIT_PART(NEW.email, '@', 1)
    ),
    COALESCE(
      (NEW.raw_user_meta_data->>'full_name')::text,
      SPLIT_PART(NEW.email, '@', 1)
    ),
    'user'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Update existing users in auth.users table
UPDATE auth.users
SET raw_user_meta_data = jsonb_build_object(
  'username', 
  CASE 
    WHEN email = 'admin@powersound.com' THEN 'admin'
    WHEN email = 'user@powersound.com' THEN 'user'
    ELSE SPLIT_PART(email, '@', 1)
  END
)
WHERE raw_user_meta_data->>'username' IS NULL;

-- Update existing users in public.users table
UPDATE public.users
SET username = 
  CASE 
    WHEN email = 'admin@powersound.com' THEN 'admin'
    WHEN email = 'user@powersound.com' THEN 'user'
    ELSE SPLIT_PART(email, '@', 1)
  END
WHERE username IS NULL;