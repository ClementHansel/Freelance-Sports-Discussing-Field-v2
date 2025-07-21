-- Remove the foreign key constraint on topics.author_id to allow anonymous users
-- This matches how the posts table works (posts don't have this constraint either)

ALTER TABLE public.topics 
DROP CONSTRAINT IF EXISTS topics_author_id_fkey;

-- Add a comment to document why this constraint was removed
COMMENT ON COLUMN public.topics.author_id IS 'References either profiles.id for authenticated users or temporary_users.id for anonymous users. No foreign key constraint to allow flexibility.';