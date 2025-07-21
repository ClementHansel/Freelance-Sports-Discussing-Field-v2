-- Make forum_description setting public so all users can see it
UPDATE forum_settings 
SET is_public = true 
WHERE setting_key = 'forum_description';