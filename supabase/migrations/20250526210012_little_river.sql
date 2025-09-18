/*
  # Update Users Table RLS Policies

  1. Changes
    - Remove existing RLS policies on users table
    - Add new comprehensive RLS policies for user management
      - Admins can perform all operations
      - Users can only read their own data
      - Users cannot modify any data

  2. Security
    - Ensures admins have full control over user management
    - Maintains user data privacy
    - Prevents unauthorized modifications
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Only admins can manage users" ON users;
DROP POLICY IF EXISTS "Users can read their own data" ON users;

-- Create new policies
CREATE POLICY "Admins have full access"
ON users
FOR ALL
TO authenticated
USING (auth.jwt() ->> 'role' = 'admin')
WITH CHECK (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Users can read their own data"
ON users
FOR SELECT
TO authenticated
USING (
  auth.uid() = id OR 
  auth.jwt() ->> 'role' = 'admin'
);