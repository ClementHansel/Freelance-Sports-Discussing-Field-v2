-- Move the "First Post" topic to the new Level 2 category
UPDATE public.topics 
SET category_id = (SELECT id FROM categories WHERE slug = 'discuss-site-issues')
WHERE slug = 'first-post-go-back-to-the-old-site--mcv3cvfm';