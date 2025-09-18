/*
  # Settings System Implementation

  1. New Tables
    - `user_settings`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to users)
      - `theme` (text)
      - `language` (text)
      - `notifications_enabled` (boolean)
      - `email_notifications` (boolean)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `system_settings`
      - `id` (uuid, primary key)
      - `key` (text, unique)
      - `value` (jsonb)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on both tables
    - Add policies for user access control
    - Add policies for admin access

  3. Functions
    - Add function to update user settings
    - Add function to update system settings
*/

-- Create user_settings table
CREATE TABLE IF NOT EXISTS user_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  theme text DEFAULT 'light',
  language text DEFAULT 'tr',
  notifications_enabled boolean DEFAULT true,
  email_notifications boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

-- Create system_settings table
CREATE TABLE IF NOT EXISTS system_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- User settings policies
CREATE POLICY "Users can view their own settings"
  ON user_settings
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own settings"
  ON user_settings
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- System settings policies
CREATE POLICY "Anyone can view system settings"
  ON system_settings
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Only admins can modify system settings"
  ON system_settings
  FOR ALL
  TO authenticated
  USING ((SELECT role FROM users WHERE id = auth.uid()) = 'admin')
  WITH CHECK ((SELECT role FROM users WHERE id = auth.uid()) = 'admin');

-- Function to update user settings
CREATE OR REPLACE FUNCTION update_user_settings(
  p_theme text DEFAULT NULL,
  p_language text DEFAULT NULL,
  p_notifications_enabled boolean DEFAULT NULL,
  p_email_notifications boolean DEFAULT NULL
)
RETURNS user_settings
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_settings user_settings;
BEGIN
  -- Insert or update user settings
  INSERT INTO user_settings (
    user_id,
    theme,
    language,
    notifications_enabled,
    email_notifications
  )
  VALUES (
    auth.uid(),
    COALESCE(p_theme, 'light'),
    COALESCE(p_language, 'tr'),
    COALESCE(p_notifications_enabled, true),
    COALESCE(p_email_notifications, true)
  )
  ON CONFLICT (user_id)
  DO UPDATE SET
    theme = COALESCE(p_theme, user_settings.theme),
    language = COALESCE(p_language, user_settings.language),
    notifications_enabled = COALESCE(p_notifications_enabled, user_settings.notifications_enabled),
    email_notifications = COALESCE(p_email_notifications, user_settings.email_notifications),
    updated_at = now()
  RETURNING * INTO v_user_settings;

  RETURN v_user_settings;
END;
$$;

-- Function to update system settings
CREATE OR REPLACE FUNCTION update_system_settings(
  p_key text,
  p_value jsonb
)
RETURNS system_settings
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_system_settings system_settings;
BEGIN
  -- Check if user is admin
  IF NOT EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() 
    AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Only administrators can modify system settings';
  END IF;

  -- Insert or update system settings
  INSERT INTO system_settings (key, value)
  VALUES (p_key, p_value)
  ON CONFLICT (key)
  DO UPDATE SET
    value = p_value,
    updated_at = now()
  RETURNING * INTO v_system_settings;

  RETURN v_system_settings;
END;
$$;

-- Insert default system settings
INSERT INTO system_settings (key, value)
VALUES 
  ('company', '{"name": "POWERSOUND", "address": "", "phone": "", "email": ""}'),
  ('inventory', '{"low_stock_threshold": 5, "enable_notifications": true, "auto_backup": true}'),
  ('notifications', '{"email_enabled": true, "push_enabled": false}')
ON CONFLICT (key) DO NOTHING;