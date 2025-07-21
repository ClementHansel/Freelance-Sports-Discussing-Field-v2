-- Create voting tables for Reddit-style upvote/downvote system

-- Table for topic votes
CREATE TABLE public.topic_votes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  topic_id UUID NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  vote_type INTEGER NOT NULL CHECK (vote_type IN (-1, 1)), -- -1 for downvote, 1 for upvote
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, topic_id)
);

-- Table for post votes  
CREATE TABLE public.post_votes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  vote_type INTEGER NOT NULL CHECK (vote_type IN (-1, 1)), -- -1 for downvote, 1 for upvote
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, post_id)
);

-- Enable RLS
ALTER TABLE public.topic_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_votes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for topic_votes
CREATE POLICY "Users can view all topic votes" 
ON public.topic_votes 
FOR SELECT 
USING (true);

CREATE POLICY "Users can insert their own topic votes" 
ON public.topic_votes 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own topic votes" 
ON public.topic_votes 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own topic votes" 
ON public.topic_votes 
FOR DELETE 
USING (auth.uid() = user_id);

-- RLS Policies for post_votes
CREATE POLICY "Users can view all post votes" 
ON public.post_votes 
FOR SELECT 
USING (true);

CREATE POLICY "Users can insert their own post votes" 
ON public.post_votes 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own post votes" 
ON public.post_votes 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own post votes" 
ON public.post_votes 
FOR DELETE 
USING (auth.uid() = user_id);

-- Add vote score columns to topics and posts tables
ALTER TABLE public.topics ADD COLUMN vote_score INTEGER DEFAULT 0;
ALTER TABLE public.posts ADD COLUMN vote_score INTEGER DEFAULT 0;

-- Function to calculate and update topic vote scores
CREATE OR REPLACE FUNCTION public.update_topic_vote_score()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE topics 
  SET vote_score = (
    SELECT COALESCE(SUM(vote_type), 0) 
    FROM topic_votes 
    WHERE topic_id = COALESCE(NEW.topic_id, OLD.topic_id)
  )
  WHERE id = COALESCE(NEW.topic_id, OLD.topic_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Function to calculate and update post vote scores
CREATE OR REPLACE FUNCTION public.update_post_vote_score()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE posts 
  SET vote_score = (
    SELECT COALESCE(SUM(vote_type), 0) 
    FROM post_votes 
    WHERE post_id = COALESCE(NEW.post_id, OLD.post_id)
  )
  WHERE id = COALESCE(NEW.post_id, OLD.post_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Triggers to update vote scores
CREATE TRIGGER update_topic_vote_score_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.topic_votes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_topic_vote_score();

CREATE TRIGGER update_post_vote_score_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.post_votes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_post_vote_score();

-- Function to get topics with vote data (Reddit-style hot algorithm)
CREATE OR REPLACE FUNCTION public.get_hot_topics(limit_count INTEGER DEFAULT 25)
RETURNS TABLE(
  id UUID,
  title TEXT,
  content TEXT,
  author_id UUID,
  category_id UUID,
  is_pinned BOOLEAN,
  is_locked BOOLEAN,
  view_count INTEGER,
  reply_count INTEGER,
  vote_score INTEGER,
  last_reply_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE,
  is_anonymous BOOLEAN,
  username TEXT,
  avatar_url TEXT,
  category_name TEXT,
  category_color TEXT,
  hot_score NUMERIC
) LANGUAGE plpgsql AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.id,
    t.title,
    t.content,
    t.author_id,
    t.category_id,
    t.is_pinned,
    t.is_locked,
    t.view_count,
    t.reply_count,
    t.vote_score,
    t.last_reply_at,
    t.created_at,
    t.updated_at,
    t.is_anonymous,
    p.username,
    p.avatar_url,
    c.name as category_name,
    c.color as category_color,
    -- Simple hot score algorithm: (upvotes - downvotes) / hours_since_created
    CASE 
      WHEN EXTRACT(EPOCH FROM (now() - t.created_at)) / 3600 = 0 THEN t.vote_score::NUMERIC
      ELSE t.vote_score::NUMERIC / (EXTRACT(EPOCH FROM (now() - t.created_at)) / 3600 + 2)
    END as hot_score
  FROM topics t
  LEFT JOIN profiles p ON t.author_id = p.id
  LEFT JOIN categories c ON t.category_id = c.id
  ORDER BY 
    t.is_pinned DESC,
    hot_score DESC,
    t.created_at DESC
  LIMIT limit_count;
END;
$$;