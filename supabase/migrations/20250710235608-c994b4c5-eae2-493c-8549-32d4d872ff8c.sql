-- Add geolocation fields to ip_visit_tracking table
ALTER TABLE public.ip_visit_tracking 
ADD COLUMN country_code TEXT,
ADD COLUMN country_name TEXT,
ADD COLUMN city TEXT,
ADD COLUMN region TEXT,
ADD COLUMN latitude DECIMAL(10, 8),
ADD COLUMN longitude DECIMAL(11, 8),
ADD COLUMN timezone TEXT,
ADD COLUMN is_vpn BOOLEAN DEFAULT false,
ADD COLUMN is_proxy BOOLEAN DEFAULT false,
ADD COLUMN isp TEXT,
ADD COLUMN session_start TIMESTAMP WITH TIME ZONE DEFAULT now(),
ADD COLUMN session_end TIMESTAMP WITH TIME ZONE,
ADD COLUMN is_active BOOLEAN DEFAULT true;

-- Add indexes for efficient geographic queries
CREATE INDEX idx_ip_visit_tracking_country ON public.ip_visit_tracking(country_code);
CREATE INDEX idx_ip_visit_tracking_active ON public.ip_visit_tracking(is_active);
CREATE INDEX idx_ip_visit_tracking_session_start ON public.ip_visit_tracking(session_start);

-- Create geolocation cache table
CREATE TABLE public.ip_geolocation_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address INET NOT NULL UNIQUE,
  country_code TEXT,
  country_name TEXT,
  city TEXT,
  region TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  timezone TEXT,
  is_vpn BOOLEAN DEFAULT false,
  is_proxy BOOLEAN DEFAULT false,
  isp TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on geolocation cache
ALTER TABLE public.ip_geolocation_cache ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for geolocation cache
CREATE POLICY "Admins can view geolocation cache" 
ON public.ip_geolocation_cache 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::user_role));

CREATE POLICY "System can insert geolocation cache" 
ON public.ip_geolocation_cache 
FOR INSERT 
WITH CHECK (true);

-- Add index for quick IP lookups
CREATE INDEX idx_ip_geolocation_cache_ip ON public.ip_geolocation_cache(ip_address);

-- Function to get active visitors with geolocation
CREATE OR REPLACE FUNCTION public.get_active_visitors()
RETURNS TABLE(
  ip_address inet,
  country_code text,
  country_name text,
  city text,
  region text,
  latitude decimal,
  longitude decimal,
  current_page text,
  session_start timestamp with time zone,
  last_activity timestamp with time zone,
  total_pages integer,
  is_vpn boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH recent_activity AS (
    SELECT 
      vt.ip_address,
      vt.country_code,
      vt.country_name,
      vt.city,
      vt.region,
      vt.latitude,
      vt.longitude,
      vt.page_path as current_page,
      vt.session_start,
      MAX(vt.created_at) as last_activity,
      COUNT(*) as total_pages,
      vt.is_vpn,
      ROW_NUMBER() OVER (PARTITION BY vt.ip_address ORDER BY MAX(vt.created_at) DESC) as rn
    FROM public.ip_visit_tracking vt
    WHERE vt.created_at > NOW() - INTERVAL '30 minutes'
    GROUP BY vt.ip_address, vt.country_code, vt.country_name, vt.city, vt.region, 
             vt.latitude, vt.longitude, vt.page_path, vt.session_start, vt.is_vpn
  )
  SELECT 
    ra.ip_address,
    ra.country_code,
    ra.country_name,
    ra.city,
    ra.region,
    ra.latitude,
    ra.longitude,
    ra.current_page,
    ra.session_start,
    ra.last_activity,
    ra.total_pages,
    ra.is_vpn
  FROM recent_activity ra
  WHERE ra.rn = 1
    AND ra.last_activity > NOW() - INTERVAL '10 minutes'
  ORDER BY ra.last_activity DESC;
END;
$$;

-- Function to get visitor geographic summary
CREATE OR REPLACE FUNCTION public.get_visitor_geographic_summary(
  p_hours_back INTEGER DEFAULT 24
)
RETURNS TABLE(
  country_code text,
  country_name text,
  visitor_count bigint,
  page_views bigint,
  avg_session_duration interval
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    vt.country_code,
    vt.country_name,
    COUNT(DISTINCT vt.ip_address) as visitor_count,
    COUNT(*) as page_views,
    AVG(vt.visit_duration) as avg_session_duration
  FROM public.ip_visit_tracking vt
  WHERE vt.created_at > NOW() - (p_hours_back || ' hours')::INTERVAL
    AND vt.country_code IS NOT NULL
  GROUP BY vt.country_code, vt.country_name
  ORDER BY visitor_count DESC;
END;
$$;