-- Add NOT NULL constraints for IP addresses on new content
-- First, update any existing NULL IP addresses to a placeholder value
UPDATE topics SET ip_address = '0.0.0.0' WHERE ip_address IS NULL;
UPDATE posts SET ip_address = '0.0.0.0' WHERE ip_address IS NULL;

-- Add NOT NULL constraint to ensure all future topics have IP addresses
ALTER TABLE topics ALTER COLUMN ip_address SET NOT NULL;
ALTER TABLE posts ALTER COLUMN ip_address SET NOT NULL;

-- Add check constraints to prevent placeholder IPs in new records
ALTER TABLE topics ADD CONSTRAINT topics_ip_not_placeholder 
CHECK (ip_address != '0.0.0.0' OR created_at < '2025-07-14'::date);

ALTER TABLE posts ADD CONSTRAINT posts_ip_not_placeholder 
CHECK (ip_address != '0.0.0.0' OR created_at < '2025-07-14'::date);

-- Create index for better IP-based queries
CREATE INDEX IF NOT EXISTS idx_topics_ip_address ON topics(ip_address);
CREATE INDEX IF NOT EXISTS idx_posts_ip_address ON posts(ip_address);

-- Add function to validate IP addresses before insert
CREATE OR REPLACE FUNCTION validate_ip_address()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.ip_address IS NULL OR NEW.ip_address = '0.0.0.0' THEN
    RAISE EXCEPTION 'IP address is required for all new content. Please check your network connection.';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers to validate IP addresses on insert
DROP TRIGGER IF EXISTS validate_topic_ip ON topics;
CREATE TRIGGER validate_topic_ip
  BEFORE INSERT ON topics
  FOR EACH ROW
  EXECUTE FUNCTION validate_ip_address();

DROP TRIGGER IF EXISTS validate_post_ip ON posts;
CREATE TRIGGER validate_post_ip
  BEFORE INSERT ON posts
  FOR EACH ROW
  EXECUTE FUNCTION validate_ip_address();