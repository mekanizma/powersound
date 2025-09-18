/*
  # Add default equipment categories
  
  1. Changes
    - Add default categories for sound, video, lighting equipment, cables, and cases
  
  2. Security
    - Maintains existing RLS policies
*/

-- Insert default categories if they don't exist
DO $$
BEGIN
  -- Sound Equipment
  IF NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Ses Malzemeleri') THEN
    INSERT INTO categories (id, name, created_at)
    VALUES (gen_random_uuid(), 'Ses Malzemeleri', now());
  END IF;

  -- Video Equipment
  IF NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Görüntü Malzemeleri') THEN
    INSERT INTO categories (id, name, created_at)
    VALUES (gen_random_uuid(), 'Görüntü Malzemeleri', now());
  END IF;

  -- Lighting Equipment
  IF NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Işık Malzemeleri') THEN
    INSERT INTO categories (id, name, created_at)
    VALUES (gen_random_uuid(), 'Işık Malzemeleri', now());
  END IF;

  -- Cables
  IF NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Kablo') THEN
    INSERT INTO categories (id, name, created_at)
    VALUES (gen_random_uuid(), 'Kablo', now());
  END IF;

  -- Cases
  IF NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Case') THEN
    INSERT INTO categories (id, name, created_at)
    VALUES (gen_random_uuid(), 'Case', now());
  END IF;
END
$$;