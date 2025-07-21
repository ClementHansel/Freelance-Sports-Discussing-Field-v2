-- Create forum_settings table to store all configuration options
CREATE TABLE public.forum_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  setting_key text NOT NULL UNIQUE,
  setting_value jsonb,
  setting_type text NOT NULL DEFAULT 'string', -- string, number, boolean, json, code
  category text NOT NULL DEFAULT 'general', -- general, technical, appearance, seo, performance
  description text,
  is_public boolean DEFAULT false, -- whether setting can be viewed by non-admins
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.forum_settings ENABLE ROW LEVEL SECURITY;

-- Create policies for admin-only access
CREATE POLICY "Only admins can manage settings" 
ON public.forum_settings 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::user_role));

-- Create function to get forum setting
CREATE OR REPLACE FUNCTION public.get_forum_setting(key_name text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result jsonb;
BEGIN
  SELECT setting_value INTO result
  FROM public.forum_settings
  WHERE setting_key = key_name;
  
  RETURN result;
END;
$$;

-- Create function to set forum setting
CREATE OR REPLACE FUNCTION public.set_forum_setting(
  key_name text,
  value jsonb,
  setting_type text DEFAULT 'string',
  category text DEFAULT 'general',
  description text DEFAULT NULL,
  is_public boolean DEFAULT false
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.forum_settings (
    setting_key, 
    setting_value, 
    setting_type, 
    category, 
    description, 
    is_public
  )
  VALUES (key_name, value, setting_type, category, description, is_public)
  ON CONFLICT (setting_key) 
  DO UPDATE SET 
    setting_value = EXCLUDED.setting_value,
    setting_type = EXCLUDED.setting_type,
    category = EXCLUDED.category,
    description = EXCLUDED.description,
    is_public = EXCLUDED.is_public,
    updated_at = now();
END;
$$;

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_forum_settings_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_forum_settings_updated_at
BEFORE UPDATE ON public.forum_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_forum_settings_timestamp();

-- Insert default settings
INSERT INTO public.forum_settings (setting_key, setting_value, setting_type, category, description, is_public) VALUES
('forum_name', '"Minor Hockey Talks"', 'string', 'general', 'Name of the forum', true),
('forum_description', '"A community forum for minor hockey discussions"', 'string', 'general', 'Forum description', true),
('allow_registration', 'true', 'boolean', 'general', 'Allow new user registration', false),
('allow_anonymous_posts', 'true', 'boolean', 'general', 'Allow anonymous posting', false),
('require_email_verification', 'false', 'boolean', 'general', 'Require email verification for new accounts', false),
('max_posts_per_day', '10', 'number', 'general', 'Maximum posts per user per day', false),
('min_account_age_hours', '0', 'number', 'general', 'Minimum account age in hours before posting', false),
('auto_moderation', 'false', 'boolean', 'general', 'Enable automatic content moderation', false),
('enable_captcha', 'false', 'boolean', 'security', 'Enable CAPTCHA for registration and posts', false),
('enable_rate_limiting', 'true', 'boolean', 'security', 'Enable rate limiting per user', false),
('session_timeout_hours', '24', 'number', 'security', 'Session timeout in hours', false),
('header_code', '""', 'code', 'technical', 'Custom HTML code to inject in header', false),
('google_analytics_id', '""', 'string', 'technical', 'Google Analytics tracking ID', false),
('custom_css', '""', 'code', 'appearance', 'Custom CSS styles', false),
('logo_url', '""', 'string', 'appearance', 'Forum logo URL', true),
('primary_color', '"#3b82f6"', 'string', 'appearance', 'Primary brand color', true),
('welcome_message', '"Welcome to our community!"', 'string', 'general', 'Welcome message for new users', true);

-- Create function to get enhanced forum stats with traffic data
CREATE OR REPLACE FUNCTION public.get_enhanced_forum_stats()
RETURNS TABLE(
  total_topics bigint,
  total_posts bigint,
  total_members bigint,
  topics_today bigint,
  posts_today bigint,
  members_today bigint,
  topics_this_week bigint,
  posts_this_week bigint,
  members_this_week bigint,
  most_active_category text,
  top_poster text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    -- Total counts
    (SELECT COUNT(*) FROM topics) as total_topics,
    (SELECT COUNT(*) FROM posts) as total_posts,
    (SELECT COUNT(*) FROM profiles) as total_members,
    
    -- Today's counts
    (SELECT COUNT(*) FROM topics WHERE created_at >= CURRENT_DATE) as topics_today,
    (SELECT COUNT(*) FROM posts WHERE created_at >= CURRENT_DATE) as posts_today,
    (SELECT COUNT(*) FROM profiles WHERE created_at >= CURRENT_DATE) as members_today,
    
    -- This week's counts
    (SELECT COUNT(*) FROM topics WHERE created_at >= DATE_TRUNC('week', CURRENT_DATE)) as topics_this_week,
    (SELECT COUNT(*) FROM posts WHERE created_at >= DATE_TRUNC('week', CURRENT_DATE)) as posts_this_week,
    (SELECT COUNT(*) FROM profiles WHERE created_at >= DATE_TRUNC('week', CURRENT_DATE)) as members_this_week,
    
    -- Most active category
    (SELECT c.name 
     FROM categories c 
     LEFT JOIN topics t ON c.id = t.category_id 
     WHERE t.created_at >= CURRENT_DATE - INTERVAL '7 days'
     GROUP BY c.id, c.name 
     ORDER BY COUNT(t.id) DESC 
     LIMIT 1) as most_active_category,
     
    -- Top poster this week
    (SELECT COALESCE(p.username, tu.display_name)
     FROM profiles p
     FULL OUTER JOIN temporary_users tu ON p.id = tu.id
     LEFT JOIN posts po ON COALESCE(p.id, tu.id) = po.author_id
     WHERE po.created_at >= DATE_TRUNC('week', CURRENT_DATE)
     GROUP BY p.id, p.username, tu.id, tu.display_name
     ORDER BY COUNT(po.id) DESC
     LIMIT 1) as top_poster;
END;
$$;