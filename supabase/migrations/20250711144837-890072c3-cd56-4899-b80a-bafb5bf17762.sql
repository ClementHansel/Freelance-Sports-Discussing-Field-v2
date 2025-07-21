-- Create function to automatically moderate content when reported
CREATE OR REPLACE FUNCTION auto_moderate_on_report()
RETURNS TRIGGER AS $$
DECLARE
  protection_info JSONB;
BEGIN
  -- Check if this content has moderation protection
  SELECT check_moderation_protection(NEW.reported_post_id::uuid, 'post') INTO protection_info
  WHERE NEW.reported_post_id IS NOT NULL;
  
  SELECT check_moderation_protection(NEW.reported_topic_id::uuid, 'topic') INTO protection_info
  WHERE NEW.reported_topic_id IS NOT NULL AND protection_info IS NULL;

  -- If content is not protected, automatically set to pending
  IF protection_info IS NULL OR (protection_info->>'is_protected')::boolean = false THEN
    -- Update post moderation status
    IF NEW.reported_post_id IS NOT NULL THEN
      UPDATE posts 
      SET moderation_status = 'pending'
      WHERE id = NEW.reported_post_id AND moderation_status = 'approved';
    END IF;
    
    -- Update topic moderation status  
    IF NEW.reported_topic_id IS NOT NULL THEN
      UPDATE topics 
      SET moderation_status = 'pending'
      WHERE id = NEW.reported_topic_id AND moderation_status = 'approved';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to auto-moderate content when reports are created
DROP TRIGGER IF EXISTS trigger_auto_moderate_on_report ON public.reports;
CREATE TRIGGER trigger_auto_moderate_on_report
  AFTER INSERT ON public.reports
  FOR EACH ROW
  EXECUTE FUNCTION auto_moderate_on_report();

-- Enable realtime for posts and topics tables to broadcast moderation changes
ALTER publication supabase_realtime ADD TABLE posts;
ALTER publication supabase_realtime ADD TABLE topics;