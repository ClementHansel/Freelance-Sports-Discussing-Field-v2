-- Create function to auto-hide reported content
CREATE OR REPLACE FUNCTION public.auto_hide_reported_content()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  protection_info JSONB;
  content_type_val TEXT;
BEGIN
  -- Determine content type
  IF NEW.reported_post_id IS NOT NULL THEN
    content_type_val := 'post';
  ELSIF NEW.reported_topic_id IS NOT NULL THEN
    content_type_val := 'topic';
  END IF;

  -- Check if content is protected by moderator approval
  IF NEW.reported_post_id IS NOT NULL THEN
    protection_info := check_moderation_protection(NEW.reported_post_id, 'post');
  ELSIF NEW.reported_topic_id IS NOT NULL THEN
    protection_info := check_moderation_protection(NEW.reported_topic_id, 'topic');
  END IF;

  -- Only auto-hide if content is not protected by moderators
  IF NOT (protection_info->>'is_protected')::boolean THEN
    -- Auto-hide the reported content by setting moderation_status to 'pending'
    IF NEW.reported_post_id IS NOT NULL THEN
      UPDATE posts 
      SET moderation_status = 'pending'
      WHERE id = NEW.reported_post_id 
        AND moderation_status = 'approved';
    ELSIF NEW.reported_topic_id IS NOT NULL THEN
      UPDATE topics 
      SET moderation_status = 'pending'
      WHERE id = NEW.reported_topic_id 
        AND moderation_status = 'approved';
    END IF;

    -- Log the auto-moderation action
    INSERT INTO public.moderation_history (
      content_id,
      content_type,
      old_status,
      new_status,
      moderator_id,
      reason
    ) VALUES (
      COALESCE(NEW.reported_post_id, NEW.reported_topic_id),
      content_type_val,
      'approved',
      'pending',
      NULL, -- System action, no specific moderator
      'Auto-hidden due to user report'
    );
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger to auto-hide content when reported
DROP TRIGGER IF EXISTS trigger_auto_hide_reported_content ON public.reports;
CREATE TRIGGER trigger_auto_hide_reported_content
  AFTER INSERT ON public.reports
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_hide_reported_content();