-- Add Equipment and Training categories under General Youth Hockey Talk
INSERT INTO public.categories (
  id,
  name,
  description,
  slug,
  color,
  parent_category_id,
  level,
  sort_order,
  is_active
) VALUES 
(
  'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
  'Equipment',
  'Discussion about hockey equipment, gear reviews, and recommendations',
  'equipment',
  '#9333EA',
  '33333333-3333-3333-3333-333333333333',
  2,
  1,
  true
),
(
  'tttttttt-tttt-tttt-tttt-tttttttttttt',
  'Training',
  'Training tips, drills, skill development, and coaching advice',
  'training',
  '#059669',
  '33333333-3333-3333-3333-333333333333',
  2,
  2,
  true
);