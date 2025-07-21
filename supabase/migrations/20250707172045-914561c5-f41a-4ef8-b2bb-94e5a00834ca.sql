-- Add moderation requirements to categories
ALTER TABLE public.categories 
ADD COLUMN requires_moderation boolean DEFAULT false;

-- Set Level 1 and Level 2 categories to require moderation
UPDATE public.categories 
SET requires_moderation = true 
WHERE level IN (1, 2);

-- Set Level 3 categories to not require moderation  
UPDATE public.categories 
SET requires_moderation = false 
WHERE level = 3;

-- Add moderation status to topics
ALTER TABLE public.topics 
ADD COLUMN moderation_status text DEFAULT 'approved';

-- Add moderation status to posts
ALTER TABLE public.posts 
ADD COLUMN moderation_status text DEFAULT 'approved';

-- Create index for better performance on moderation queries
CREATE INDEX idx_topics_moderation_status ON public.topics(moderation_status);
CREATE INDEX idx_posts_moderation_status ON public.posts(moderation_status);
CREATE INDEX idx_categories_requires_moderation ON public.categories(requires_moderation);

-- Add check constraints to ensure valid moderation status values
ALTER TABLE public.topics 
ADD CONSTRAINT check_topics_moderation_status 
CHECK (moderation_status IN ('approved', 'pending', 'rejected'));

ALTER TABLE public.posts 
ADD CONSTRAINT check_posts_moderation_status 
CHECK (moderation_status IN ('approved', 'pending', 'rejected'));