-- Create function to get visitors in the last 24 hours
CREATE OR REPLACE FUNCTION public.get_visitors_last_24h()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN (
    SELECT COUNT(DISTINCT ip_address)
    FROM public.ip_visit_tracking
    WHERE created_at > (now() - interval '24 hours')
  );
END;
$$;

-- Create function to get peak visitors in the last 24 hours
CREATE OR REPLACE FUNCTION public.get_peak_visitors_24h()
RETURNS TABLE(peak_count integer, peak_hour timestamp with time zone)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(DISTINCT ip_address)::integer as peak_count,
    DATE_TRUNC('hour', created_at) as peak_hour
  FROM public.ip_visit_tracking
  WHERE created_at > (now() - interval '24 hours')
  GROUP BY DATE_TRUNC('hour', created_at)
  ORDER BY peak_count DESC
  LIMIT 1;
END;
$$;