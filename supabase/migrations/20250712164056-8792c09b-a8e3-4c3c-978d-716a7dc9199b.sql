-- First, delete the topic I just created
DELETE FROM public.topics 
WHERE slug = 'general-minor-hockey-talk-usa' 
AND title = 'General Minor Hockey Talk USA';

-- Now create it as a level 2 category
INSERT INTO public.categories (
  name,
  description,
  slug,
  parent_category_id,
  level,
  color,
  sort_order,
  is_active
) VALUES (
  'General Minor Hockey Talk USA',
  'General discussion area for minor hockey in the USA - share experiences, ask questions, and connect with other American hockey families',
  'general-minor-hockey-talk-usa',
  '22222222-2222-2222-2222-222222222222',
  2,
  '#3b82f6',
  1,
  true
);