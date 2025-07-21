-- Fix column name mismatch in get_comprehensive_ip_activity function
CREATE OR REPLACE FUNCTION public.get_comprehensive_ip_activity(target_ip inet)
RETURNS TABLE(
  ip_address inet,
  total_sessions integer,
  total_page_visits integer,
  total_posts integer,
  total_topics integer,
  total_reports integer,
  blocked_attempts integer,
  first_seen timestamp with time zone,
  last_seen timestamp with time zone,
  recent_activities jsonb,
  ban_status jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  ban_info RECORD;
BEGIN
  -- Get ban status - fix ambiguous column reference
  SELECT ban_type, reason, is_active, expires_at, admin_notes
  INTO ban_info
  FROM public.banned_ips
  WHERE banned_ips.ip_address = target_ip AND is_active = true
  LIMIT 1;

  RETURN QUERY
  WITH ip_stats AS (
    SELECT 
      target_ip as ip_addr,
      COUNT(DISTINCT apt.session_id) as session_count,
      (SELECT COUNT(*) FROM public.ip_visit_tracking WHERE ip_visit_tracking.ip_address = target_ip) as visit_count,
      COALESCE(SUM(apt.post_count), 0)::INTEGER as post_count,
      COALESCE(SUM(apt.topic_count), 0)::INTEGER as topic_count,
      (SELECT COUNT(*) FROM public.reports WHERE reports.reporter_ip_address = target_ip) as report_count,
      (SELECT COUNT(*) FROM public.ip_activity_log WHERE ip_activity_log.ip_address = target_ip AND is_blocked = true) as blocked_count,
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
      WHERE ip_activity_log.ip_address = target_ip 
      ORDER BY created_at DESC 
      LIMIT 50
    ) recent
  )
  SELECT 
    s.ip_addr as ip_address,
    s.session_count as total_sessions,
    s.visit_count as total_page_visits,
    s.post_count as total_posts,
    s.topic_count as total_topics,
    s.report_count as total_reports,
    s.blocked_count as blocked_attempts,
    s.first_activity as first_seen,
    s.last_activity as last_seen,
    COALESCE(ra.activities, '[]'::jsonb) as recent_activities,
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
    END as ban_status
  FROM ip_stats s
  CROSS JOIN recent_activity ra;
END;
$$;