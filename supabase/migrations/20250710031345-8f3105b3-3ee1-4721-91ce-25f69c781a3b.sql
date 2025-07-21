-- Update level 2 categories (tournaments and general) to not require moderation
UPDATE public.categories 
SET requires_moderation = false 
WHERE level = 2;

-- Update "General Youth Hockey Talk" category to not require moderation
UPDATE public.categories 
SET requires_moderation = false 
WHERE name = 'General Youth Hockey Talk';