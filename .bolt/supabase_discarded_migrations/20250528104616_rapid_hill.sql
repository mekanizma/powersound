/*
  # Create admin user

  1. Changes
    - Add admin user with email/password authentication
    - Set role as 'admin'
    - Enable RLS policies for admin access
*/

-- Create admin user with email/password
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
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'admin@powersound.com',
  crypt('admin123', gen_salt('bf')),
  now(),
  now(),
  now()
);

-- Add user details
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
  'admin',
  'System Admin',
  'admin',
  created_at
FROM auth.users 
WHERE email = 'admin@powersound.com';