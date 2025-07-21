-- Fix the get_reporter_behavior function - variable name mismatch
CREATE OR REPLACE FUNCTION public.get_reporter_behavior(p_reporter_id uuid DEFAULT NULL::uuid, p_reporter_ip inet DEFAULT NULL::inet)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  report_stats RECORD;
  recent_reports INTEGER := 0;
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

  -- Count recent reports on previously approved content
  SELECT COUNT(*) INTO recent_reports
  FROM reports r1
  WHERE ((p_reporter_id IS NOT NULL AND r1.reporter_id = p_reporter_id)
      OR (p_reporter_ip IS NOT NULL AND r1.reporter_ip_address = p_reporter_ip))
    AND r1.created_at > NOW() - INTERVAL '24 hours'
    AND EXISTS (
      SELECT 1 FROM reports r2 
      WHERE r2.reported_post_id = r1.reported_post_id 
         OR r2.reported_topic_id = r1.reported_topic_id
      AND r2.status = 'resolved' 
      AND (r2.admin_notes ILIKE '%approved%' OR r2.admin_notes ILIKE '%legitimate%')
      AND r2.created_at < r1.created_at
    );

  RETURN jsonb_build_object(
    'total_reports', report_stats.total_reports,
    'dismissed_reports', report_stats.dismissed_reports,
    'reports_today', report_stats.reports_today,
    'reports_last_hour', report_stats.reports_last_hour,
    'recent_repeat_reports', recent_reports,
    'is_problematic_reporter', (
      report_stats.reports_today > 5 OR 
      report_stats.reports_last_hour > 2 OR
      recent_reports > 2 OR
      (report_stats.total_reports > 0 AND report_stats.dismissed_reports::float / report_stats.total_reports > 0.7)
    ),
    'should_rate_limit', (
      report_stats.reports_last_hour > 3 OR
      recent_reports > 1
    )
  );
END;
$function$;