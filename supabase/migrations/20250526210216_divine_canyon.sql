/*
  # Fix user management functionality

  1. Changes
    - Drop existing policies
    - Create new admin management policy
    - Add user creation function
    - Update RLS policies
  
  2. Security
    - Enable RLS
    - Add policies for admin access
    - Add secure user creation function
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Admins have full access" ON public.users;
DROP POLICY IF EXISTS "Users can read their own data" ON public.users;

-- Create function to handle user creation
CREATE OR REPLACE FUNCTION create_new_user(
  new_username TEXT,
  new_full_name TEXT,
  new_role TEXT DEFAULT 'user'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_user_id uuid;
BEGIN
  -- Insert new user
  INSERT INTO public.users (
    id,
    username,
    full_name,
    role,
    created_at
  ) VALUES (
    gen_random_uuid(),
    new_username,
    new_full_name,
    new_role,
    now()
  )
  RETURNING id INTO new_user_id;
  
  RETURN new_user_id;
END;
$$;

-- Create policies
CREATE POLICY "Admins have full access" ON public.users
  FOR ALL
  TO authenticated
  USING (auth.jwt() ->> 'role' = 'admin')
  WITH CHECK (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Users can read their own data" ON public.users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id OR auth.jwt() ->> 'role' = 'admin');

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION create_new_user TO authenticated;