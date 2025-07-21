-- Make hCaptcha site key public so it can be accessed by the frontend
UPDATE forum_settings 
SET is_public = true
WHERE setting_key = 'hcaptcha_site_key';