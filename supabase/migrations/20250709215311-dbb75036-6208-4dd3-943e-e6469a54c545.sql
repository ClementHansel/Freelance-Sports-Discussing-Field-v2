-- Comprehensive Anti-Spam System Migration

-- First, let's fix the broken anonymous post tracking system
-- Drop and recreate with proper constraints and indexing
DROP TABLE IF EXISTS public.anonymous_post_tracking CASCADE;

CREATE TABLE public.anonymous_post_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address inet NOT NULL,
  session_id text NOT NULL,
  fingerprint_hash text, -- Browser fingerprinting
  post_count integer DEFAULT 0,
  topic_count integer DEFAULT 0,
  first_post_at timestamp with time zone DEFAULT now(),
  last_post_at timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now(),
  is_blocked boolean DEFAULT false,
  block_reason text,
  block_expires_at timestamp with time zone
);

-- Create proper indexes for performance
CREATE INDEX idx_anonymous_tracking_ip ON public.anonymous_post_tracking(ip_address);
CREATE INDEX idx_anonymous_tracking_session ON public.anonymous_post_tracking(session_id);
CREATE INDEX idx_anonymous_tracking_fingerprint ON public.anonymous_post_tracking(fingerprint_hash);
CREATE INDEX idx_anonymous_tracking_recent ON public.anonymous_post_tracking(last_post_at DESC);

-- Unique constraint for IP + Session combination
ALTER TABLE public.anonymous_post_tracking 
ADD CONSTRAINT unique_ip_session_fingerprint UNIQUE (ip_address, session_id, fingerprint_hash);

-- Enable RLS
ALTER TABLE public.anonymous_post_tracking ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anonymous tracking viewable by all" ON public.anonymous_post_tracking
  FOR SELECT USING (true);

CREATE POLICY "Anonymous tracking insertable by all" ON public.anonymous_post_tracking
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anonymous tracking updatable by all" ON public.anonymous_post_tracking
  FOR UPDATE USING (true);

-- Content Analysis Table
CREATE TABLE public.content_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_hash text NOT NULL, -- SHA-256 hash of normalized content
  content_type text NOT NULL, -- 'topic' or 'post'
  similarity_score decimal(3,2), -- 0.00 to 1.00
  spam_indicators jsonb DEFAULT '{}',
  is_spam boolean DEFAULT false,
  confidence_score decimal(3,2) DEFAULT 0.00,
  created_at timestamp with time zone DEFAULT now()
);

CREATE INDEX idx_content_hash ON public.content_analysis(content_hash);
CREATE INDEX idx_content_spam ON public.content_analysis(is_spam, confidence_score DESC);

-- Behavioral Pattern Analysis
CREATE TABLE public.user_behavior_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_identifier text NOT NULL, -- IP, session, or user_id
  user_type text NOT NULL, -- 'anonymous', 'temporary', 'authenticated'
  posting_velocity decimal(5,2), -- posts per minute
  session_duration interval,
  rapid_posting_count integer DEFAULT 0,
  suspicious_patterns jsonb DEFAULT '{}',
  risk_score decimal(3,2) DEFAULT 0.00,
  last_activity timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now()
);

CREATE INDEX idx_behavior_identifier ON public.user_behavior_patterns(user_identifier);
CREATE INDEX idx_behavior_risk ON public.user_behavior_patterns(risk_score DESC, last_activity DESC);

-- Spam Detection Configuration
CREATE TABLE public.spam_detection_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  config_key text UNIQUE NOT NULL,
  config_value jsonb NOT NULL,
  description text,
  is_active boolean DEFAULT true,
  updated_at timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now()
);

-- Insert default spam detection settings
INSERT INTO public.spam_detection_config (config_key, config_value, description) VALUES
('rate_limits', '{
  "anonymous": {
    "posts_per_hour": 3,
    "posts_per_day": 5,
    "topics_per_day": 2,
    "min_interval_seconds": 30
  },
  "temporary": {
    "posts_per_hour": 5,
    "posts_per_day": 10,
    "topics_per_day": 3,
    "min_interval_seconds": 15
  }
}', 'Rate limiting configuration'),

('content_filters', '{
  "lorem_ipsum_patterns": [
    "lorem ipsum",
    "dolor sit amet",
    "consectetur adipiscing",
    "sed do eiusmod"
  ],
  "spam_keywords": [
    "click here",
    "buy now",
    "free money",
    "amazing offer"
  ],
  "min_content_length": 10,
  "max_duplicate_similarity": 0.8
}', 'Content filtering rules'),

('behavioral_thresholds', '{
  "max_posts_per_minute": 2,
  "suspicious_velocity": 1.0,
  "high_risk_threshold": 0.7,
  "auto_block_threshold": 0.9
}', 'Behavioral analysis thresholds');

-- Enable RLS on config table
ALTER TABLE public.spam_detection_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Spam config viewable by admins" ON public.spam_detection_config
  FOR SELECT USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Spam config manageable by admins" ON public.spam_detection_config
  FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Reported Content Table (enhanced)
CREATE TABLE public.spam_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type text NOT NULL, -- 'topic' or 'post'
  content_id UUID NOT NULL,
  reporter_id UUID, -- null for anonymous reports
  reporter_ip inet,
  report_reason text NOT NULL,
  automated_detection boolean DEFAULT false,
  confidence_score decimal(3,2),
  status text DEFAULT 'pending', -- pending, reviewed, resolved, false_positive
  reviewed_by UUID,
  reviewed_at timestamp with time zone,
  admin_notes text,
  created_at timestamp with time zone DEFAULT now()
);

CREATE INDEX idx_spam_reports_content ON public.spam_reports(content_type, content_id);
CREATE INDEX idx_spam_reports_status ON public.spam_reports(status, created_at DESC);

-- Enable RLS
ALTER TABLE public.spam_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can create spam reports" ON public.spam_reports
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can view all spam reports" ON public.spam_reports
  FOR SELECT USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update spam reports" ON public.spam_reports
  FOR UPDATE USING (has_role(auth.uid(), 'admin'));

-- Enhanced Anonymous Rate Limiting Function
CREATE OR REPLACE FUNCTION check_enhanced_anonymous_rate_limit(
  user_ip inet, 
  session_id text, 
  fingerprint_hash text DEFAULT NULL,
  content_type text DEFAULT 'post'
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
    AND session_id = check_enhanced_anonymous_rate_limit.session_id
    AND (fingerprint_hash IS NULL OR fingerprint_hash = check_enhanced_anonymous_rate_limit.fingerprint_hash);

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
  IF content_type = 'post' THEN
    SELECT COUNT(*) INTO posts_last_hour
    FROM posts p
    WHERE p.ip_address = user_ip
      AND p.created_at > (now() - interval '1 hour');
      
    SELECT COUNT(*) INTO posts_last_day
    FROM posts p
    WHERE p.ip_address = user_ip
      AND p.created_at > (now() - interval '24 hours');
  END IF;

  IF content_type = 'topic' THEN
    SELECT COUNT(*) INTO topics_last_day
    FROM topics t
    WHERE t.author_id IN (
      SELECT id FROM temporary_users tu 
      WHERE tu.session_id = check_enhanced_anonymous_rate_limit.session_id
    )
    AND t.created_at > (now() - interval '24 hours');
  END IF;

  -- Check hourly limit for posts
  IF content_type = 'post' AND posts_last_hour >= (rate_config->'anonymous'->>'posts_per_hour')::integer THEN
    RETURN jsonb_build_object(
      'allowed', false,
      'reason', 'hourly_limit',
      'message', 'Too many posts in the last hour. Please wait.',
      'limit', rate_config->'anonymous'->>'posts_per_hour',
      'current_count', posts_last_hour
    );
  END IF;

  -- Check daily limits
  IF content_type = 'post' AND posts_last_day >= (rate_config->'anonymous'->>'posts_per_day')::integer THEN
    RETURN jsonb_build_object(
      'allowed', false,
      'reason', 'daily_limit',
      'message', 'Daily post limit reached. Please try again tomorrow.',
      'limit', rate_config->'anonymous'->>'posts_per_day',
      'current_count', posts_last_day
    );
  END IF;

  IF content_type = 'topic' AND topics_last_day >= (rate_config->'anonymous'->>'topics_per_day')::integer THEN
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

-- Content Analysis Functions
CREATE OR REPLACE FUNCTION analyze_content_for_spam(content_text text, content_type text DEFAULT 'post')
RETURNS jsonb AS $$
DECLARE
  content_config jsonb;
  content_hash text;
  spam_indicators jsonb := '{}';
  is_spam boolean := false;
  confidence decimal(3,2) := 0.00;
  similar_count integer;
  normalized_content text;
BEGIN
  -- Get content filtering configuration
  SELECT config_value INTO content_config 
  FROM public.spam_detection_config 
  WHERE config_key = 'content_filters' AND is_active = true;

  -- Normalize content for analysis
  normalized_content := lower(trim(regexp_replace(content_text, '\s+', ' ', 'g')));
  content_hash := encode(sha256(normalized_content::bytea), 'hex');

  -- Check minimum content length
  IF length(normalized_content) < (content_config->>'min_content_length')::integer THEN
    spam_indicators := spam_indicators || jsonb_build_object('too_short', true);
    confidence := confidence + 0.3;
  END IF;

  -- Check for Lorem Ipsum patterns
  IF EXISTS (
    SELECT 1 FROM jsonb_array_elements_text(content_config->'lorem_ipsum_patterns') AS pattern
    WHERE normalized_content LIKE '%' || pattern || '%'
  ) THEN
    spam_indicators := spam_indicators || jsonb_build_object('lorem_ipsum', true);
    confidence := confidence + 0.8;
    is_spam := true;
  END IF;

  -- Check for spam keywords
  IF EXISTS (
    SELECT 1 FROM jsonb_array_elements_text(content_config->'spam_keywords') AS keyword
    WHERE normalized_content LIKE '%' || keyword || '%'
  ) THEN
    spam_indicators := spam_indicators || jsonb_build_object('spam_keywords', true);
    confidence := confidence + 0.6;
  END IF;

  -- Check for duplicate content
  SELECT COUNT(*) INTO similar_count
  FROM public.content_analysis
  WHERE content_hash = analyze_content_for_spam.content_hash
    AND created_at > (now() - interval '24 hours');

  IF similar_count > 0 THEN
    spam_indicators := spam_indicators || jsonb_build_object('duplicate_content', true, 'duplicate_count', similar_count);
    confidence := confidence + (similar_count * 0.2);
  END IF;

  -- Determine if content is spam
  IF confidence >= 0.7 THEN
    is_spam := true;
  END IF;

  -- Store analysis results
  INSERT INTO public.content_analysis (
    content_hash, content_type, spam_indicators, is_spam, confidence_score
  ) VALUES (
    content_hash, analyze_content_for_spam.content_type, spam_indicators, is_spam, LEAST(confidence, 1.00)
  );

  RETURN jsonb_build_object(
    'is_spam', is_spam,
    'confidence', LEAST(confidence, 1.00),
    'indicators', spam_indicators,
    'content_hash', content_hash
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Record Enhanced Anonymous Activity
CREATE OR REPLACE FUNCTION record_enhanced_anonymous_activity(
  user_ip inet, 
  session_id text, 
  fingerprint_hash text DEFAULT NULL,
  content_type text DEFAULT 'post'
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
    record_enhanced_anonymous_activity.session_id, 
    record_enhanced_anonymous_activity.fingerprint_hash,
    CASE WHEN content_type = 'post' THEN 1 ELSE 0 END,
    CASE WHEN content_type = 'topic' THEN 1 ELSE 0 END,
    now()
  )
  ON CONFLICT (ip_address, session_id, fingerprint_hash) 
  DO UPDATE SET 
    post_count = anonymous_post_tracking.post_count + CASE WHEN content_type = 'post' THEN 1 ELSE 0 END,
    topic_count = anonymous_post_tracking.topic_count + CASE WHEN content_type = 'topic' THEN 1 ELSE 0 END,
    last_post_at = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Auto-moderate content based on spam analysis
CREATE OR REPLACE FUNCTION auto_moderate_content()
RETURNS trigger AS $$
DECLARE
  analysis_result jsonb;
  should_moderate boolean := false;
BEGIN
  -- Skip if user is authenticated (less strict for registered users)
  IF NEW.author_id IS NOT NULL AND NOT is_temporary_user(NEW.author_id) THEN
    RETURN NEW;
  END IF;

  -- Analyze content for spam
  analysis_result := analyze_content_for_spam(NEW.content, TG_TABLE_NAME::text);

  -- If high confidence spam, set to pending moderation
  IF (analysis_result->>'confidence')::decimal >= 0.8 THEN
    NEW.moderation_status := 'pending';
    should_moderate := true;
    
    -- Create automatic spam report
    INSERT INTO public.spam_reports (
      content_type, content_id, automated_detection, 
      confidence_score, report_reason
    ) VALUES (
      TG_TABLE_NAME::text, NEW.id, true,
      (analysis_result->>'confidence')::decimal,
      'Automatic spam detection: ' || (analysis_result->'indicators')::text
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers for auto-moderation
CREATE TRIGGER auto_moderate_posts
  BEFORE INSERT ON public.posts
  FOR EACH ROW EXECUTE FUNCTION auto_moderate_content();

CREATE TRIGGER auto_moderate_topics
  BEFORE INSERT ON public.topics
  FOR EACH ROW EXECUTE FUNCTION auto_moderate_content();

-- Cleanup function for old tracking data
CREATE OR REPLACE FUNCTION cleanup_spam_detection_data()
RETURNS void AS $$
BEGIN
  -- Remove old anonymous tracking data (older than 7 days)
  DELETE FROM public.anonymous_post_tracking 
  WHERE created_at < (now() - interval '7 days');
  
  -- Remove old content analysis data (older than 30 days)
  DELETE FROM public.content_analysis 
  WHERE created_at < (now() - interval '30 days');
  
  -- Remove old behavior patterns (older than 7 days)
  DELETE FROM public.user_behavior_patterns 
  WHERE created_at < (now() - interval '7 days');
  
  -- Remove resolved spam reports older than 90 days
  DELETE FROM public.spam_reports 
  WHERE status IN ('resolved', 'false_positive') 
    AND created_at < (now() - interval '90 days');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;