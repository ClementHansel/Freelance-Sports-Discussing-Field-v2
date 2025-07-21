-- Function to automatically moderate reported content
CREATE OR REPLACE FUNCTION public.auto_moderate_reported_content()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- When a report is created, set the reported content to pending moderation
  IF NEW.reported_post_id IS NOT NULL THEN
    -- Update the reported post to pending status
    UPDATE public.posts 
    SET moderation_status = 'pending'
    WHERE id = NEW.reported_post_id;
  END IF;
  
  IF NEW.reported_topic_id IS NOT NULL THEN
    -- Update the reported topic to pending status
    UPDATE public.topics 
    SET moderation_status = 'pending'
    WHERE id = NEW.reported_topic_id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for automatic moderation on reports
CREATE TRIGGER trigger_auto_moderate_reported_content
  AFTER INSERT ON public.reports
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_moderate_reported_content();