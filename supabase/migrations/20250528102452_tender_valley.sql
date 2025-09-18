/*
  # Create new user

  This migration creates a new user in the system with basic access.
*/

-- Insert new user into public.users
INSERT INTO public.users (
  id,
  email,
  username,
  full_name,
  role,
  created_at
)
VALUES (
  '11111111-1111-1111-1111-111111111111',
  'user@powersound.com',
  'poweruser',
  'PowerSound User',
  'user',
  now()
)
ON CONFLICT (email) DO UPDATE
SET 
  role = 'user',
  username = 'poweruser',
  full_name = 'PowerSound User';