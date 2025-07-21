-- Remove old anonymous tracking columns from posts and topics
-- These are no longer needed with the new temporary users system

-- Remove anonymous columns from posts table
ALTER TABLE public.posts 
DROP COLUMN IF EXISTS anonymous_ip,
DROP COLUMN IF EXISTS anonymous_session_id,
DROP COLUMN IF EXISTS is_anonymous;

-- Remove anonymous columns from topics table  
ALTER TABLE public.topics
DROP COLUMN IF EXISTS anonymous_ip,
DROP COLUMN IF EXISTS anonymous_session_id,
DROP COLUMN IF EXISTS is_anonymous;

-- Update topics policy to handle temp users
DROP POLICY IF EXISTS "Users can create topics" ON public.topics;
CREATE POLICY "Users can create topics" 
ON public.topics 
FOR INSERT 
WITH CHECK (
  (auth.uid() = author_id) OR 
  (auth.uid() IS NULL AND is_temporary_user(author_id))
);

-- Update posts policy to handle temp users
DROP POLICY IF EXISTS "Users can create posts" ON public.posts;
CREATE POLICY "Users can create posts" 
ON public.posts 
FOR INSERT 
WITH CHECK (
  (auth.uid() = author_id) OR 
  (auth.uid() IS NULL AND is_temporary_user(author_id))
);

-- Update vote policies to handle temp users
DROP POLICY IF EXISTS "Users can insert topic votes" ON public.topic_votes;
CREATE POLICY "Users can insert topic votes" 
ON public.topic_votes 
FOR INSERT 
WITH CHECK (
  (auth.uid() = user_id) OR 
  (auth.uid() IS NULL AND is_temporary_user(user_id))
);

DROP POLICY IF EXISTS "Users can update topic votes" ON public.topic_votes;
CREATE POLICY "Users can update topic votes" 
ON public.topic_votes 
FOR UPDATE 
USING (
  (auth.uid() = user_id) OR 
  (auth.uid() IS NULL AND is_temporary_user(user_id))
);

DROP POLICY IF EXISTS "Users can delete topic votes" ON public.topic_votes;
CREATE POLICY "Users can delete topic votes" 
ON public.topic_votes 
FOR DELETE 
USING (
  (auth.uid() = user_id) OR 
  (auth.uid() IS NULL AND is_temporary_user(user_id))
);

DROP POLICY IF EXISTS "Users can insert post votes" ON public.post_votes;
CREATE POLICY "Users can insert post votes" 
ON public.post_votes 
FOR INSERT 
WITH CHECK (
  (auth.uid() = user_id) OR 
  (auth.uid() IS NULL AND is_temporary_user(user_id))
);

DROP POLICY IF EXISTS "Users can update post votes" ON public.post_votes;
CREATE POLICY "Users can update post votes" 
ON public.post_votes 
FOR UPDATE 
USING (
  (auth.uid() = user_id) OR 
  (auth.uid() IS NULL AND is_temporary_user(user_id))
);

DROP POLICY IF EXISTS "Users can delete post votes" ON public.post_votes;
CREATE POLICY "Users can delete post votes" 
ON public.post_votes 
FOR DELETE 
USING (
  (auth.uid() = user_id) OR 
  (auth.uid() IS NULL AND is_temporary_user(user_id))
);

-- Remove old anonymous vote columns (we'll use user_id with temp users)
ALTER TABLE public.topic_votes 
DROP COLUMN IF EXISTS anonymous_ip,
DROP COLUMN IF EXISTS anonymous_session_id;

ALTER TABLE public.post_votes 
DROP COLUMN IF EXISTS anonymous_ip,
DROP COLUMN IF EXISTS anonymous_session_id;