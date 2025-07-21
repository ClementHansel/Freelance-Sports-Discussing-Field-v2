-- Update the log_page_visit function to include geolocation
CREATE OR REPLACE FUNCTION public.log_page_visit_with_geolocation(
  p_ip_address inet, 
  p_session_id text, 
  p_page_path text, 
  p_page_title text DEFAULT NULL,
  p_referrer text DEFAULT NULL,
  p_user_agent text DEFAULT NULL,
  p_search_query text DEFAULT NULL,
  p_category_id uuid DEFAULT NULL,
  p_topic_id uuid DEFAULT NULL,
  p_country_code text DEFAULT NULL,
  p_country_name text DEFAULT NULL,
  p_city text DEFAULT NULL,
  p_region text DEFAULT NULL,
  p_latitude decimal DEFAULT NULL,
  p_longitude decimal DEFAULT NULL,
  p_timezone text DEFAULT NULL,
  p_is_vpn boolean DEFAULT NULL,
  p_is_proxy boolean DEFAULT NULL,
  p_isp text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.ip_visit_tracking (
    ip_address,
    session_id,
    page_path,
    page_title,
    referrer,
    user_agent,
    search_query,
    category_visited,
    topic_visited,
    country_code,
    country_name,
    city,
    region,
    latitude,
    longitude,
    timezone,
    is_vpn,
    is_proxy,
    isp
  ) VALUES (
    p_ip_address,
    p_session_id,
    p_page_path,
    p_page_title,
    p_referrer,
    p_user_agent,
    p_search_query,
    p_category_id,
    p_topic_id,
    p_country_code,
    p_country_name,
    p_city,
    p_region,
    p_latitude,
    p_longitude,
    p_timezone,
    p_is_vpn,
    p_is_proxy,
    p_isp
  );
  
  -- Also log as activity
  PERFORM log_ip_activity(
    p_ip_address,
    p_session_id,
    'page_visit',
    COALESCE(p_topic_id, p_category_id),
    CASE 
      WHEN p_topic_id IS NOT NULL THEN 'topic'
      WHEN p_category_id IS NOT NULL THEN 'category'
      ELSE 'page'
    END,
    jsonb_build_object(
      'page_path', p_page_path,
      'page_title', p_page_title,
      'search_query', p_search_query,
      'country', p_country_name,
      'city', p_city
    )
  );
END;
$$;