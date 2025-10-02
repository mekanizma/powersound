/*
  # Fix movements table user reference
  
  1. Changes
    - Update movements table to reference auth_users instead of users
    - Fix foreign key constraint
*/

-- Drop existing foreign key constraint
ALTER TABLE movements DROP CONSTRAINT IF EXISTS movements_user_id_fkey;

-- Add new foreign key constraint to auth_users
ALTER TABLE movements 
ADD CONSTRAINT movements_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth_users(id);

-- Update RLS policy to work with auth_users
DROP POLICY IF EXISTS "Authenticated users can create movements" ON movements;

CREATE POLICY "Authenticated users can create movements" 
ON movements
FOR INSERT 
TO authenticated
WITH CHECK (true);
