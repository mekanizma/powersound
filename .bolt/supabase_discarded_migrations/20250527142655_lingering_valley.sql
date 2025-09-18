/*
  # Add update_user_settings function

  1. New Functions
    - `update_user_settings`: Updates user settings in the user_settings table
      - Parameters:
        - user_id (uuid): The ID of the user whose settings are being updated
        - theme (text, optional): The theme preference
        - language (text, optional): The language preference
        - notifications_enabled (boolean, optional): Whether notifications are enabled
        - email_notifications (boolean, optional): Whether email notifications are enabled
      - Returns: void
      - Security: SECURITY DEFINER to ensure it runs with elevated privileges
      - Accessible by: authenticated users only

  2. Security
    - Function is accessible only to authenticated users
    - Uses SECURITY DEFINER to ensure proper access to user_settings table
*/

CREATE OR REPLACE FUNCTION public.update_user_settings(
  p_user_id uuid,
  p_theme text DEFAULT NULL,
  p_language text DEFAULT NULL,
  p_notifications_enabled boolean DEFAULT NULL,
  p_email_notifications boolean DEFAULT NULL
)
RETURNS void AS $$
BEGIN
  -- First try to update existing settings
  UPDATE public.user_settings
  SET
    theme = COALESCE(p_theme, theme),
    language = COALESCE(p_language, language),
    notifications_enabled = COALESCE(p_notifications_enabled, notifications_enabled),
    email_notifications = COALESCE(p_email_notifications, email_notifications),
    updated_at = now()
  WHERE user_id = p_user_id;

  -- If no row was updated, insert a new one
  IF NOT FOUND THEN
    INSERT INTO public.user_settings (
      user_id,
      theme,
      language,
      notifications_enabled,
      email_notifications
    ) VALUES (
      p_user_id,
      COALESCE(p_theme, 'light'),
      COALESCE(p_language, 'tr'),
      COALESCE(p_notifications_enabled, true),
      COALESCE(p_email_notifications, true)
    );
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.update_user_settings TO authenticated;