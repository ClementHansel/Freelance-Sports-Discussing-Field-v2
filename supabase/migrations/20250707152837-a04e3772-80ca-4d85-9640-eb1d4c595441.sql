-- Remove the foreign key constraint that prevents temporary users from posting
ALTER TABLE public.posts DROP CONSTRAINT IF EXISTS posts_author_id_fkey;

-- The posts table can now accept author_id values from either:
-- 1. profiles.id (authenticated users)
-- 2. temporary_users.id (temporary users)
-- 3. NULL (for system/anonymous posts)

-- Update RLS policies to work without the foreign key constraint
DROP POLICY IF EXISTS "Users can create posts" ON public.posts;

-- Recreate the policy to handle both authenticated and temporary users
CREATE POLICY "Users can create posts" 
ON public.posts 
FOR INSERT 
WITH CHECK (
  -- Authenticated user creating post
  (auth.uid() = author_id) OR 
  -- Temporary user creating post (no auth.uid() but valid temp user)
  (auth.uid() IS NULL AND is_temporary_user(author_id)) OR
  -- Allow NULL author_id for system posts
  (author_id IS NULL)
);