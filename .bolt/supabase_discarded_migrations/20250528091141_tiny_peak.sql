/*
  # Fix admin user setup

  1. Changes
    - Create admin user with proper credentials
    - Set up correct role and permissions
    - Enable row level security
    - Add necessary policies

  2. Security
    - Enable RLS on users table
    - Add policies for admin access
*/

-- First, ensure the user exists in auth.users
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
  'admin@powersound.com',
  crypt('Admin123', gen_salt('bf')),
  now(),
  now(),
  now()
)
ON CONFLICT (email) DO NOTHING;

-- Then create the user record in our public.users table
INSERT INTO public.users (
  id,
  email,
  username,
  full_name,
  role,
  created_at
)
SELECT
  id,
  email,
  'powersound',
  'PowerSound Admin',
  'admin',
  now()
FROM auth.users
WHERE email = 'admin@powersound.com'
ON CONFLICT (email) DO UPDATE
SET role = 'admin',
    username = 'powersound',
    full_name = 'PowerSound Admin';

-- Ensure proper RLS policies exist
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Allow admins full access
CREATE POLICY "Admins have full access" ON public.users
  FOR ALL
  TO authenticated
  USING (
    (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin'
  )
  WITH CHECK (
    (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin'
  );

-- Allow users to read their own data
CREATE POLICY "Users can read their own data" ON public.users
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = id OR
    (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin'
  );

-- Allow users to update their own data
CREATE POLICY "Users can update their own data" ON public.users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);