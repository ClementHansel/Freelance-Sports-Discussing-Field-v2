-- Create function to update topic's last_reply_at field
CREATE OR REPLACE FUNCTION update_topic_last_reply(topic_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE topics 
  SET last_reply_at = now()
  WHERE id = topic_id;
END;
$$;