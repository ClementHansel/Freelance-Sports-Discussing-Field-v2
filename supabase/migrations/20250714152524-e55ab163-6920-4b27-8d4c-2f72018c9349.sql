-- Create function to get most commented topics (sorted by reply_count)
CREATE OR REPLACE FUNCTION public.get_most_commented_topics(limit_count integer DEFAULT 25, offset_count integer DEFAULT 0)
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
  last_post_id uuid,
  parent_category_id uuid,
  parent_category_slug text
)
LANGUAGE plpgsql
SECURITY DEFINER
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
    -- Get the most recent post ID for this topic
    (
      SELECT posts.id 
      FROM posts 
      WHERE posts.topic_id = t.id 
        AND posts.moderation_status = 'approved'
      ORDER BY posts.created_at DESC 
      LIMIT 1
    ) as last_post_id,
    -- Include parent category information
    c.parent_category_id,
    pc.slug as parent_category_slug
  FROM topics t
  LEFT JOIN profiles p ON t.author_id = p.id
  LEFT JOIN temporary_users tu ON t.author_id = tu.id
  LEFT JOIN categories c ON t.category_id = c.id
  LEFT JOIN categories pc ON c.parent_category_id = pc.id
  WHERE t.moderation_status = 'approved'
  ORDER BY t.reply_count DESC, t.created_at DESC
  LIMIT limit_count
  OFFSET offset_count;
END;
$function$;

-- Create function to get most viewed topics (sorted by view_count)
CREATE OR REPLACE FUNCTION public.get_most_viewed_topics(limit_count integer DEFAULT 25, offset_count integer DEFAULT 0)
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
  last_post_id uuid,
  parent_category_id uuid,
  parent_category_slug text
)
LANGUAGE plpgsql
SECURITY DEFINER
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
    -- Get the most recent post ID for this topic
    (
      SELECT posts.id 
      FROM posts 
      WHERE posts.topic_id = t.id 
        AND posts.moderation_status = 'approved'
      ORDER BY posts.created_at DESC 
      LIMIT 1
    ) as last_post_id,
    -- Include parent category information
    c.parent_category_id,
    pc.slug as parent_category_slug
  FROM topics t
  LEFT JOIN profiles p ON t.author_id = p.id
  LEFT JOIN temporary_users tu ON t.author_id = tu.id
  LEFT JOIN categories c ON t.category_id = c.id
  LEFT JOIN categories pc ON c.parent_category_id = pc.id
  WHERE t.moderation_status = 'approved'
  ORDER BY t.view_count DESC, t.created_at DESC
  LIMIT limit_count
  OFFSET offset_count;
END;
$function$;

-- Create count functions for pagination
CREATE OR REPLACE FUNCTION public.get_most_commented_topics_count()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  RETURN (
    SELECT COUNT(*)::integer
    FROM topics t
    WHERE t.moderation_status = 'approved'
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_most_viewed_topics_count()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  RETURN (
    SELECT COUNT(*)::integer
    FROM topics t
    WHERE t.moderation_status = 'approved'
  );
END;
$function$;