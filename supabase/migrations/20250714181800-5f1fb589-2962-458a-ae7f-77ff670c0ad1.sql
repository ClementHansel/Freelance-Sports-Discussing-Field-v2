-- Update the hCaptcha site key to store the correct unquoted value in JSONB format
UPDATE forum_settings 
SET setting_value = '"b5acf4d6-3fb6-439e-b8b0-0c5a5ebcd830"'::jsonb
WHERE setting_key = 'hcaptcha_site_key';