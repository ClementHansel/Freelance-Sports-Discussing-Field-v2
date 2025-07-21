
-- Remove the test topic "Brick hockey 2025"
DELETE FROM posts WHERE topic_id = 'b9074457-edd8-4aa7-91a0-1b673468ddc1';
DELETE FROM topics WHERE id = 'b9074457-edd8-4aa7-91a0-1b673468ddc1';

-- Create functions for efficient forum statistics
CREATE OR REPLACE FUNCTION get_forum_stats()
RETURNS TABLE (
  total_topics bigint,
  total_posts bigint,
  total_members bigint
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    (SELECT COUNT(*) FROM topics) as total_topics,
    (SELECT COUNT(*) FROM posts) as total_posts,
    (SELECT COUNT(*) FROM profiles) as total_members;
END;
$$;

-- Create function to get category statistics
CREATE OR REPLACE FUNCTION get_category_stats(category_id uuid)
RETURNS TABLE (
  topic_count bigint,
  post_count bigint
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH RECURSIVE category_tree AS (
    -- Base case: the category itself
    SELECT id FROM categories WHERE id = category_id
    UNION ALL
    -- Recursive case: all subcategories
    SELECT c.id 
    FROM categories c
    INNER JOIN category_tree ct ON c.parent_category_id = ct.id
  )
  SELECT 
    (SELECT COUNT(*) FROM topics t WHERE t.category_id IN (SELECT id FROM category_tree)) as topic_count,
    (SELECT COUNT(*) FROM posts p 
     INNER JOIN topics t ON p.topic_id = t.id 
     WHERE t.category_id IN (SELECT id FROM category_tree)) as post_count;
END;
$$;
