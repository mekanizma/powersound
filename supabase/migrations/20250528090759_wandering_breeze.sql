/*
  # Fix Authentication Schema

  1. Changes
    - Enable authentication schema
    - Create trigger to sync auth.users with public.users
    - Update RLS policies for proper authentication

  2. Security
    - Ensure proper linkage between auth and public schemas
    - Maintain existing RLS policies
    - Add necessary auth triggers
*/

-- Enable realtime for better auth handling
ALTER PUBLICATION supabase_realtime ADD TABLE auth.users;

-- Create a trigger to sync auth.users with public.users
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, role, username, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    'user',
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1))
  )
  ON CONFLICT (id) DO UPDATE
  SET email = EXCLUDED.email,
      username = COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
      full_name = COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Update RLS policies to use auth.uid() correctly
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read their own data" ON public.users;
CREATE POLICY "Users can read their own data" ON public.users
  FOR SELECT TO authenticated
  USING (auth.uid() = id OR (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin');

DROP POLICY IF EXISTS "Users can update their own data" ON public.users;
CREATE POLICY "Users can update their own data" ON public.users
  FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Ensure admin users exist in public.users
DO $$
BEGIN
  INSERT INTO public.users (id, email, role, username, full_name)
  SELECT id, email, 'admin', 
    COALESCE(raw_user_meta_data->>'username', split_part(email, '@', 1)),
    COALESCE(raw_user_meta_data->>'full_name', split_part(email, '@', 1))
  FROM auth.users
  WHERE email IN (
    SELECT email FROM auth.users
    WHERE raw_user_meta_data->>'role' = 'admin'
  )
  ON CONFLICT (id) DO UPDATE
  SET role = 'admin';
END;
$$;