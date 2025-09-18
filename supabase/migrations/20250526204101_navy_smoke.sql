/*
  # Fix Categories RLS Policies

  1. Changes
    - Update RLS policies to properly check admin role using auth.jwt()
    - Add proper error handling for non-admin users
    - Ensure policies use the correct syntax for role checks

  2. Security
    - Maintain read access for all authenticated users
    - Restrict write operations to admin users only
    - Use proper role checking mechanism
*/

-- Remove existing policies to avoid conflicts
DROP POLICY IF EXISTS "Categories are readable by all authenticated users" ON categories;
DROP POLICY IF EXISTS "Only admins can delete categories" ON categories;
DROP POLICY IF EXISTS "Only admins can insert categories" ON categories;
DROP POLICY IF EXISTS "Only admins can update categories" ON categories;
DROP POLICY IF EXISTS "Only admins can modify categories" ON categories;

-- Create new policies with proper role checks
CREATE POLICY "Categories are readable by all authenticated users"
ON categories
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Only admins can insert categories"
ON categories
FOR INSERT
TO authenticated
WITH CHECK (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Only admins can update categories"
ON categories
FOR UPDATE
TO authenticated
USING (auth.jwt() ->> 'role' = 'admin')
WITH CHECK (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Only admins can delete categories"
ON categories
FOR DELETE
TO authenticated
USING (auth.jwt() ->> 'role' = 'admin');