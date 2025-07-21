-- Make privacy and terms content public so all users can view these legal pages
UPDATE forum_settings 
SET is_public = true 
WHERE setting_key IN ('privacy_content', 'terms_content');