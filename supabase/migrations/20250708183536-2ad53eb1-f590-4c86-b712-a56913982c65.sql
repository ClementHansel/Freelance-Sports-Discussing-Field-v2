-- Clean up existing forum settings that have extra quotes from double JSON encoding
UPDATE forum_settings 
SET setting_value = regexp_replace(setting_value::text, '^"(.*)"$', '\1')::jsonb
WHERE setting_type = 'string' AND setting_value::text ~ '^".*"$';