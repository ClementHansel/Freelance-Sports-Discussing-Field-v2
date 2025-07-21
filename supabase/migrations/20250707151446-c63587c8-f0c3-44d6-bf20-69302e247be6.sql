-- Create temporary users table for anonymous sessions
CREATE TABLE public.temporary_users (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '12 hours')
);

-- Enable RLS
ALTER TABLE public.temporary_users ENABLE ROW LEVEL SECURITY;

-- Create policies for temporary users
CREATE POLICY "Temporary users can view their own record" 
ON public.temporary_users 
FOR SELECT 
USING (true);

CREATE POLICY "Anyone can create temporary users" 
ON public.temporary_users 
FOR INSERT 
WITH CHECK (true);

-- Create function to generate friendly display names
CREATE OR REPLACE FUNCTION public.generate_temp_display_name()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  adjectives TEXT[] := ARRAY['Swift', 'Bold', 'Clever', 'Bright', 'Quick', 'Sharp', 'Wise', 'Cool', 'Fast', 'Smart'];
  animals TEXT[] := ARRAY['Wolf', 'Eagle', 'Fox', 'Bear', 'Lion', 'Tiger', 'Hawk', 'Owl', 'Shark', 'Dragon'];
  adjective TEXT;
  animal TEXT;
  year TEXT;
BEGIN
  adjective := adjectives[1 + floor(random() * array_length(adjectives, 1))::int];
  animal := animals[1 + floor(random() * array_length(animals, 1))::int];
  year := EXTRACT(year FROM now())::TEXT;
  
  RETURN adjective || '_' || animal || '_' || year;
END;
$$;

-- Create function to get or create temporary user
CREATE OR REPLACE FUNCTION public.get_or_create_temp_user(p_session_id TEXT)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  temp_user_id UUID;
  display_name TEXT;
BEGIN
  -- First, try to get existing non-expired temp user
  SELECT id INTO temp_user_id
  FROM temporary_users
  WHERE session_id = p_session_id 
    AND expires_at > now();
  
  -- If found and not expired, return it
  IF temp_user_id IS NOT NULL THEN
    RETURN temp_user_id;
  END IF;
  
  -- If not found or expired, create new one
  display_name := generate_temp_display_name();
  
  INSERT INTO temporary_users (session_id, display_name)
  VALUES (p_session_id, display_name)
  RETURNING id INTO temp_user_id;
  
  RETURN temp_user_id;
END;
$$;

-- Create function to cleanup expired temporary users
CREATE OR REPLACE FUNCTION public.cleanup_expired_temp_users()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Delete expired temporary users and their associated data
  DELETE FROM temporary_users 
  WHERE expires_at < now();
END;
$$;

-- Create function to check if user is temporary
CREATE OR REPLACE FUNCTION public.is_temporary_user(user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM temporary_users 
    WHERE id = user_id AND expires_at > now()
  );
END;
$$;

-- Create simple rate limiting function for any user (temp or real)
CREATE OR REPLACE FUNCTION public.check_user_rate_limit(user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  post_count INTEGER;
BEGIN
  -- Count posts in the last 12 hours for this user
  SELECT COUNT(*) INTO post_count
  FROM (
    SELECT created_at FROM topics 
    WHERE author_id = user_id
      AND created_at > (now() - interval '12 hours')
    UNION ALL
    SELECT created_at FROM posts 
    WHERE author_id = user_id
      AND created_at > (now() - interval '12 hours')
  ) user_posts;
  
  -- Return true if under the limit (3 posts)
  RETURN post_count < 3;
END;
$$;