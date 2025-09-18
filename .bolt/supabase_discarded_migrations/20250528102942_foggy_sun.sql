/*
  # Create default users
  
  1. Changes
    - Create admin and regular user accounts in auth.users
    - Set up proper roles and permissions
    - Ensure unique usernames
  
  2. Security
    - Passwords are properly hashed
    - Email confirmation is handled
*/

-- Create default admin user
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  recovery_sent_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  '00000000-0000-0000-0000-000000000000',
  'authenticated',
  'authenticated',
  'admin@powersound.com',
  crypt('Admin123', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"provider":"email","providers":["email"]}',
  '{"username":"admin_powersound"}',
  now(),
  now(),
  '',
  '',
  '',
  ''
) ON CONFLICT (id) DO UPDATE
SET encrypted_password = crypt('Admin123', gen_salt('bf'));

-- Create default user
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  recovery_sent_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  '11111111-1111-1111-1111-111111111111',
  'authenticated',
  'authenticated',
  'user@powersound.com',
  crypt('User123', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"provider":"email","providers":["email"]}',
  '{"username":"user_powersound"}',
  now(),
  now(),
  '',
  '',
  '',
  ''
) ON CONFLICT (id) DO UPDATE
SET encrypted_password = crypt('User123', gen_salt('bf'));

-- Insert into public.users table manually to avoid trigger conflicts
INSERT INTO public.users (id, email, username, full_name, role)
VALUES 
  ('00000000-0000-0000-0000-000000000000', 'admin@powersound.com', 'admin_powersound', 'Admin User', 'admin'),
  ('11111111-1111-1111-1111-111111111111', 'user@powersound.com', 'user_powersound', 'Regular User', 'user')
ON CONFLICT (id) DO UPDATE
SET 
  email = EXCLUDED.email,
  username = EXCLUDED.username,
  full_name = EXCLUDED.full_name,
  role = EXCLUDED.role;