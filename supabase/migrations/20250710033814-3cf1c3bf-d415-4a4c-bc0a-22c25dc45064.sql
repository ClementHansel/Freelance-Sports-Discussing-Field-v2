-- Update category slugs to be more SEO-friendly with "youth hockey forum" terminology

-- Update Canadian provincial forums (level 2 categories under Canada parent)
UPDATE public.categories 
SET slug = CASE 
  WHEN region = 'Ontario' THEN 'ontario-youth-hockey-forum'
  WHEN region = 'Alberta' THEN 'alberta-youth-hockey-forum'
  WHEN region = 'British Columbia' THEN 'british-columbia-youth-hockey-forum'
  WHEN region = 'Quebec' THEN 'quebec-youth-hockey-forum'
  WHEN region = 'Saskatchewan' THEN 'saskatchewan-youth-hockey-forum'
  WHEN region = 'Manitoba' THEN 'manitoba-youth-hockey-forum'
  WHEN region = 'Nova Scotia' THEN 'nova-scotia-youth-hockey-forum'
  WHEN region = 'New Brunswick' THEN 'new-brunswick-youth-hockey-forum'
  WHEN region = 'Newfoundland and Labrador' THEN 'newfoundland-labrador-youth-hockey-forum'
  WHEN region = 'Prince Edward Island' THEN 'prince-edward-island-youth-hockey-forum'
  WHEN region = 'Northwest Territories' THEN 'northwest-territories-youth-hockey-forum'
  WHEN region = 'Nunavut' THEN 'nunavut-youth-hockey-forum'
  WHEN region = 'Yukon' THEN 'yukon-youth-hockey-forum'
  ELSE slug
END
WHERE parent_category_id = '11111111-1111-1111-1111-111111111111' 
  AND level = 2;

-- Update US state forums (level 2 categories under USA parent)
UPDATE public.categories 
SET slug = CASE 
  WHEN region = 'California' THEN 'california-youth-hockey-forum'
  WHEN region = 'New York' THEN 'new-york-youth-hockey-forum'
  WHEN region = 'Massachusetts' THEN 'massachusetts-youth-hockey-forum'
  WHEN region = 'Michigan' THEN 'michigan-youth-hockey-forum'
  WHEN region = 'Minnesota' THEN 'minnesota-youth-hockey-forum'
  WHEN region = 'Illinois' THEN 'illinois-youth-hockey-forum'
  WHEN region = 'Pennsylvania' THEN 'pennsylvania-youth-hockey-forum'
  WHEN region = 'Colorado' THEN 'colorado-youth-hockey-forum'
  WHEN region = 'Connecticut' THEN 'connecticut-youth-hockey-forum'
  WHEN region = 'New Jersey' THEN 'new-jersey-youth-hockey-forum'
  WHEN region = 'Wisconsin' THEN 'wisconsin-youth-hockey-forum'
  WHEN region = 'Ohio' THEN 'ohio-youth-hockey-forum'
  WHEN region = 'Alaska' THEN 'alaska-youth-hockey-forum'
  WHEN region = 'New Hampshire' THEN 'new-hampshire-youth-hockey-forum'
  WHEN region = 'Vermont' THEN 'vermont-youth-hockey-forum'
  WHEN region = 'Maine' THEN 'maine-youth-hockey-forum'
  WHEN region = 'Rhode Island' THEN 'rhode-island-youth-hockey-forum'
  WHEN region = 'North Dakota' THEN 'north-dakota-youth-hockey-forum'
  WHEN region = 'Montana' THEN 'montana-youth-hockey-forum'
  WHEN region = 'Washington' THEN 'washington-youth-hockey-forum'
  ELSE slug
END
WHERE parent_category_id = '22222222-2222-2222-2222-222222222222' 
  AND level = 2;

-- Update tournament categories (level 2 categories under Europe/Tournaments parent)
UPDATE public.categories 
SET slug = CASE 
  WHEN name LIKE '%Tournament%' AND name LIKE '%Canada%' THEN 'canada-youth-hockey-tournaments'
  WHEN name LIKE '%Tournament%' AND name LIKE '%USA%' THEN 'usa-youth-hockey-tournaments'
  WHEN name LIKE '%Spring%' AND name LIKE '%Summer%' AND name LIKE '%Canada%' THEN 'canada-spring-summer-youth-hockey-tournaments'
  WHEN name LIKE '%Spring%' AND name LIKE '%Summer%' AND name LIKE '%USA%' THEN 'usa-spring-summer-youth-hockey-tournaments'
  WHEN name LIKE '%Fall%' AND name LIKE '%Winter%' AND name LIKE '%Canada%' THEN 'canada-fall-winter-youth-hockey-tournaments'
  WHEN name LIKE '%Fall%' AND name LIKE '%Winter%' AND name LIKE '%USA%' THEN 'usa-fall-winter-youth-hockey-tournaments'
  WHEN name LIKE '%Equipment%' THEN 'youth-hockey-equipment-forum'
  WHEN name LIKE '%Training%' THEN 'youth-hockey-training-forum'
  WHEN name LIKE '%Coaching%' THEN 'youth-hockey-coaching-forum'
  WHEN name LIKE '%General%' AND name LIKE '%Discussion%' THEN 'general-youth-hockey-discussion'
  ELSE slug
END
WHERE parent_category_id = '33333333-3333-3333-3333-333333333333' 
  AND level = 2;

-- Update any remaining generic category names to be more SEO-friendly
UPDATE public.categories 
SET slug = CASE 
  WHEN slug = 'equipment' THEN 'youth-hockey-equipment-forum'
  WHEN slug = 'training' THEN 'youth-hockey-training-forum'  
  WHEN slug = 'coaching' THEN 'youth-hockey-coaching-forum'
  WHEN slug = 'general' THEN 'general-youth-hockey-discussion'
  WHEN slug = 'tournaments' THEN 'youth-hockey-tournaments'
  ELSE slug
END
WHERE level >= 2;

-- Update level 3 categories (age/skill based) to include context
UPDATE public.categories 
SET slug = CASE 
  WHEN birth_year IS NOT NULL AND region IS NOT NULL THEN 
    lower(regexp_replace(region, '[^a-zA-Z0-9\s-]', '', 'g')) || '-' || 
    birth_year::text || '-youth-hockey-forum'
  WHEN play_level IS NOT NULL AND region IS NOT NULL THEN 
    lower(regexp_replace(region, '[^a-zA-Z0-9\s-]', '', 'g')) || '-' || 
    lower(regexp_replace(play_level, '[^a-zA-Z0-9\s-]', '', 'g')) || '-youth-hockey-forum'
  ELSE slug
END
WHERE level = 3 
  AND (birth_year IS NOT NULL OR play_level IS NOT NULL);