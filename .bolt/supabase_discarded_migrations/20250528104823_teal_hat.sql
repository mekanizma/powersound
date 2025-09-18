/*
  # Create admin user
  
  1. Changes
    - Creates admin user in public.users table
    - Sets up admin role and permissions
  
  2. Security
    - Creates admin user with full permissions
*/

-- Create admin user in public.users if not exists
INSERT INTO public.users (
  id,
  email,
  username,
  full_name,
  role,
  created_at,
  updated_at
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  'admin@powersound.com',
  'powersound_admin',
  'System Admin',
  'admin',
  now(),
  now()
)
ON CONFLICT (username) DO UPDATE 
SET 
  role = 'admin',
  full_name = 'System Admin',
  updated_at = now();