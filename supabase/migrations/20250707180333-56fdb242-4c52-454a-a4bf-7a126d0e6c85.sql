-- Fix RLS policies for forum_settings to allow public access to public settings

-- Drop the overly restrictive current policy
DROP POLICY IF EXISTS "Only admins can manage settings" ON public.forum_settings;

-- Create separate policies for better access control
CREATE POLICY "Anyone can view public settings" 
ON public.forum_settings 
FOR SELECT 
USING (is_public = true);

CREATE POLICY "Admins can view all settings" 
ON public.forum_settings 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::user_role));

CREATE POLICY "Only admins can manage settings" 
ON public.forum_settings 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::user_role));

-- Update existing settings to mark public ones as public
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