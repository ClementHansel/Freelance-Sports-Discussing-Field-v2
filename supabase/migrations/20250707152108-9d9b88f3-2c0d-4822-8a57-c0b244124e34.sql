-- Drop existing policies that depend on is_anonymous columns
DROP POLICY IF EXISTS "Users can create topics" ON public.topics;
DROP POLICY IF EXISTS "Users can create posts" ON public.posts;
DROP POLICY IF EXISTS "Users can insert topic votes" ON public.topic_votes;
DROP POLICY IF EXISTS "Users can update topic votes" ON public.topic_votes;
DROP POLICY IF EXISTS "Users can delete topic votes" ON public.topic_votes;
DROP POLICY IF EXISTS "Users can insert post votes" ON public.post_votes;
DROP POLICY IF EXISTS "Users can update post votes" ON public.post_votes;
DROP POLICY IF EXISTS "Users can delete post votes" ON public.post_votes;

-- Now remove the columns
ALTER TABLE public.posts 
DROP COLUMN IF EXISTS anonymous_ip CASCADE,
DROP COLUMN IF EXISTS anonymous_session_id CASCADE,
DROP COLUMN IF EXISTS is_anonymous CASCADE;

ALTER TABLE public.topics
DROP COLUMN IF EXISTS anonymous_ip CASCADE,
DROP COLUMN IF EXISTS anonymous_session_id CASCADE,
DROP COLUMN IF EXISTS is_anonymous CASCADE;

ALTER TABLE public.topic_votes 
DROP COLUMN IF EXISTS anonymous_ip CASCADE,
DROP COLUMN IF EXISTS anonymous_session_id CASCADE;

ALTER TABLE public.post_votes 
DROP COLUMN IF EXISTS anonymous_ip CASCADE,
DROP COLUMN IF EXISTS anonymous_session_id CASCADE;

-- Create new policies for the simplified system
CREATE POLICY "Users can create topics" 
ON public.topics 
FOR INSERT 
WITH CHECK (
  (auth.uid() = author_id) OR 
  (auth.uid() IS NULL AND is_temporary_user(author_id))
);

CREATE POLICY "Users can create posts" 
ON public.posts 
FOR INSERT 
WITH CHECK (
  (auth.uid() = author_id) OR 
  (auth.uid() IS NULL AND is_temporary_user(author_id))
);

CREATE POLICY "Users can insert topic votes" 
ON public.topic_votes 
FOR INSERT 
WITH CHECK (
  (auth.uid() = user_id) OR 
  (auth.uid() IS NULL AND is_temporary_user(user_id))
);

CREATE POLICY "Users can update topic votes" 
ON public.topic_votes 
FOR UPDATE 
USING (
  (auth.uid() = user_id) OR 
  (auth.uid() IS NULL AND is_temporary_user(user_id))
);

CREATE POLICY "Users can delete topic votes" 
ON public.topic_votes 
FOR DELETE 
USING (
  (auth.uid() = user_id) OR 
  (auth.uid() IS NULL AND is_temporary_user(user_id))
);

CREATE POLICY "Users can insert post votes" 
ON public.post_votes 
FOR INSERT 
WITH CHECK (
  (auth.uid() = user_id) OR 
  (auth.uid() IS NULL AND is_temporary_user(user_id))
);

CREATE POLICY "Users can update post votes" 
ON public.post_votes 
FOR UPDATE 
USING (
  (auth.uid() = user_id) OR 
  (auth.uid() IS NULL AND is_temporary_user(user_id))
);

CREATE POLICY "Users can delete post votes" 
ON public.post_votes 
FOR DELETE 
USING (
  (auth.uid() = user_id) OR 
  (auth.uid() IS NULL AND is_temporary_user(user_id))
);