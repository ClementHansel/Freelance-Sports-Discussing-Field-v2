-- Update the anonymous rate limit from 3 to 5 posts per 12 hours
CREATE OR REPLACE FUNCTION public.check_anonymous_rate_limit(user_ip inet, session_id text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  post_count integer;
BEGIN
  -- Count posts in the last 12 hours for this IP/session combination
  SELECT COUNT(*) INTO post_count
  FROM anonymous_post_tracking apt
  WHERE (apt.ip_address = user_ip OR apt.session_id = check_anonymous_rate_limit.session_id)
    AND apt.created_at > (now() - interval '12 hours');
  
  -- Return true if under the limit (5 posts instead of 3)
  RETURN post_count < 5;
END;
$function$;