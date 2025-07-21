-- Drop and recreate the get_hot_topics function to fix the missing column issue
DROP FUNCTION IF EXISTS public.get_hot_topics(integer);

CREATE OR REPLACE FUNCTION public.get_hot_topics(limit_count integer DEFAULT 25)
RETURNS TABLE (
  id uuid,
  title text,
  content text,
  author_id uuid,
  category_id uuid,
  is_pinned boolean,
  is_locked boolean,
  view_count integer,
  reply_count integer,
  vote_score integer,
  last_reply_at timestamp with time zone,
  created_at timestamp with time zone,
  updated_at timestamp with time zone,
  username text,
  avatar_url text,
  category_name text,
  category_color text,
  category_slug text,
  hot_score numeric
)
LANGUAGE plpgsql
AS $$
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
    COALESCE(p.username, tu.display_name) as username,
    p.avatar_url,
    c.name as category_name,
    c.color as category_color,
    c.slug as category_slug,
    -- Hot score calculation: combination of votes, replies, views, and recency
    (
      COALESCE(t.vote_score, 0) * 10 +
      COALESCE(t.reply_count, 0) * 5 +
      COALESCE(t.view_count, 0) * 0.1 +
      -- Boost recent topics (decay factor based on hours since creation)
      GREATEST(0, 100 - EXTRACT(EPOCH FROM (NOW() - t.created_at)) / 3600)
    )::numeric as hot_score
  FROM topics t
  LEFT JOIN profiles p ON t.author_id = p.id
  LEFT JOIN temporary_users tu ON t.author_id = tu.id
  LEFT JOIN categories c ON t.category_id = c.id
  WHERE t.created_at >= NOW() - INTERVAL '7 days'  -- Only consider topics from last 7 days
  ORDER BY hot_score DESC, t.created_at DESC
  LIMIT limit_count;
END;
$$;