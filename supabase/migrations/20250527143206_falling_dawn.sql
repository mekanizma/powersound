/*
  # User Management Functions
  
  1. Changes
    - Drop existing functions if they exist
    - Create function for new user creation
    - Create function for user updates
    - Grant appropriate permissions
  
  2. Security
    - Functions use SECURITY DEFINER
    - Only admins can execute these functions
    - Input validation included
*/

-- Drop existing functions if they exist
DROP FUNCTION IF EXISTS create_new_user(text, text, text, text, text);
DROP FUNCTION IF EXISTS update_user(uuid, text, text, text, text);

-- Function to create new user
CREATE OR REPLACE FUNCTION create_new_user(
  new_username text,
  new_password text,
  new_full_name text,
  new_email text,
  new_role text DEFAULT 'user'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id uuid;
BEGIN
  -- Check if caller is admin
  IF NOT EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() 
    AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Only administrators can create new users';
  END IF;

  -- Create auth user
  v_user_id := extensions.uuid_generate_v4();
  
  INSERT INTO auth.users (
    id,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data
  )
  VALUES (
    v_user_id,
    new_email,
    crypt(new_password, gen_salt('bf')),
    now(),
    jsonb_build_object('provider', 'email', 'providers', ARRAY['email']),
    jsonb_build_object('full_name', new_full_name)
  );

  -- Create public user
  INSERT INTO public.users (
    id,
    username,
    full_name,
    email,
    role
  )
  VALUES (
    v_user_id,
    new_username,
    new_full_name,
    new_email,
    new_role
  );

  RETURN v_user_id;
END;
$$;

-- Function to update user
CREATE OR REPLACE FUNCTION update_user(
  user_id uuid,
  new_username text DEFAULT NULL,
  new_full_name text DEFAULT NULL,
  new_email text DEFAULT NULL,
  new_role text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if caller is admin
  IF NOT EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() 
    AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Only administrators can update users';
  END IF;

  -- Update public user
  UPDATE public.users
  SET
    username = COALESCE(new_username, username),
    full_name = COALESCE(new_full_name, full_name),
    email = COALESCE(new_email, email),
    role = COALESCE(new_role, role)
  WHERE id = user_id;

  -- Update auth user email if changed
  IF new_email IS NOT NULL THEN
    UPDATE auth.users
    SET email = new_email
    WHERE id = user_id;
  END IF;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION create_new_user(text, text, text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION update_user(uuid, text, text, text, text) TO authenticated;