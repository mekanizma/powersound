/*
  # Initial Schema Setup
  
  1. Tables
    - Creates users table with necessary columns and constraints
    
  2. Security
    - Enables RLS on users table
    - Creates policies for admin and user access
    
  3. Indexes
    - Creates indexes for email, username, and role columns
*/

-- Create users table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  username text UNIQUE NOT NULL,
  full_name text NOT NULL,
  role text NOT NULL DEFAULT 'user',
  created_at timestamptz DEFAULT now(),
  settings jsonb DEFAULT '{}'::jsonb,
  password_hash text
);

-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON public.users(username);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);

-- Create policies
DO $$ 
BEGIN
  -- Drop existing policies if they exist
  DROP POLICY IF EXISTS "Admins have full access" ON public.users;
  DROP POLICY IF EXISTS "Users can read their own data" ON public.users;
  DROP POLICY IF EXISTS "Users can update their own data" ON public.users;
END
$$;

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

-- Insert default admin user into public.users
INSERT INTO public.users (
  id,
  email,
  username,
  full_name,
  role,
  created_at
)
VALUES (
  '00000000-0000-0000-0000-000000000000',
  'admin@powersound.com',
  'powersound',
  'PowerSound Admin',
  'admin',
  now()
)
ON CONFLICT (email) DO UPDATE
SET 
  role = 'admin',
  username = 'powersound',
  full_name = 'PowerSound Admin';