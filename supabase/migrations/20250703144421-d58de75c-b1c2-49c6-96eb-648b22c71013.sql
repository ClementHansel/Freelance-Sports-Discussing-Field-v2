
-- Create a function to increment reply count for topics
CREATE OR REPLACE FUNCTION increment_reply_count(topic_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE topics 
  SET reply_count = reply_count + 1 
  WHERE id = topic_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
