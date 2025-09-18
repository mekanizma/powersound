/*
  # Add default equipment categories
  
  1. Changes
    - Add specific categories for equipment management
    - Ensure categories are added only if they don't exist
  
  2. Security
    - Maintains existing RLS policies
*/

-- Insert default categories if they don't exist
DO $$
BEGIN
  -- Delete existing categories first to ensure clean state
  DELETE FROM categories;

  -- Insert new categories
  INSERT INTO categories (id, name, created_at)
  VALUES 
    (gen_random_uuid(), 'Depo Ürünleri', now()),
    (gen_random_uuid(), 'Ses Malzemesi', now()),
    (gen_random_uuid(), 'Işık Malzemesi', now()),
    (gen_random_uuid(), 'Case', now()),
    (gen_random_uuid(), 'Görüntü Malzemesi', now()),
    (gen_random_uuid(), 'Kablo', now());
END
$$;