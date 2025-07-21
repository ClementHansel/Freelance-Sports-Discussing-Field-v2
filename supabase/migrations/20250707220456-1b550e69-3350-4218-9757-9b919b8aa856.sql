-- Fix the unique constraint for anonymous voting
-- The current constraint prevents voting when both user_id AND anonymous_session_id exist
-- We need a partial unique constraint that only applies when anonymous_session_id is not null

-- Drop the problematic constraint
ALTER TABLE public.topic_votes DROP CONSTRAINT IF EXISTS unique_anonymous_topic_vote;
ALTER TABLE public.post_votes DROP CONSTRAINT IF EXISTS unique_anonymous_post_vote;

-- Create a proper partial unique constraint for anonymous votes only
-- This allows one vote per topic per anonymous session, but doesn't conflict with user votes
CREATE UNIQUE INDEX idx_topic_votes_anonymous_unique 
ON public.topic_votes (topic_id, anonymous_session_id) 
WHERE anonymous_session_id IS NOT NULL AND user_id IS NULL;

CREATE UNIQUE INDEX idx_post_votes_anonymous_unique 
ON public.post_votes (post_id, anonymous_session_id) 
WHERE anonymous_session_id IS NOT NULL AND user_id IS NULL;