-- Fix column ambiguity errors in spam detection functions

-- Drop existing functions first
DROP FUNCTION IF EXISTS record_enhanced_anonymous_activity(inet,text,text,text);
DROP FUNCTION IF EXISTS check_enhanced_anonymous_rate_limit(inet,text,text,text);

-- Recreate record_enhanced_anonymous_activity function with fixed parameter names
CREATE OR REPLACE FUNCTION record_enhanced_anonymous_activity(
  user_ip inet, 
  p_session_id text, 
  p_fingerprint_hash text DEFAULT NULL,
  p_content_type text DEFAULT 'post'
)
RETURNS void AS $$
DECLARE
  tracking_record public.anonymous_post_tracking%ROWTYPE;
BEGIN
  -- Insert or update tracking record
  INSERT INTO public.anonymous_post_tracking (
    ip_address, session_id, fingerprint_hash, post_count, topic_count, last_post_at
  ) VALUES (
    user_ip, 
    p_session_id, 
    p_fingerprint_hash,
    CASE WHEN p_content_type = 'post' THEN 1 ELSE 0 END,
    CASE WHEN p_content_type = 'topic' THEN 1 ELSE 0 END,
    now()
  )
  ON CONFLICT (ip_address, session_id, fingerprint_hash) 
  DO UPDATE SET 
    post_count = anonymous_post_tracking.post_count + CASE WHEN p_content_type = 'post' THEN 1 ELSE 0 END,
    topic_count = anonymous_post_tracking.topic_count + CASE WHEN p_content_type = 'topic' THEN 1 ELSE 0 END,
    last_post_at = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate check_enhanced_anonymous_rate_limit function with fixed parameter names
CREATE OR REPLACE FUNCTION check_enhanced_anonymous_rate_limit(
  user_ip inet, 
  p_session_id text, 
  p_fingerprint_hash text DEFAULT NULL,
  p_content_type text DEFAULT 'post'
)
RETURNS jsonb AS $$
DECLARE
  tracking_record public.anonymous_post_tracking%ROWTYPE;
  rate_config jsonb;
  time_since_last interval;
  posts_last_hour integer;
  posts_last_day integer;
  topics_last_day integer;
  min_interval integer;
  result jsonb;
BEGIN
  -- Get rate limiting configuration
  SELECT config_value INTO rate_config 
  FROM public.spam_detection_config 
  WHERE config_key = 'rate_limits' AND is_active = true;
  
  IF rate_config IS NULL THEN
    -- Fallback to strict defaults
    rate_config := '{"anonymous": {"posts_per_hour": 2, "posts_per_day": 3, "topics_per_day": 1, "min_interval_seconds": 60}}';
  END IF;

  -- Get or create tracking record
  SELECT * INTO tracking_record
  FROM public.anonymous_post_tracking
  WHERE ip_address = user_ip 
    AND session_id = p_session_id
    AND (p_fingerprint_hash IS NULL OR fingerprint_hash = p_fingerprint_hash);

  -- Check if user is blocked
  IF tracking_record.is_blocked AND (tracking_record.block_expires_at IS NULL OR tracking_record.block_expires_at > now()) THEN
    RETURN jsonb_build_object(
      'allowed', false,
      'reason', 'blocked',
      'message', COALESCE(tracking_record.block_reason, 'User is temporarily blocked'),
      'block_expires_at', tracking_record.block_expires_at
    );
  END IF;

  -- Check minimum interval between posts
  IF tracking_record.last_post_at IS NOT NULL THEN
    time_since_last := now() - tracking_record.last_post_at;
    min_interval := (rate_config->'anonymous'->>'min_interval_seconds')::integer;
    
    IF EXTRACT(EPOCH FROM time_since_last) < min_interval THEN
      RETURN jsonb_build_object(
        'allowed', false,
        'reason', 'too_fast',
        'message', 'Please wait ' || min_interval || ' seconds between posts',
        'retry_after', min_interval - EXTRACT(EPOCH FROM time_since_last)
      );
    END IF;
  END IF;

  -- Count recent posts
  IF p_content_type = 'post' THEN
    SELECT COUNT(*) INTO posts_last_hour
    FROM posts p
    WHERE p.ip_address = user_ip
      AND p.created_at > (now() - interval '1 hour');
      
    SELECT COUNT(*) INTO posts_last_day
    FROM posts p
    WHERE p.ip_address = user_ip
      AND p.created_at > (now() - interval '24 hours');
  END IF;

  IF p_content_type = 'topic' THEN
    SELECT COUNT(*) INTO topics_last_day
    FROM topics t
    WHERE t.author_id IN (
      SELECT id FROM temporary_users tu 
      WHERE tu.session_id = p_session_id
    )
    AND t.created_at > (now() - interval '24 hours');
  END IF;

  -- Check hourly limit for posts
  IF p_content_type = 'post' AND posts_last_hour >= (rate_config->'anonymous'->>'posts_per_hour')::integer THEN
    RETURN jsonb_build_object(
      'allowed', false,
      'reason', 'hourly_limit',
      'message', 'Too many posts in the last hour. Please wait.',
      'limit', rate_config->'anonymous'->>'posts_per_hour',
      'current_count', posts_last_hour
    );
  END IF;

  -- Check daily limits
  IF p_content_type = 'post' AND posts_last_day >= (rate_config->'anonymous'->>'posts_per_day')::integer THEN
    RETURN jsonb_build_object(
      'allowed', false,
      'reason', 'daily_limit',
      'message', 'Daily post limit reached. Please try again tomorrow.',
      'limit', rate_config->'anonymous'->>'posts_per_day',
      'current_count', posts_last_day
    );
  END IF;

  IF p_content_type = 'topic' AND topics_last_day >= (rate_config->'anonymous'->>'topics_per_day')::integer THEN
    RETURN jsonb_build_object(
      'allowed', false,
      'reason', 'daily_limit',
      'message', 'Daily topic limit reached. Please try again tomorrow.',
      'limit', rate_config->'anonymous'->>'topics_per_day',
      'current_count', topics_last_day
    );
  END IF;

  -- All checks passed
  RETURN jsonb_build_object(
    'allowed', true,
    'remaining_posts_hour', (rate_config->'anonymous'->>'posts_per_hour')::integer - COALESCE(posts_last_hour, 0),
    'remaining_posts_day', (rate_config->'anonymous'->>'posts_per_day')::integer - COALESCE(posts_last_day, 0),
    'remaining_topics_day', (rate_config->'anonymous'->>'topics_per_day')::integer - COALESCE(topics_last_day, 0)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;