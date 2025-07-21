
-- Update the topics table to reference profiles instead of auth.users
ALTER TABLE public.topics 
DROP CONSTRAINT topics_author_id_fkey;

ALTER TABLE public.topics 
ADD CONSTRAINT topics_author_id_fkey 
FOREIGN KEY (author_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Update the posts table to reference profiles instead of auth.users  
ALTER TABLE public.posts 
DROP CONSTRAINT posts_author_id_fkey;

ALTER TABLE public.posts 
ADD CONSTRAINT posts_author_id_fkey 
FOREIGN KEY (author_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
