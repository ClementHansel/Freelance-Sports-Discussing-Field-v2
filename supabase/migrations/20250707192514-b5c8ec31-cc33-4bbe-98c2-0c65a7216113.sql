-- Update existing terms and privacy settings to be public
UPDATE public.forum_settings 
SET is_public = true 
WHERE setting_key IN ('terms_content', 'privacy_content');