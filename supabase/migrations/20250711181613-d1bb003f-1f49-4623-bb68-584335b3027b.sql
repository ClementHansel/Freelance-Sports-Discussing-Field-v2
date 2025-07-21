-- Fix rate limiting for anonymous users in get_reporter_behavior function
CREATE OR REPLACE FUNCTION public.get_reporter_behavior(p_reporter_id uuid DEFAULT NULL::uuid, p_reporter_ip inet DEFAULT NULL::inet)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  report_stats RECORD;
  recent_reports INTEGER := 0;
  is_anonymous_user BOOLEAN := (p_reporter_id IS NULL);
BEGIN
  -- Get reporter statistics
  SELECT 
    COUNT(*) as total_reports,
    COUNT(*) FILTER (WHERE status = 'dismissed') as dismissed_reports,
    COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '24 hours') as reports_today,
    COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '1 hour') as reports_last_hour
  INTO report_stats
  FROM reports
  WHERE (p_reporter_id IS NOT NULL AND reporter_id = p_reporter_id)
     OR (p_reporter_ip IS NOT NULL AND reporter_ip_address = p_reporter_ip);

  -- Count recent reports on the SAME content that was previously approved
  -- Fix the logic to properly match the same content, not just any approved content
  SELECT COUNT(*) INTO recent_reports
  FROM reports r1
  WHERE ((p_reporter_id IS NOT NULL AND r1.reporter_id = p_reporter_id)
      OR (p_reporter_ip IS NOT NULL AND r1.reporter_ip_address = p_reporter_ip))
    AND r1.created_at > NOW() - INTERVAL '24 hours'
    AND EXISTS (
      SELECT 1 FROM reports r2 
      WHERE (
        -- Same post reported
        (r1.reported_post_id IS NOT NULL AND r2.reported_post_id = r1.reported_post_id)
        OR 
        -- Same topic reported  
        (r1.reported_topic_id IS NOT NULL AND r2.reported_topic_id = r1.reported_topic_id)
      )
      AND r2.status = 'resolved' 
      AND (r2.admin_notes ILIKE '%approved%' OR r2.admin_notes ILIKE '%legitimate%')
      AND r2.created_at < r1.created_at
      AND r2.reporter_id != r1.reporter_id -- Different reporter approved it
    );

  -- Different thresholds for anonymous vs authenticated users
  RETURN jsonb_build_object(
    'total_reports', report_stats.total_reports,
    'dismissed_reports', report_stats.dismissed_reports,
    'reports_today', report_stats.reports_today,
    'reports_last_hour', report_stats.reports_last_hour,
    'recent_repeat_reports', recent_reports,
    'is_anonymous_user', is_anonymous_user,
    'is_problematic_reporter', (
      -- More lenient for anonymous users (IP-based)
      CASE WHEN is_anonymous_user THEN
        report_stats.reports_today > 8 OR 
        report_stats.reports_last_hour > 4 OR
        recent_reports > 3 OR
        (report_stats.total_reports > 10 AND report_stats.dismissed_reports::float / report_stats.total_reports > 0.8)
      ELSE
        -- Keep existing thresholds for authenticated users
        report_stats.reports_today > 5 OR 
        report_stats.reports_last_hour > 2 OR
        recent_reports > 2 OR
        (report_stats.total_reports > 0 AND report_stats.dismissed_reports::float / report_stats.total_reports > 0.7)
      END
    ),
    'should_rate_limit', (
      -- More lenient for anonymous users
      CASE WHEN is_anonymous_user THEN
        report_stats.reports_last_hour > 5 OR
        recent_reports > 2
      ELSE
        report_stats.reports_last_hour > 3 OR
        recent_reports > 1
      END
    )
  );
END;
$function$;