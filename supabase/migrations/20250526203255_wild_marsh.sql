/*
  # Update Categories RLS Policies

  1. Changes
    - Add RLS policy for inserting categories by authenticated users with admin role
    - Add RLS policy for updating categories by authenticated users with admin role
    - Add RLS policy for deleting categories by authenticated users with admin role

  2. Security
    - Maintains existing SELECT policy for all authenticated users
    - Restricts INSERT/UPDATE/DELETE to admin users only
    - Uses role-based access control via JWT claims
*/

-- Remove existing policies to avoid conflicts
DROP POLICY IF EXISTS "Categories are readable by all authenticated users" ON categories;
DROP POLICY IF EXISTS "Only admins can delete categories" ON categories;
DROP POLICY IF EXISTS "Only admins can insert categories" ON categories;
DROP POLICY IF EXISTS "Only admins can update categories" ON categories;

-- Create new policies
CREATE POLICY "Categories are readable by all authenticated users"
ON categories
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Only admins can insert categories"
ON categories
FOR INSERT
TO authenticated
WITH CHECK ((auth.jwt() ->> 'role'::text) = 'admin'::text);

CREATE POLICY "Only admins can update categories"
ON categories
FOR UPDATE
TO authenticated
USING ((auth.jwt() ->> 'role'::text) = 'admin'::text)
WITH CHECK ((auth.jwt() ->> 'role'::text) = 'admin'::text);

CREATE POLICY "Only admins can delete categories"
ON categories
FOR DELETE
TO authenticated
USING ((auth.jwt() ->> 'role'::text) = 'admin'::text);