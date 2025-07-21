
-- Function to reverse text content for fixing backwards text
CREATE OR REPLACE FUNCTION reverse_text_content(input_text TEXT)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
BEGIN
  -- Simple text reversal function
  RETURN reverse(input_text);
END;
$$;

-- Function to identify and fix backwards posts
CREATE OR REPLACE FUNCTION fix_backwards_posts()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update posts with backwards content
  -- This is a manual process - you'll need to identify specific posts
  -- For now, this creates the infrastructure to fix them
  
  -- Example usage (commented out - uncomment and modify as needed):
  -- UPDATE posts SET content = reverse_text_content(content) WHERE id = 'specific-post-id';
  -- UPDATE topics SET content = reverse_text_content(content) WHERE id = 'specific-topic-id';
  
  RAISE NOTICE 'Functions created for fixing backwards text. Use reverse_text_content() to fix specific posts.';
END;
$$;

-- Run the function to create the infrastructure
SELECT fix_backwards_posts();
