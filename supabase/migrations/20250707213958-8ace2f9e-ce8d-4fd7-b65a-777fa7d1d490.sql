-- Add anonymous voting security fields
ALTER TABLE public.topic_votes 
ADD COLUMN IF NOT EXISTS anonymous_ip inet,
ADD COLUMN IF NOT EXISTS anonymous_session_id text;

ALTER TABLE public.post_votes 
ADD COLUMN IF NOT EXISTS anonymous_ip inet,
ADD COLUMN IF NOT EXISTS anonymous_session_id text;

-- Add unique constraints for anonymous votes (PostgreSQL doesn't support IF NOT EXISTS for constraints)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'unique_anonymous_topic_vote') THEN
        ALTER TABLE public.topic_votes ADD CONSTRAINT unique_anonymous_topic_vote UNIQUE (topic_id, anonymous_session_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'unique_anonymous_post_vote') THEN
        ALTER TABLE public.post_votes ADD CONSTRAINT unique_anonymous_post_vote UNIQUE (post_id, anonymous_session_id);
    END IF;
END $$;

-- Update RLS policies for anonymous voting
DROP POLICY IF EXISTS "Users can insert topic votes" ON public.topic_votes;
DROP POLICY IF EXISTS "Users can insert post votes" ON public.post_votes;

CREATE POLICY "Users can insert topic votes" ON public.topic_votes
FOR INSERT WITH CHECK (
  (auth.uid() = user_id) OR 
  ((auth.uid() IS NULL) AND is_temporary_user(user_id)) OR
  ((auth.uid() IS NULL) AND (user_id IS NULL) AND (anonymous_session_id IS NOT NULL))
);

CREATE POLICY "Users can insert post votes" ON public.post_votes
FOR INSERT WITH CHECK (
  (auth.uid() = user_id) OR 
  ((auth.uid() IS NULL) AND is_temporary_user(user_id)) OR
  ((auth.uid() IS NULL) AND (user_id IS NULL) AND (anonymous_session_id IS NOT NULL))
);