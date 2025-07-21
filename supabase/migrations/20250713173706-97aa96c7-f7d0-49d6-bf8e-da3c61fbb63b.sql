-- Add IP address tracking to topics table
ALTER TABLE public.topics 
ADD COLUMN IF NOT EXISTS ip_address inet,
ADD COLUMN IF NOT EXISTS is_anonymous boolean DEFAULT false;

-- Update existing topics where we can infer the IP from their posts
UPDATE public.topics 
SET ip_address = posts.ip_address,
    is_anonymous = posts.is_anonymous
FROM (
  SELECT DISTINCT ON (topic_id) 
    topic_id, 
    ip_address, 
    is_anonymous
  FROM public.posts 
  WHERE ip_address IS NOT NULL
  ORDER BY topic_id, created_at ASC
) AS posts
WHERE topics.id = posts.topic_id 
AND topics.ip_address IS NULL;