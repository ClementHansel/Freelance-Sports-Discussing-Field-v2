-- Update banner_message setting type from 'text' to 'string' for consistency
UPDATE public.forum_settings 
SET setting_type = 'string' 
WHERE setting_key = 'banner_message' AND setting_type = 'text';