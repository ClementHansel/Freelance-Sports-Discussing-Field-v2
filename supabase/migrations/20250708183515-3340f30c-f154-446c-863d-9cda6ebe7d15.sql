-- Clean up existing forum settings that have extra quotes from double JSON encoding
UPDATE forum_settings 
SET setting_value = CASE 
    WHEN setting_type = 'string' AND setting_value::text LIKE '"%"' THEN 
        substring(setting_value::text, 2, length(setting_value::text) - 2)::jsonb
    ELSE setting_value
END
WHERE setting_type = 'string' AND setting_value::text LIKE '"%"';