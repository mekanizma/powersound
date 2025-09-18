/*
  # Separate inventory management for Depo and Malzeme Takip
  
  1. Changes
    - Add inventory_type column to products table to distinguish between Depo and Malzeme
    - Add reference_product_id to link Malzeme products to their Depo counterparts
    
  2. Security
    - Maintain existing RLS policies
*/

-- Add inventory_type column to products
ALTER TABLE products
ADD COLUMN inventory_type text NOT NULL DEFAULT 'depo',
ADD COLUMN reference_product_id uuid REFERENCES products(id);

-- Add check constraint to ensure valid inventory types
ALTER TABLE products
ADD CONSTRAINT valid_inventory_type
CHECK (inventory_type IN ('depo', 'malzeme'));

-- Add index for better query performance
CREATE INDEX idx_products_inventory_type ON products(inventory_type);
CREATE INDEX idx_products_reference_id ON products(reference_product_id);

-- Update existing products to be depo type
UPDATE products SET inventory_type = 'depo';