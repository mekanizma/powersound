/*
  # Add default locations
  
  1. Changes
    - Add default locations for equipment management
    - Ensure locations are added only if they don't exist
  
  2. Security
    - Maintains existing RLS policies
*/

-- Insert default locations if they don't exist
DO $$
BEGIN
  -- Delete existing locations first to ensure clean state
  DELETE FROM locations;

  -- Insert new locations
  INSERT INTO locations (id, name, created_at)
  VALUES 
    (gen_random_uuid(), 'Depo', now()),
    (gen_random_uuid(), 'Merit Park', now()),
    (gen_random_uuid(), 'Merit Royal', now()),
    (gen_random_uuid(), 'Merit Cristal', now()),
    (gen_random_uuid(), 'Lord Place', now()),
    (gen_random_uuid(), 'Kaya Plazzo', now()),
    (gen_random_uuid(), 'Cratos', now()),
    (gen_random_uuid(), 'Acapolco', now()),
    (gen_random_uuid(), 'Elexsus', now()),
    (gen_random_uuid(), 'Chamada', now()),
    (gen_random_uuid(), 'Limak', now()),
    (gen_random_uuid(), 'Kaya Artemis', now()),
    (gen_random_uuid(), 'Concorde', now()),
    (gen_random_uuid(), 'Concorde Lefkosa', now()),
    (gen_random_uuid(), 'Grand Saphire', now());
END
$$;