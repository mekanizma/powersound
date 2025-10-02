/*
  # Make user_id nullable in movements table
  
  1. Changes
    - Make user_id column nullable in movements table
    - This allows movements to be created without user reference
*/

-- Make user_id nullable
ALTER TABLE movements 
ALTER COLUMN user_id DROP NOT NULL;

-- Drop foreign key constraint temporarily
ALTER TABLE movements DROP CONSTRAINT IF EXISTS movements_user_id_fkey;

-- Add foreign key constraint that allows null values
ALTER TABLE movements 
ADD CONSTRAINT movements_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth_users(id);
