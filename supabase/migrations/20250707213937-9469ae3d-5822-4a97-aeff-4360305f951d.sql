-- Add anonymous voting security fields
ALTER TABLE public.topic_votes 
ADD COLUMN IF NOT EXISTS anonymous_ip inet,
ADD COLUMN IF NOT EXISTS anonymous_session_id text;

ALTER TABLE public.post_votes 
ADD COLUMN IF NOT EXISTS anonymous_ip inet,
ADD COLUMN IF NOT EXISTS anonymous_session_id text;

-- Add unique constraints for anonymous votes
ALTER TABLE public.topic_votes 
ADD CONSTRAINT IF NOT EXISTS unique_anonymous_topic_vote 
UNIQUE (topic_id, anonymous_session_id);

ALTER TABLE public.post_votes 
ADD CONSTRAINT IF NOT EXISTS unique_anonymous_post_vote 
UNIQUE (post_id, anonymous_session_id);

-- Update RLS policies for anonymous voting
DROP POLICY IF EXISTS "Users can insert topic votes" ON public.topic_votes;
DROP POLICY IF EXISTS "Users can insert post votes" ON public.post_votes;

CREATE POLICY "Users can insert topic votes" ON public.topic_votes
FOR INSERT WITH CHECK (
  (auth.uid() = user_id) OR 
  ((auth.uid() IS NULL) AND is_temporary_user(user_id)) OR
  ((auth.uid() IS NULL) AND (user_id IS NULL) AND (anonymous_session_id IS NOT NULL))
);

CREATE POLICY "Users can insert post votes" ON public.post_votes
FOR INSERT WITH CHECK (
  (auth.uid() = user_id) OR 
  ((auth.uid() IS NULL) AND is_temporary_user(user_id)) OR
  ((auth.uid() IS NULL) AND (user_id IS NULL) AND (anonymous_session_id IS NOT NULL))
);

-- Update anonymous tracking RLS policies to be more restrictive
DROP POLICY IF EXISTS "Anonymous users can view their own tracking" ON public.anonymous_post_tracking;
DROP POLICY IF EXISTS "Anonymous users can update tracking" ON public.anonymous_post_tracking;

CREATE POLICY "Anonymous users can view own tracking" ON public.anonymous_post_tracking
FOR SELECT USING (
  session_id = current_setting('request.headers')::json->>'x-session-id' OR
  ip_address = inet_client_addr()
);

CREATE POLICY "Anonymous users can update own tracking" ON public.anonymous_post_tracking
FOR UPDATE USING (
  session_id = current_setting('request.headers')::json->>'x-session-id' OR
  ip_address = inet_client_addr()
);

-- Improve anonymous vote rate limiting function
CREATE OR REPLACE FUNCTION public.check_anonymous_vote_limit(user_ip inet, session_id text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  vote_count integer;
BEGIN
  -- Count votes in the last hour for this IP/session combination
  SELECT COUNT(*) INTO vote_count
  FROM (
    SELECT created_at FROM topic_votes 
    WHERE (anonymous_ip = user_ip OR anonymous_session_id = session_id)
      AND created_at > (now() - interval '1 hour')
    UNION ALL
    SELECT created_at FROM post_votes 
    WHERE (anonymous_ip = user_ip OR anonymous_session_id = session_id)
      AND created_at > (now() - interval '1 hour')
  ) votes;
  
  -- Return true if under the limit (15 votes per hour)
  RETURN vote_count < 15;
END;
$function$;