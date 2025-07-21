
-- Create an increment function for general use
CREATE OR REPLACE FUNCTION increment(x integer)
RETURNS integer AS $$
BEGIN
  RETURN x + 1;
END;
$$ LANGUAGE plpgsql;

-- Create a function to increment view count for topics
CREATE OR REPLACE FUNCTION increment_view_count(topic_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE topics 
  SET view_count = view_count + 1 
  WHERE id = topic_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
