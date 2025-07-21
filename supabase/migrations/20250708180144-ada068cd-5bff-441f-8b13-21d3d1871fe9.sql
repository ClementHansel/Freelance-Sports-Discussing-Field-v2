-- Add maintenance mode settings to forum_settings table
INSERT INTO public.forum_settings (setting_key, setting_value, setting_type, category, description, is_public)
VALUES 
  ('maintenance_mode', 'false', 'boolean', 'system', 'Enable maintenance mode to take the site offline for general users', false),
  ('maintenance_message', '"We are currently performing scheduled maintenance. Please check back soon!"', 'text', 'system', 'Custom message to display during maintenance mode', false)
ON CONFLICT (setting_key) DO NOTHING;