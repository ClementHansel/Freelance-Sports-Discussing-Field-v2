-- Create function to get categories sorted by most recent activity
CREATE OR REPLACE FUNCTION get_categories_by_activity(
  p_parent_category_id uuid DEFAULT NULL,
  p_category_level integer DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  name text,
  description text,
  slug text,
  color text,
  sort_order integer,
  is_active boolean,
  created_at timestamp with time zone,
  parent_category_id uuid,
  level integer,
  region text,
  birth_year integer,
  play_level text,
  last_activity_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH category_activity AS (
    -- Get the most recent activity for each category
    SELECT 
      c.id as category_id,
      GREATEST(
        COALESCE(MAX(t.last_reply_at), '1970-01-01'::timestamp with time zone),
        COALESCE(MAX(t.created_at), '1970-01-01'::timestamp with time zone)
      ) as last_activity
    FROM categories c
    LEFT JOIN topics t ON t.category_id = c.id
    WHERE c.is_active = true
      AND (p_parent_category_id IS NULL OR c.parent_category_id = p_parent_category_id)
      AND (p_category_level IS NULL OR c.level = p_category_level)
    GROUP BY c.id
  )
  SELECT 
    c.id,
    c.name,
    c.description,
    c.slug,
    c.color,
    c.sort_order,
    c.is_active,
    c.created_at,
    c.parent_category_id,
    c.level,
    c.region,
    c.birth_year,
    c.play_level,
    CASE 
      WHEN ca.last_activity = '1970-01-01'::timestamp with time zone 
      THEN NULL 
      ELSE ca.last_activity 
    END as last_activity_at
  FROM categories c
  LEFT JOIN category_activity ca ON c.id = ca.category_id
  WHERE c.is_active = true
    AND (p_parent_category_id IS NULL OR c.parent_category_id = p_parent_category_id)
    AND (p_category_level IS NULL OR c.level = p_category_level)
  ORDER BY 
    CASE 
      WHEN ca.last_activity = '1970-01-01'::timestamp with time zone 
      THEN c.created_at 
      ELSE ca.last_activity 
    END DESC NULLS LAST,
    c.name ASC;
END;
$$;