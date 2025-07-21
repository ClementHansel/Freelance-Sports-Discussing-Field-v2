-- Update get_hot_topics function to support pagination
CREATE OR REPLACE FUNCTION public.get_hot_topics(
  limit_count integer DEFAULT 25,
  offset_count integer DEFAULT 0
)
RETURNS TABLE(
  id uuid, 
  title text, 
  content text, 
  author_id uuid, 
  category_id uuid, 
  is_pinned boolean, 
  is_locked boolean, 
  view_count integer, 
  reply_count integer, 
  last_reply_at timestamp with time zone, 
  created_at timestamp with time zone, 
  updated_at timestamp with time zone, 
  username text, 
  avatar_url text, 
  category_name text, 
  category_color text, 
  category_slug text, 
  slug text, 
  hot_score numeric, 
  last_post_id uuid
)
LANGUAGE plpgsql
AS $function$
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
    t.last_reply_at,
    t.created_at,
    t.updated_at,
    COALESCE(p.username, tu.display_name) as username,
    p.avatar_url,
    c.name as category_name,
    c.color as category_color,
    c.slug as category_slug,
    t.slug,
    -- Hot score calculation: prioritize reply count (comments) and recency
    (
      COALESCE(t.reply_count, 0) * 10 +
      -- Boost recent topics (decay factor based on hours since creation)
      GREATEST(0, 100 - EXTRACT(EPOCH FROM (NOW() - t.created_at)) / 3600)
    )::numeric as hot_score,
    -- Get the most recent post ID for this topic
    (
      SELECT posts.id 
      FROM posts 
      WHERE posts.topic_id = t.id 
        AND posts.moderation_status = 'approved'
      ORDER BY posts.created_at DESC 
      LIMIT 1
    ) as last_post_id
  FROM topics t
  LEFT JOIN profiles p ON t.author_id = p.id
  LEFT JOIN temporary_users tu ON t.author_id = tu.id
  LEFT JOIN categories c ON t.category_id = c.id
  WHERE t.created_at >= NOW() - INTERVAL '7 days'  -- Only consider topics from last 7 days
    AND t.moderation_status = 'approved'  -- Only show approved topics
  ORDER BY hot_score DESC, t.created_at DESC
  LIMIT limit_count
  OFFSET offset_count;
END;
$function$;

-- Create function to count total hot topics
CREATE OR REPLACE FUNCTION public.get_hot_topics_count()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  RETURN (
    SELECT COUNT(*)::integer
    FROM topics t
    WHERE t.created_at >= NOW() - INTERVAL '7 days'
      AND t.moderation_status = 'approved'
  );
END;
$function$;

-- Create function to count total topics with optional category filter
CREATE OR REPLACE FUNCTION public.get_topics_total_count(p_category_id uuid DEFAULT NULL)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  IF p_category_id IS NULL THEN
    RETURN (
      SELECT COUNT(*)::integer
      FROM topics 
      WHERE moderation_status = 'approved'
    );
  ELSE
    RETURN (
      SELECT COUNT(*)::integer
      FROM topics 
      WHERE category_id = p_category_id 
      AND moderation_status = 'approved'
    );
  END IF;
END;
$function$;