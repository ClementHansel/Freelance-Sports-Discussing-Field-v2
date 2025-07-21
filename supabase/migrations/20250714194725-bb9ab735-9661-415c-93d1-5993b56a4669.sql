-- Update Teams and Associations color to match other USA categories
UPDATE public.categories 
SET color = '#FF0000' 
WHERE slug = 'teams-and-associations' AND parent_category_id = '22222222-2222-2222-2222-222222222222';