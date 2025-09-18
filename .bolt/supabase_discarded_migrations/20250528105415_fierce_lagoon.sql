/*
  # Create authentication tables and initial admin user

  1. Tables
    - `auth_users` - Stores user authentication information
      - `id` (uuid, primary key)
      - `username` (text, unique)
      - `password_hash` (text)
      - `role` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on auth_users table
    - Add policies for secure access
*/

-- Create auth_users table
CREATE TABLE IF NOT EXISTS public.auth_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  role text NOT NULL DEFAULT 'user',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT valid_role CHECK (role IN ('admin', 'user'))
);

-- Enable RLS
ALTER TABLE public.auth_users ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can read own data" 
  ON public.auth_users
  FOR SELECT 
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Only admins can create users"
  ON public.auth_users
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  );

-- Create function to hash passwords
CREATE OR REPLACE FUNCTION hash_password(password text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN crypt(password, gen_salt('bf'));
END;
$$;

-- Create function to verify passwords
CREATE OR REPLACE FUNCTION verify_password(password text, hash text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN hash = crypt(password, hash);
END;
$$;

-- Insert initial admin user
INSERT INTO public.auth_users (
  username,
  password_hash,
  role
) VALUES (
  'admin',
  hash_password('admin123'),
  'admin'
) ON CONFLICT (username) DO NOTHING;