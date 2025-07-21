-- Ensure social_facebook setting is public so it appears for all users
UPDATE forum_settings 
SET is_public = true
WHERE setting_key = 'social_facebook';