-- Enable anonymous voting by modifying vote tables

-- Make user_id nullable in topic_votes table
ALTER TABLE public.topic_votes ALTER COLUMN user_id DROP NOT NULL;

-- Make user_id nullable in post_votes table  
ALTER TABLE public.post_votes ALTER COLUMN user_id DROP NOT NULL;

-- Add anonymous tracking fields to topic_votes
ALTER TABLE public.topic_votes 
ADD COLUMN anonymous_ip inet,
ADD COLUMN anonymous_session_id text;

-- Add anonymous tracking fields to post_votes
ALTER TABLE public.post_votes
ADD COLUMN anonymous_ip inet,
ADD COLUMN anonymous_session_id text;

-- Drop existing unique constraints and recreate to handle anonymous votes
ALTER TABLE public.topic_votes DROP CONSTRAINT IF EXISTS topic_votes_user_id_topic_id_key;
ALTER TABLE public.post_votes DROP CONSTRAINT IF EXISTS post_votes_user_id_post_id_key;

-- Create new unique constraints that handle both authenticated and anonymous votes
-- For authenticated users: unique by user_id and topic_id/post_id
-- For anonymous users: unique by session_id and topic_id/post_id
CREATE UNIQUE INDEX topic_votes_authenticated_unique 
ON public.topic_votes (user_id, topic_id) 
WHERE user_id IS NOT NULL;

CREATE UNIQUE INDEX topic_votes_anonymous_unique 
ON public.topic_votes (anonymous_session_id, topic_id) 
WHERE user_id IS NULL AND anonymous_session_id IS NOT NULL;

CREATE UNIQUE INDEX post_votes_authenticated_unique 
ON public.post_votes (user_id, post_id) 
WHERE user_id IS NOT NULL;

CREATE UNIQUE INDEX post_votes_anonymous_unique 
ON public.post_votes (anonymous_session_id, post_id) 
WHERE user_id IS NULL AND anonymous_session_id IS NOT NULL;

-- Update RLS policies for topic_votes to allow anonymous voting
DROP POLICY IF EXISTS "Users can insert their own topic votes" ON public.topic_votes;
CREATE POLICY "Users can insert topic votes" ON public.topic_votes
FOR INSERT WITH CHECK (
  (auth.uid() = user_id) OR 
  (user_id IS NULL AND anonymous_session_id IS NOT NULL)
);

DROP POLICY IF EXISTS "Users can update their own topic votes" ON public.topic_votes;
CREATE POLICY "Users can update topic votes" ON public.topic_votes
FOR UPDATE USING (
  (auth.uid() = user_id) OR 
  (user_id IS NULL AND anonymous_session_id IS NOT NULL)
);

DROP POLICY IF EXISTS "Users can delete their own topic votes" ON public.topic_votes;
CREATE POLICY "Users can delete topic votes" ON public.topic_votes
FOR DELETE USING (
  (auth.uid() = user_id) OR 
  (user_id IS NULL AND anonymous_session_id IS NOT NULL)
);

-- Update RLS policies for post_votes to allow anonymous voting
DROP POLICY IF EXISTS "Users can insert their own post votes" ON public.post_votes;
CREATE POLICY "Users can insert post votes" ON public.post_votes
FOR INSERT WITH CHECK (
  (auth.uid() = user_id) OR 
  (user_id IS NULL AND anonymous_session_id IS NOT NULL)
);

DROP POLICY IF EXISTS "Users can update their own post votes" ON public.post_votes;
CREATE POLICY "Users can update post votes" ON public.post_votes
FOR UPDATE USING (
  (auth.uid() = user_id) OR 
  (user_id IS NULL AND anonymous_session_id IS NOT NULL)
);

DROP POLICY IF EXISTS "Users can delete their own post votes" ON public.post_votes;
CREATE POLICY "Users can delete post votes" ON public.post_votes
FOR DELETE USING (
  (auth.uid() = user_id) OR 
  (user_id IS NULL AND anonymous_session_id IS NOT NULL)
);

-- Create function to generate session ID for anonymous users
CREATE OR REPLACE FUNCTION public.generate_anonymous_session_id()
RETURNS text AS $$
BEGIN
  RETURN 'anon_' || encode(gen_random_bytes(16), 'hex');
END;
$$ LANGUAGE plpgsql;

-- Create function to check anonymous vote rate limit (3 votes per hour)
CREATE OR REPLACE FUNCTION public.check_anonymous_vote_limit(user_ip inet, session_id text)
RETURNS boolean AS $$
DECLARE
  vote_count integer;
BEGIN
  -- Count votes in the last hour for this IP/session combination
  SELECT COUNT(*) INTO vote_count
  FROM (
    SELECT created_at FROM topic_votes 
    WHERE (anonymous_ip = user_ip OR anonymous_session_id = session_id)
      AND created_at > (now() - interval '1 hour')
    UNION ALL
    SELECT created_at FROM post_votes 
    WHERE (anonymous_ip = user_ip OR anonymous_session_id = session_id)
      AND created_at > (now() - interval '1 hour')
  ) votes;
  
  -- Return true if under the limit (15 votes per hour)
  RETURN vote_count < 15;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;