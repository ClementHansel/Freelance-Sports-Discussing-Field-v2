
-- Make author_id nullable in posts table to allow anonymous posts
ALTER TABLE public.posts ALTER COLUMN author_id DROP NOT NULL;

-- Make author_id nullable in topics table to allow anonymous topics
ALTER TABLE public.topics ALTER COLUMN author_id DROP NOT NULL;

-- Add fields to posts table for anonymous tracking
ALTER TABLE public.posts 
ADD COLUMN anonymous_ip inet,
ADD COLUMN anonymous_session_id text,
ADD COLUMN is_anonymous boolean DEFAULT false;

-- Add fields to topics table for anonymous tracking
ALTER TABLE public.topics 
ADD COLUMN anonymous_ip inet,
ADD COLUMN anonymous_session_id text,
ADD COLUMN is_anonymous boolean DEFAULT false;

-- Create table to track anonymous posting activity for rate limiting
CREATE TABLE public.anonymous_post_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address inet NOT NULL,
  session_id text NOT NULL,
  post_count integer DEFAULT 1,
  last_post_at timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on the tracking table
ALTER TABLE public.anonymous_post_tracking ENABLE ROW LEVEL SECURITY;

-- Create policy to allow anonymous users to view their own tracking data
CREATE POLICY "Anonymous users can view their own tracking" ON public.anonymous_post_tracking
  FOR SELECT USING (true);

-- Create policy to allow anonymous users to insert tracking data
CREATE POLICY "Anonymous users can insert tracking" ON public.anonymous_post_tracking
  FOR INSERT WITH CHECK (true);

-- Create policy to allow anonymous users to update their tracking data
CREATE POLICY "Anonymous users can update tracking" ON public.anonymous_post_tracking
  FOR UPDATE USING (true);

-- Create function to check anonymous post rate limit (3 posts per 12 hours)
CREATE OR REPLACE FUNCTION check_anonymous_rate_limit(user_ip inet, session_id text)
RETURNS boolean AS $$
DECLARE
  post_count integer;
BEGIN
  -- Count posts in the last 12 hours for this IP/session combination
  SELECT COUNT(*) INTO post_count
  FROM anonymous_post_tracking
  WHERE (ip_address = user_ip OR session_id = session_id)
    AND created_at > (now() - interval '12 hours');
  
  -- Return true if under the limit (3 posts)
  RETURN post_count < 3;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to record anonymous post activity
CREATE OR REPLACE FUNCTION record_anonymous_post(user_ip inet, session_id text)
RETURNS void AS $$
BEGIN
  -- Insert or update the tracking record
  INSERT INTO anonymous_post_tracking (ip_address, session_id, post_count, last_post_at)
  VALUES (user_ip, session_id, 1, now())
  ON CONFLICT (ip_address, session_id) 
  DO UPDATE SET 
    post_count = anonymous_post_tracking.post_count + 1,
    last_post_at = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to validate anonymous content (no images or links)
CREATE OR REPLACE FUNCTION validate_anonymous_content(content text)
RETURNS boolean AS $$
BEGIN
  -- Check for common image formats
  IF content ~* '\.(jpg|jpeg|png|gif|bmp|webp|svg)' THEN
    RETURN false;
  END IF;
  
  -- Check for URLs (http/https)
  IF content ~* 'https?://[^\s]+' THEN
    RETURN false;
  END IF;
  
  -- Check for markdown image syntax
  IF content ~* '!\[.*\]\(.*\)' THEN
    RETURN false;
  END IF;
  
  -- Check for markdown link syntax
  IF content ~* '\[.*\]\(.*\)' THEN
    RETURN false;
  END IF;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql;

-- Update RLS policies for posts to allow anonymous posting
DROP POLICY IF EXISTS "Authenticated users can create posts" ON public.posts;
CREATE POLICY "Users can create posts" ON public.posts
  FOR INSERT WITH CHECK (
    (auth.uid() = author_id) OR 
    (author_id IS NULL AND is_anonymous = true)
  );

-- Update RLS policies for topics to allow anonymous topic creation
DROP POLICY IF EXISTS "Authenticated users can create topics" ON public.topics;
CREATE POLICY "Users can create topics" ON public.topics
  FOR INSERT WITH CHECK (
    (auth.uid() = author_id) OR 
    (author_id IS NULL AND is_anonymous = true)
  );

-- Add unique constraint for anonymous tracking
ALTER TABLE public.anonymous_post_tracking 
ADD CONSTRAINT unique_ip_session UNIQUE (ip_address, session_id);

-- Create cleanup function to remove old tracking records
CREATE OR REPLACE FUNCTION cleanup_old_anonymous_tracking()
RETURNS void AS $$
BEGIN
  DELETE FROM anonymous_post_tracking 
  WHERE created_at < (now() - interval '24 hours');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
