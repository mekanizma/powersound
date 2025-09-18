/*
  # Fix auth_users table RLS policies
  
  1. Changes
    - Add missing DELETE policy for admins
    - Add missing UPDATE policy for admins
    - Ensure admins can manage all users
  
  2. Security
    - Only admins can delete users
    - Only admins can update users
    - Users can only read their own data
*/

-- Add DELETE policy for admins
CREATE POLICY "Only admins can delete users"
  ON public.auth_users
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.auth_users 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  );

-- Add UPDATE policy for admins
CREATE POLICY "Only admins can update users"
  ON public.auth_users
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.auth_users 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.auth_users 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  );

-- Update existing policies to be more specific
DROP POLICY IF EXISTS "Only admins can create users" ON public.auth_users;
CREATE POLICY "Only admins can create users"
  ON public.auth_users
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.auth_users 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  );

-- Update SELECT policy to allow admins to see all users
DROP POLICY IF EXISTS "Users can read own data" ON public.auth_users;
CREATE POLICY "Users can read own data and admins can read all"
  ON public.auth_users
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = id OR
    EXISTS (
      SELECT 1 FROM public.auth_users 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  );
