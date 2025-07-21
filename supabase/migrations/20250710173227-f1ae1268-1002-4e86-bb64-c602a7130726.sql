-- Create function to check if content has been previously reported and resolved as approved
CREATE OR REPLACE FUNCTION public.check_previous_report_status(
  p_post_id UUID DEFAULT NULL,
  p_topic_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  previous_reports RECORD;
  approved_count INTEGER := 0;
  total_reports INTEGER := 0;
  last_approved_at TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Count previous reports for this content
  SELECT 
    COUNT(*) as total,
    COUNT(*) FILTER (WHERE status = 'resolved' AND admin_notes ILIKE '%approved%' OR admin_notes ILIKE '%legitimate%') as approved,
    MAX(reviewed_at) FILTER (WHERE status = 'resolved' AND admin_notes ILIKE '%approved%' OR admin_notes ILIKE '%legitimate%') as last_approved
  INTO total_reports, approved_count, last_approved_at
  FROM reports
  WHERE (p_post_id IS NOT NULL AND reported_post_id = p_post_id)
     OR (p_topic_id IS NOT NULL AND reported_topic_id = p_topic_id);

  RETURN jsonb_build_object(
    'has_previous_reports', total_reports > 0,
    'total_reports', total_reports,
    'approved_count', approved_count,
    'was_previously_approved', approved_count > 0,
    'last_approved_at', last_approved_at,
    'should_show_warning', approved_count > 0
  );
END;
$function$;

-- Create function to get reporter behavior patterns
CREATE OR REPLACE FUNCTION public.get_reporter_behavior(
  p_reporter_id UUID DEFAULT NULL,
  p_reporter_ip INET DEFAULT NULL
)
RETURNS JSONB
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
      recent_repeat_reports > 1
    )
  );
END;
$function$;