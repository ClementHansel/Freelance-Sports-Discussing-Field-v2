-- Disable automatic moderation triggers that are putting all posts into moderation
DROP TRIGGER IF EXISTS auto_moderate_posts ON public.posts;
DROP TRIGGER IF EXISTS auto_moderate_topics ON public.topics;

-- Also drop the auto_moderate_content function since it's no longer needed
DROP FUNCTION IF EXISTS public.auto_moderate_content();

-- Ensure default moderation status is 'approved' for new content
ALTER TABLE public.posts ALTER COLUMN moderation_status SET DEFAULT 'approved';
ALTER TABLE public.topics ALTER COLUMN moderation_status SET DEFAULT 'approved';