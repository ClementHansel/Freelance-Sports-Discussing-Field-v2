-- Create advertising management tables

-- Ad spaces table for managing individual ad placements
CREATE TABLE public.ad_spaces (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  location TEXT NOT NULL, -- 'header', 'sidebar', 'between_posts', 'footer', etc.
  device_targeting TEXT NOT NULL DEFAULT 'both', -- 'desktop', 'mobile', 'both'
  is_active BOOLEAN NOT NULL DEFAULT true,
  ad_code TEXT, -- HTML/JavaScript code for the ad
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Ad campaigns table for scheduled advertising
CREATE TABLE public.ad_campaigns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  ad_space_id UUID NOT NULL REFERENCES public.ad_spaces(id) ON DELETE CASCADE,
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  priority INTEGER DEFAULT 1,
  target_audience JSONB DEFAULT '{}', -- JSON for targeting rules
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Ad analytics table for performance tracking
CREATE TABLE public.ad_analytics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ad_space_id UUID NOT NULL REFERENCES public.ad_spaces(id) ON DELETE CASCADE,
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  device_type TEXT, -- 'desktop', 'mobile'
  country_code TEXT,
  revenue DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all advertising tables
ALTER TABLE public.ad_spaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ad_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ad_analytics ENABLE ROW LEVEL SECURITY;

-- RLS policies for ad_spaces
CREATE POLICY "Admins can manage ad spaces" ON public.ad_spaces
  FOR ALL USING (has_role(auth.uid(), 'admin'::user_role));

CREATE POLICY "Public can view active ad spaces" ON public.ad_spaces
  FOR SELECT USING (is_active = true);

-- RLS policies for ad_campaigns  
CREATE POLICY "Admins can manage ad campaigns" ON public.ad_campaigns
  FOR ALL USING (has_role(auth.uid(), 'admin'::user_role));

CREATE POLICY "Public can view active campaigns" ON public.ad_campaigns
  FOR SELECT USING (is_active = true AND (start_date IS NULL OR start_date <= now()) AND (end_date IS NULL OR end_date >= now()));

-- RLS policies for ad_analytics
CREATE POLICY "Admins can view ad analytics" ON public.ad_analytics
  FOR ALL USING (has_role(auth.uid(), 'admin'::user_role));

-- Create indexes for better performance
CREATE INDEX idx_ad_spaces_location ON public.ad_spaces(location);
CREATE INDEX idx_ad_spaces_active ON public.ad_spaces(is_active);
CREATE INDEX idx_ad_campaigns_active ON public.ad_campaigns(is_active);
CREATE INDEX idx_ad_campaigns_dates ON public.ad_campaigns(start_date, end_date);
CREATE INDEX idx_ad_analytics_date ON public.ad_analytics(date);
CREATE INDEX idx_ad_analytics_space ON public.ad_analytics(ad_space_id);

-- Create triggers for updated_at columns
CREATE TRIGGER update_ad_spaces_updated_at
  BEFORE UPDATE ON public.ad_spaces
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ad_campaigns_updated_at
  BEFORE UPDATE ON public.ad_campaigns
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add some initial forum settings for advertising
INSERT INTO public.forum_settings (setting_key, setting_value, setting_type, category, description, is_public) VALUES
('advertising_enabled', 'true', 'boolean', 'advertising', 'Enable advertising on the site', false),
('ads_between_posts_frequency', '3', 'number', 'advertising', 'Show ads after every N posts', false),
('ads_desktop_enabled', 'true', 'boolean', 'advertising', 'Enable ads on desktop', false),
('ads_mobile_enabled', 'true', 'boolean', 'advertising', 'Enable ads on mobile', false),
('header_scripts', '[]', 'json', 'advertising', 'Header advertising scripts', false),
('ad_blocker_message', '"Please consider disabling your ad blocker to support our site."', 'string', 'advertising', 'Message shown when ad blocker is detected', false)
ON CONFLICT (setting_key) DO NOTHING;