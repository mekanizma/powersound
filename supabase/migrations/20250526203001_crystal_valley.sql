/*
  # Fix Categories RLS Policies

  1. Changes
    - Drop existing RLS policies for categories table
    - Create new, more specific policies for each operation type (SELECT, INSERT, UPDATE, DELETE)
    
  2. Security
    - Enable RLS on categories table (already enabled)
    - Add separate policies for:
      - SELECT: Allow all authenticated users to read categories
      - INSERT: Allow only admin users to insert categories
      - UPDATE: Allow only admin users to update categories
      - DELETE: Allow only admin users to delete categories
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Categories are readable by all authenticated users" ON categories;
DROP POLICY IF EXISTS "Only admins can modify categories" ON categories;

-- Create new specific policies
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