-- Add banner settings to forum_settings table
INSERT INTO public.forum_settings (setting_key, setting_value, setting_type, category, description, is_public)
VALUES 
  ('banner_enabled', 'false', 'boolean', 'banner', 'Enable site-wide banner notification', false),
  ('banner_message', '"🎉 Welcome to our community forum! Join the discussion and connect with fellow members."', 'text', 'banner', 'Banner message content displayed to all visitors', false),
  ('banner_style', '"info"', 'string', 'banner', 'Banner style theme (info, warning, success, error, announcement)', false),
  ('banner_dismissible', 'true', 'boolean', 'banner', 'Allow users to dismiss the banner', false)
ON CONFLICT (setting_key) DO NOTHING;