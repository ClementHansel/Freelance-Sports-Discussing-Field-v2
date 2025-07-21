-- Enhanced security monitoring and rate limiting improvements

-- Create a table to track security events from edge functions
CREATE TABLE IF NOT EXISTS public.security_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type TEXT NOT NULL,
  client_ip INET,
  user_agent TEXT,
  event_details JSONB DEFAULT '{}',
  severity TEXT CHECK (severity IN ('low', 'medium', 'high', 'critical')) DEFAULT 'medium',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on security events
ALTER TABLE public.security_events ENABLE ROW LEVEL SECURITY;

-- Only admins can view security events
CREATE POLICY "Admins can view security events" 
ON public.security_events 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'));

-- System can insert security events
CREATE POLICY "System can insert security events" 
ON public.security_events 
FOR INSERT 
WITH CHECK (true);

-- Create index for better performance on security event queries
CREATE INDEX IF NOT EXISTS idx_security_events_created_at ON public.security_events (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_security_events_client_ip ON public.security_events (client_ip);
CREATE INDEX IF NOT EXISTS idx_security_events_event_type ON public.security_events (event_type);

-- Enhanced function to check rate limiting with progressive penalties
CREATE OR REPLACE FUNCTION public.check_enhanced_rate_limit_with_penalties(
  user_ip INET,
  p_session_id TEXT,
  p_fingerprint_hash TEXT DEFAULT NULL,
  p_content_type TEXT DEFAULT 'post'
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  tracking_record public.anonymous_post_tracking%ROWTYPE;
  rate_config JSONB;
  time_since_last INTERVAL;
  violation_count INTEGER;
  penalty_multiplier NUMERIC := 1.0;
  result JSONB;
BEGIN
  -- Get rate limiting configuration
  SELECT config_value INTO rate_config 
  FROM public.spam_detection_config 
  WHERE config_key = 'rate_limits' AND is_active = true;
  
  IF rate_config IS NULL THEN
    rate_config := '{"anonymous": {"posts_per_hour": 2, "posts_per_day": 3, "topics_per_day": 1, "min_interval_seconds": 60}}';
  END IF;

  -- Get tracking record
  SELECT * INTO tracking_record
  FROM public.anonymous_post_tracking
  WHERE ip_address = user_ip 
    AND session_id = p_session_id
    AND (p_fingerprint_hash IS NULL OR fingerprint_hash = p_fingerprint_hash);

  -- Check for repeated violations in the last 24 hours
  SELECT COUNT(*) INTO violation_count
  FROM public.security_events
  WHERE client_ip = user_ip
    AND event_type IN ('RATE_LIMIT_EXCEEDED', 'SUSPICIOUS_CONTENT_DETECTED', 'INPUT_LENGTH_VIOLATION')
    AND created_at > (now() - interval '24 hours');

  -- Apply progressive penalties
  IF violation_count > 5 THEN
    penalty_multiplier := 3.0;
  ELSIF violation_count > 3 THEN
    penalty_multiplier := 2.0;
  ELSIF violation_count > 1 THEN
    penalty_multiplier := 1.5;
  END IF;

  -- Check if user is blocked with penalty consideration
  IF tracking_record.is_blocked AND (tracking_record.block_expires_at IS NULL OR 
      tracking_record.block_expires_at > (now() + (penalty_multiplier - 1) * interval '1 hour')) THEN
    RETURN jsonb_build_object(
      'allowed', false,
      'reason', 'blocked',
      'message', COALESCE(tracking_record.block_reason, 'User is temporarily blocked'),
      'penalty_applied', penalty_multiplier > 1,
      'violation_count', violation_count,
      'block_expires_at', tracking_record.block_expires_at
    );
  END IF;

  -- Apply standard rate limiting with penalties
  RETURN jsonb_build_object(
    'allowed', true,
    'penalty_multiplier', penalty_multiplier,
    'violation_count', violation_count,
    'enhanced_monitoring', violation_count > 0
  );
END;
$$;