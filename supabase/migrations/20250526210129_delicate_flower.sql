/*
  # Fix Users Table RLS Policies

  1. Changes
    - Remove existing RLS policies that are causing violations
    - Add new policies to allow admin users full access
    - Maintain user access to their own data
    
  2. Security
    - Enable RLS on users table
    - Add policies for:
      - Admin full access
      - Users read own data
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Admins have full access" ON public.users;
DROP POLICY IF EXISTS "Users can read their own data" ON public.users;

-- Create new policies
CREATE POLICY "Admins have full access" ON public.users
  FOR ALL
  TO authenticated
  USING (auth.jwt() ->> 'role' = 'admin')
  WITH CHECK (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Users can read their own data" ON public.users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id OR auth.jwt() ->> 'role' = 'admin');