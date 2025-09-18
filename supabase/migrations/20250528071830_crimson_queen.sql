/*
  # Add quantity tracking to products

  1. Changes
    - Add quantity field to products table with default value of 1
    - Add check constraint to ensure quantity is positive
*/

ALTER TABLE products 
ADD COLUMN quantity integer NOT NULL DEFAULT 1;

-- Add check constraint to ensure quantity is positive
ALTER TABLE products 
ADD CONSTRAINT check_quantity_positive CHECK (quantity > 0);

-- Update existing products to have quantity 1 if null
UPDATE products 
SET quantity = 1 
WHERE quantity IS NULL;