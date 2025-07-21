-- Update the check_moderation_protection function to include pinned topic protection
CREATE OR REPLACE FUNCTION public.check_moderation_protection(p_content_id uuid, p_content_type text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  last_approval RECORD;
  topic_info RECORD;
  protection_status JSONB;
BEGIN
  -- For topics, check if the topic is pinned first
  IF p_content_type = 'topic' THEN
    SELECT is_pinned, title INTO topic_info
    FROM public.topics
    WHERE id = p_content_id;
    
    -- If topic is pinned, it's automatically protected
    IF topic_info.is_pinned = true THEN
      RETURN jsonb_build_object(
        'is_protected', true,
        'protection_type', 'pinned',
        'reason', 'This topic is pinned and cannot be hidden',
        'topic_title', topic_info.title
      );
    END IF;
  END IF;

  -- Get the most recent approval by a moderator/admin (existing logic)
  SELECT mh.*, p.username as moderator_name
  INTO last_approval
  FROM public.moderation_history mh
  LEFT JOIN public.profiles p ON mh.moderator_id = p.id
  WHERE mh.content_id = p_content_id 
    AND mh.content_type = p_content_type
    AND mh.new_status = 'approved'
    AND mh.moderator_id IS NOT NULL
  ORDER BY mh.created_at DESC
  LIMIT 1;

  IF last_approval IS NULL THEN
    -- No moderator approval found, not protected
    RETURN jsonb_build_object(
      'is_protected', false,
      'reason', 'No previous moderator approval found'
    );
  END IF;

  -- Content is protected by moderator approval
  RETURN jsonb_build_object(
    'is_protected', true,
    'protection_type', 'moderator_approved',
    'approved_at', last_approval.created_at,
    'approved_by', last_approval.moderator_name,
    'moderator_id', last_approval.moderator_id,
    'reason', last_approval.reason
  );
END;
$function$;