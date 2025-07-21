-- Add slug field to topics table
ALTER TABLE public.topics ADD COLUMN slug text;

-- Update level 1 category slugs to include "hockey forum"
UPDATE public.categories 
SET slug = CASE 
  WHEN name = 'Important' THEN 'important-hockey-forum'
  WHEN slug = 'canada' THEN 'canada-youth-hockey-forum'
  WHEN slug = 'usa' THEN 'usa-youth-hockey-forum'
  WHEN slug = 'europe' THEN 'europe-youth-hockey-forum'
  WHEN slug = 'other-regions' THEN 'international-hockey-forum'
  ELSE slug || '-hockey-forum'
END
WHERE level = 1;

-- Create function to generate slug from title
CREATE OR REPLACE FUNCTION public.generate_slug(input_text text)
RETURNS text
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN lower(
    regexp_replace(
      regexp_replace(
        regexp_replace(trim(input_text), '[^a-zA-Z0-9\s-]', '', 'g'),
        '\s+', '-', 'g'
      ),
      '-+', '-', 'g'
    )
  );
END;
$$;

-- Generate slugs for existing topics
UPDATE public.topics 
SET slug = generate_slug(title) || '-' || substring(id::text, 1, 8)
WHERE slug IS NULL;

-- Make slug required for future topics
ALTER TABLE public.topics ALTER COLUMN slug SET NOT NULL;

-- Add unique constraint to topic slugs
ALTER TABLE public.topics ADD CONSTRAINT topics_slug_unique UNIQUE (slug);