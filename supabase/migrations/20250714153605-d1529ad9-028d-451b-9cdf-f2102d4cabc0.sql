-- Fix color of Teams & associations to match other level 2 categories under Youth Hockey Canada Talk
UPDATE public.categories 
SET color = '#FF0000' 
WHERE slug = 'teams-associations' AND parent_category_id = '11111111-1111-1111-1111-111111111111';