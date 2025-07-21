-- Insert or update the ads.txt content in forum settings
INSERT INTO public.forum_settings (
  setting_key, 
  setting_value, 
  setting_type, 
  category, 
  description, 
  is_public
)
VALUES (
  'ads_txt_content',
  '"google.com, pub-5447109336224364, DIRECT, f08c47fec0942fa0"'::jsonb,
  'text',
  'advertising',
  'Content for ads.txt file used by Google AdSense',
  true
)
ON CONFLICT (setting_key) 
DO UPDATE SET 
  setting_value = EXCLUDED.setting_value,
  updated_at = now();