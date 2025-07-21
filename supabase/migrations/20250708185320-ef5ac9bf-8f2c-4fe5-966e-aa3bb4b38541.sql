-- Update forum settings to mark public ones as public
UPDATE public.forum_settings 
SET is_public = true 
WHERE setting_key IN (
  'forum_name', 
  'forum_description', 
  'social_facebook', 
  'social_twitter', 
  'social_instagram', 
  'social_youtube',
  'logo_url',
  'primary_color',
  'welcome_message'
);