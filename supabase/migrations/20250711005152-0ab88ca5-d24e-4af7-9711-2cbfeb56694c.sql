-- Fix data type mismatch in get_active_visitors function
-- Change total_pages from integer to bigint to match COUNT(*) return type

DROP FUNCTION IF EXISTS public.get_active_visitors();

CREATE OR REPLACE FUNCTION public.get_active_visitors()
RETURNS TABLE(
  ip_address inet,
  country_code text,
  country_name text,
  city text,
  region text,
  latitude numeric,
  longitude numeric,
  current_page text,
  session_start timestamp with time zone,
  last_activity timestamp with time zone,
  total_pages bigint,
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