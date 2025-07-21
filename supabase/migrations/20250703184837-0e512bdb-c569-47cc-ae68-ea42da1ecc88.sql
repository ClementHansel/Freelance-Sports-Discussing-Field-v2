
-- Create function to get categories sorted by most recent activity
CREATE OR REPLACE FUNCTION get_categories_by_activity(
  parent_category_id uuid DEFAULT NULL,
  category_level integer DEFAULT NULL
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
  WITH RECURSIVE category_tree AS (
    -- Base case: get categories matching the criteria
    SELECT c.id, c.parent_category_id, c.level
    FROM categories c
    WHERE c.is_active = true
      AND (get_categories_by_activity.parent_category_id IS NULL OR c.parent_category_id = get_categories_by_activity.parent_category_id)
      AND (get_categories_by_activity.category_level IS NULL OR c.level = get_categories_by_activity.category_level)
    
    UNION ALL
    
    -- Recursive case: get all subcategories
    SELECT c.id, c.parent_category_id, c.level
    FROM categories c
    INNER JOIN category_tree ct ON c.parent_category_id = ct.id
    WHERE c.is_active = true
  ),
  category_activity AS (
    -- Get the most recent activity for each category and its subcategories
    SELECT 
      c.id as category_id,
      GREATEST(
        COALESCE(MAX(t.last_reply_at), '1970-01-01'::timestamp with time zone),
        COALESCE(MAX(t.created_at), '1970-01-01'::timestamp with time zone)
      ) as last_activity
    FROM categories c
    LEFT JOIN category_tree ct ON c.id = ct.id OR c.parent_category_id = ct.id
    LEFT JOIN topics t ON t.category_id = ct.id
    WHERE c.is_active = true
      AND (get_categories_by_activity.parent_category_id IS NULL OR c.parent_category_id = get_categories_by_activity.parent_category_id)
      AND (get_categories_by_activity.category_level IS NULL OR c.level = get_categories_by_activity.category_level)
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
    AND (get_categories_by_activity.parent_category_id IS NULL OR c.parent_category_id = get_categories_by_activity.parent_category_id)
    AND (get_categories_by_activity.category_level IS NULL OR c.level = get_categories_by_activity.category_level)
  ORDER BY 
    CASE 
      WHEN ca.last_activity = '1970-01-01'::timestamp with time zone 
      THEN c.created_at 
      ELSE ca.last_activity 
    END DESC NULLS LAST,
    c.name ASC;
END;
$$;
