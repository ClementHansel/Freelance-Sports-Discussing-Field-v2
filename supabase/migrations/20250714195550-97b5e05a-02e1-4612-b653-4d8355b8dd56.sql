-- Update Teams and Associations color to match other USA categories (blue)
UPDATE public.categories 
SET color = '#3b82f6' 
WHERE slug = 'teams-and-associations' AND parent_category_id = '22222222-2222-2222-2222-222222222222';