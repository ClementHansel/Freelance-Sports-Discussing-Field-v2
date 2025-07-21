-- Create a Level 2 category for site discussions
INSERT INTO public.categories (
  name,
  slug,
  description,
  level,
  parent_category_id,
  color,
  sort_order,
  is_active
) VALUES (
  'Discuss the site and issues',
  'discuss-site-issues',
  'Discussion about the website, technical issues, suggestions, and feedback',
  2,
  (SELECT id FROM categories WHERE slug = 'important-hockey-forum'),
  '#8b5cf6',
  1,
  true
);