-- Performance Optimization: Create enriched data functions to eliminate N+1 queries

-- Function to get enriched topics with all related data in a single call
-- This eliminates the N+1 query problem in useTopics hook
CREATE OR REPLACE FUNCTION public.get_enriched_topics(
  p_category_id UUID DEFAULT NULL,
  p_limit INTEGER DEFAULT 10,
  p_offset INTEGER DEFAULT 0
)
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
  last_reply_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE,
  slug TEXT,
  moderation_status TEXT,
  last_post_id UUID,
  author_username TEXT,
  author_avatar_url TEXT,
  category_name TEXT,
  category_color TEXT,
  category_slug TEXT,
  parent_category_id UUID
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH topic_data AS (
    SELECT 
      t.id, t.title, t.content, t.author_id, t.category_id,
      t.is_pinned, t.is_locked, t.view_count, t.reply_count,
      t.last_reply_at, t.created_at, t.updated_at, t.slug, t.moderation_status,
      c.name as category_name, c.color as category_color, 
      c.slug as category_slug, c.parent_category_id
    FROM topics t
    LEFT JOIN categories c ON t.category_id = c.id
    WHERE t.moderation_status = 'approved'
      AND (p_category_id IS NULL OR t.category_id = p_category_id)
    ORDER BY t.is_pinned DESC, t.last_reply_at DESC
    LIMIT p_limit OFFSET p_offset
  ),
  last_posts AS (
    SELECT DISTINCT ON (td.id)
      td.id as topic_id,
      p.id as last_post_id
    FROM topic_data td
    LEFT JOIN posts p ON p.topic_id = td.id 
      AND p.moderation_status = 'approved'
    ORDER BY td.id, p.created_at DESC
  )
  SELECT 
    td.id,
    td.title,
    td.content,
    td.author_id,
    td.category_id,
    td.is_pinned,
    td.is_locked,
    td.view_count,
    td.reply_count,
    td.last_reply_at,
    td.created_at,
    td.updated_at,
    td.slug,
    td.moderation_status,
    lp.last_post_id,
    COALESCE(pr.username, tu.display_name) as author_username,
    pr.avatar_url as author_avatar_url,
    td.category_name,
    td.category_color,
    td.category_slug,
    td.parent_category_id
  FROM topic_data td
  LEFT JOIN last_posts lp ON td.id = lp.topic_id
  LEFT JOIN profiles pr ON td.author_id = pr.id
  LEFT JOIN temporary_users tu ON td.author_id = tu.id
  ORDER BY td.is_pinned DESC, td.last_reply_at DESC;
END;
$$;

-- Function to get enriched posts with all related data in a single call
-- This eliminates the N+1 query problem in usePosts hook
CREATE OR REPLACE FUNCTION public.get_enriched_posts(
  p_topic_id UUID,
  p_limit INTEGER DEFAULT 20,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE(
  id UUID,
  content TEXT,
  author_id UUID,
  topic_id UUID,
  parent_post_id UUID,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE,
  moderation_status TEXT,
  author_username TEXT,
  author_avatar_url TEXT,
  parent_post_content TEXT,
  parent_post_author_username TEXT,
  parent_post_author_avatar_url TEXT,
  parent_post_created_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH post_data AS (
    SELECT 
      p.id, p.content, p.author_id, p.topic_id, p.parent_post_id,
      p.created_at, p.updated_at, p.moderation_status
    FROM posts p
    WHERE p.topic_id = p_topic_id
      AND p.moderation_status = 'approved'
    ORDER BY p.created_at ASC
    LIMIT p_limit OFFSET p_offset
  )
  SELECT 
    pd.id,
    pd.content,
    pd.author_id,
    pd.topic_id,
    pd.parent_post_id,
    pd.created_at,
    pd.updated_at,
    pd.moderation_status,
    -- Author information
    COALESCE(pr.username, tu.display_name) as author_username,
    pr.avatar_url as author_avatar_url,
    -- Parent post information
    pp.content as parent_post_content,
    COALESCE(ppr.username, ptu.display_name) as parent_post_author_username,
    ppr.avatar_url as parent_post_author_avatar_url,
    pp.created_at as parent_post_created_at
  FROM post_data pd
  -- Join author data
  LEFT JOIN profiles pr ON pd.author_id = pr.id
  LEFT JOIN temporary_users tu ON pd.author_id = tu.id
  -- Join parent post data
  LEFT JOIN posts pp ON pd.parent_post_id = pp.id
  LEFT JOIN profiles ppr ON pp.author_id = ppr.id
  LEFT JOIN temporary_users ptu ON pp.author_id = ptu.id
  ORDER BY pd.created_at ASC;
END;
$$;

-- Function to get total count for enriched topics (for pagination)
CREATE OR REPLACE FUNCTION public.get_enriched_topics_count(
  p_category_id UUID DEFAULT NULL
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)::INTEGER
    FROM topics t
    WHERE t.moderation_status = 'approved'
      AND (p_category_id IS NULL OR t.category_id = p_category_id)
  );
END;
$$;

-- Function to get total count for enriched posts (for pagination)  
CREATE OR REPLACE FUNCTION public.get_enriched_posts_count(
  p_topic_id UUID
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)::INTEGER
    FROM posts p
    WHERE p.topic_id = p_topic_id
      AND p.moderation_status = 'approved'
  );
END;
$$;