-- Create comprehensive IP tracking tables and functions

-- Table for tracking page visits and navigation patterns
CREATE TABLE IF NOT EXISTS public.ip_visit_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address INET NOT NULL,
  session_id TEXT,
  page_path TEXT NOT NULL,
  page_title TEXT,
  referrer TEXT,
  user_agent TEXT,
  search_query TEXT,
  category_visited UUID REFERENCES public.categories(id),
  topic_visited UUID REFERENCES public.topics(id),
  visit_duration INTERVAL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Table for comprehensive activity logging
CREATE TABLE IF NOT EXISTS public.ip_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address INET NOT NULL,
  session_id TEXT,
  activity_type TEXT NOT NULL, -- 'page_visit', 'post_attempt', 'topic_create', 'search', 'report_submit'
  content_id UUID, -- Reference to post, topic, etc.
  content_type TEXT, -- 'post', 'topic', 'report'
  action_data JSONB, -- Store additional details
  is_blocked BOOLEAN DEFAULT false, -- Whether action was blocked by shadow ban
  blocked_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enhanced function to get comprehensive IP activity
CREATE OR REPLACE FUNCTION public.get_comprehensive_ip_activity(target_ip INET)
RETURNS TABLE(
  ip_address INET,
  total_sessions INTEGER,
  total_page_visits INTEGER,
  total_posts INTEGER,
  total_topics INTEGER,
  total_reports INTEGER,
  blocked_attempts INTEGER,
  first_seen TIMESTAMP WITH TIME ZONE,
  last_seen TIMESTAMP WITH TIME ZONE,
  recent_activities JSONB,
  ban_status JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  ban_info RECORD;
BEGIN
  -- Get ban status
  SELECT ban_type, reason, is_active, expires_at, admin_notes
  INTO ban_info
  FROM public.banned_ips
  WHERE ip_address = target_ip AND is_active = true
  LIMIT 1;

  RETURN QUERY
  WITH ip_stats AS (
    SELECT 
      target_ip as ip_addr,
      COUNT(DISTINCT apt.session_id) as session_count,
      (SELECT COUNT(*) FROM public.ip_visit_tracking WHERE ip_address = target_ip) as visit_count,
      COALESCE(SUM(apt.post_count), 0)::INTEGER as post_count,
      COALESCE(SUM(apt.topic_count), 0)::INTEGER as topic_count,
      (SELECT COUNT(*) FROM public.reports WHERE reporter_ip_address = target_ip) as report_count,
      (SELECT COUNT(*) FROM public.ip_activity_log WHERE ip_address = target_ip AND is_blocked = true) as blocked_count,
      MIN(apt.created_at) as first_activity,
      MAX(GREATEST(apt.last_post_at, apt.created_at)) as last_activity
    FROM public.anonymous_post_tracking apt
    WHERE apt.ip_address = target_ip
    GROUP BY target_ip
  ),
  recent_activity AS (
    SELECT jsonb_agg(
      jsonb_build_object(
        'type', activity_type,
        'content_type', content_type,
        'content_id', content_id,
        'is_blocked', is_blocked,
        'blocked_reason', blocked_reason,
        'created_at', created_at,
        'action_data', action_data
      ) ORDER BY created_at DESC
    ) as activities
    FROM (
      SELECT * FROM public.ip_activity_log 
      WHERE ip_address = target_ip 
      ORDER BY created_at DESC 
      LIMIT 50
    ) recent
  )
  SELECT 
    s.ip_addr,
    s.session_count,
    s.visit_count,
    s.post_count,
    s.topic_count,
    s.report_count,
    s.blocked_count,
    s.first_activity,
    s.last_activity,
    COALESCE(ra.activities, '[]'::jsonb),
    CASE 
      WHEN ban_info.ban_type IS NOT NULL THEN
        jsonb_build_object(
          'is_banned', true,
          'ban_type', ban_info.ban_type,
          'reason', ban_info.reason,
          'expires_at', ban_info.expires_at,
          'admin_notes', ban_info.admin_notes
        )
      ELSE
        jsonb_build_object('is_banned', false)
    END
  FROM ip_stats s
  CROSS JOIN recent_activity ra;
END;
$$;

-- Function to log IP activities
CREATE OR REPLACE FUNCTION public.log_ip_activity(
  p_ip_address INET,
  p_session_id TEXT,
  p_activity_type TEXT,
  p_content_id UUID DEFAULT NULL,
  p_content_type TEXT DEFAULT NULL,
  p_action_data JSONB DEFAULT NULL,
  p_is_blocked BOOLEAN DEFAULT false,
  p_blocked_reason TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.ip_activity_log (
    ip_address,
    session_id,
    activity_type,
    content_id,
    content_type,
    action_data,
    is_blocked,
    blocked_reason
  ) VALUES (
    p_ip_address,
    p_session_id,
    p_activity_type,
    p_content_id,
    p_content_type,
    p_action_data,
    p_is_blocked,
    p_blocked_reason
  );
END;
$$;

-- Function to log page visits
CREATE OR REPLACE FUNCTION public.log_page_visit(
  p_ip_address INET,
  p_session_id TEXT,
  p_page_path TEXT,
  p_page_title TEXT DEFAULT NULL,
  p_referrer TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL,
  p_search_query TEXT DEFAULT NULL,
  p_category_id UUID DEFAULT NULL,
  p_topic_id UUID DEFAULT NULL
)
RETURNS VOID
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
    topic_visited
  ) VALUES (
    p_ip_address,
    p_session_id,
    p_page_path,
    p_page_title,
    p_referrer,
    p_user_agent,
    p_search_query,
    p_category_id,
    p_topic_id
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
      'search_query', p_search_query
    )
  );
END;
$$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_ip_visit_tracking_ip_created ON public.ip_visit_tracking(ip_address, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ip_activity_log_ip_created ON public.ip_activity_log(ip_address, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ip_activity_log_type ON public.ip_activity_log(activity_type);

-- Enable RLS
ALTER TABLE public.ip_visit_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ip_activity_log ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Admins can view all IP tracking data"
ON public.ip_visit_tracking
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "System can insert visit tracking"
ON public.ip_visit_tracking
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Admins can view all IP activity logs"
ON public.ip_activity_log
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "System can insert activity logs"
ON public.ip_activity_log
FOR INSERT
WITH CHECK (true);