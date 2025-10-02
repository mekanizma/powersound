/*
  # Remove check_quantity_positive constraint
  
  1. Changes
    - Remove the check_quantity_positive constraint that prevents zero/negative quantities
    - This allows products to have zero quantity (out of stock)
*/

-- Drop the check constraint
ALTER TABLE products DROP CONSTRAINT IF EXISTS check_quantity_positive;

-- Add a new constraint that allows zero but not negative
ALTER TABLE products 
ADD CONSTRAINT check_quantity_non_negative 
CHECK (quantity >= 0);
