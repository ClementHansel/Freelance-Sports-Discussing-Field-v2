-- Create function to sync reply counts with actual approved post counts
CREATE OR REPLACE FUNCTION sync_topic_reply_counts()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update reply_count to match actual approved posts count
  UPDATE topics 
  SET reply_count = (
    SELECT COUNT(*) 
    FROM posts 
    WHERE posts.topic_id = topics.id 
    AND posts.moderation_status = 'approved'
  );
  
  -- Log the operation
  RAISE NOTICE 'Updated reply counts for all topics to match approved posts';
END;
$$;

-- Run the function to fix existing data
SELECT sync_topic_reply_counts();

-- Update the increment_reply_count function to only count approved posts
CREATE OR REPLACE FUNCTION increment_reply_count(topic_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE topics 
  SET reply_count = (
    SELECT COUNT(*) 
    FROM posts 
    WHERE posts.topic_id = increment_reply_count.topic_id 
    AND posts.moderation_status = 'approved'
  )
  WHERE id = topic_id;
END;
$$;