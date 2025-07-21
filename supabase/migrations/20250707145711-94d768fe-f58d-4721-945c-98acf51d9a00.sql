-- Fix ambiguous column reference in check_anonymous_rate_limit function
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
  
  -- Return true if under the limit (3 posts)
  RETURN post_count < 3;
END;
$function$;

-- Fix ambiguous column reference in record_anonymous_post function
CREATE OR REPLACE FUNCTION public.record_anonymous_post(user_ip inet, session_id text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  -- Insert or update the tracking record
  INSERT INTO anonymous_post_tracking (ip_address, session_id, post_count, last_post_at)
  VALUES (user_ip, record_anonymous_post.session_id, 1, now())
  ON CONFLICT (ip_address, session_id) 
  DO UPDATE SET 
    post_count = anonymous_post_tracking.post_count + 1,
    last_post_at = now();
END;
$function$;