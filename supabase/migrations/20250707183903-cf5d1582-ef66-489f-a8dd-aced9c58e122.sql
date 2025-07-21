-- Temporarily increase rate limit from 5 to 20 posts per 12 hours for testing
CREATE OR REPLACE FUNCTION public.check_user_rate_limit(user_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  post_count INTEGER;
BEGIN
  -- Count posts in the last 12 hours for this user
  SELECT COUNT(*) INTO post_count
  FROM (
    SELECT created_at FROM topics 
    WHERE author_id = user_id
      AND created_at > (now() - interval '12 hours')
    UNION ALL
    SELECT created_at FROM posts 
    WHERE author_id = user_id
      AND created_at > (now() - interval '12 hours')
  ) user_posts;
  
  -- Return true if under the limit (20 posts instead of 3)
  RETURN post_count < 20;
END;
$function$;