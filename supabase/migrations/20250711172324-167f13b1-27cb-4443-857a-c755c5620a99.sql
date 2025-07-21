-- Drop and recreate get_enriched_posts function to include IP addresses for admins
DROP FUNCTION IF EXISTS public.get_enriched_posts(uuid, integer, integer);

CREATE OR REPLACE FUNCTION public.get_enriched_posts(p_topic_id uuid, p_limit integer DEFAULT 20, p_offset integer DEFAULT 0)
 RETURNS TABLE(id uuid, content text, author_id uuid, topic_id uuid, parent_post_id uuid, created_at timestamp with time zone, updated_at timestamp with time zone, moderation_status text, ip_address inet, is_anonymous boolean, author_username text, author_avatar_url text, parent_post_content text, parent_post_author_username text, parent_post_author_avatar_url text, parent_post_created_at timestamp with time zone, parent_post_moderation_status text)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  RETURN QUERY
  WITH post_data AS (
    SELECT 
      p.id, p.content, p.author_id, p.topic_id, p.parent_post_id,
      p.created_at, p.updated_at, p.moderation_status, p.ip_address, p.is_anonymous
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
    -- Only return IP address if user is admin, otherwise null
    CASE 
      WHEN has_role(auth.uid(), 'admin'::user_role) THEN pd.ip_address
      ELSE NULL
    END as ip_address,
    pd.is_anonymous,
    -- Author information
    COALESCE(pr.username, tu.display_name) as author_username,
    pr.avatar_url as author_avatar_url,
    -- Parent post information
    pp.content as parent_post_content,
    COALESCE(ppr.username, ptu.display_name) as parent_post_author_username,
    ppr.avatar_url as parent_post_author_avatar_url,
    pp.created_at as parent_post_created_at,
    pp.moderation_status as parent_post_moderation_status
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
$function$;