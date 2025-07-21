-- Fix moderation protection system by removing auto-moderation and installing proper protection

-- 1. Remove the auto-moderation trigger that automatically sets content to pending
DROP TRIGGER IF EXISTS trigger_auto_moderate_reported_content ON public.reports;

-- 2. Remove the auto_moderate_reported_content function since it's no longer needed
DROP FUNCTION IF EXISTS public.auto_moderate_reported_content();

-- 3. Install the missing protection triggers on posts table
CREATE TRIGGER prevent_remoderation_posts
  BEFORE UPDATE ON public.posts
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_remoderation();

CREATE TRIGGER log_moderation_posts
  AFTER UPDATE ON public.posts
  FOR EACH ROW
  EXECUTE FUNCTION public.log_moderation_change();

-- 4. Install the missing protection triggers on topics table
CREATE TRIGGER prevent_remoderation_topics
  BEFORE UPDATE ON public.topics
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_remoderation();

CREATE TRIGGER log_moderation_topics
  AFTER UPDATE ON public.topics
  FOR EACH ROW
  EXECUTE FUNCTION public.log_moderation_change();

-- 5. Ensure all existing approved content has protection
-- Set any pending content back to approved if it was previously approved by moderators
UPDATE public.posts 
SET moderation_status = 'approved' 
WHERE moderation_status = 'pending' 
AND id IN (
  SELECT DISTINCT mh.content_id 
  FROM public.moderation_history mh 
  WHERE mh.content_type = 'post' 
    AND mh.new_status = 'approved' 
    AND mh.moderator_id IS NOT NULL
);

UPDATE public.topics 
SET moderation_status = 'approved' 
WHERE moderation_status = 'pending' 
AND id IN (
  SELECT DISTINCT mh.content_id 
  FROM public.moderation_history mh 
  WHERE mh.content_type = 'topic' 
    AND mh.new_status = 'approved' 
    AND mh.moderator_id IS NOT NULL
);