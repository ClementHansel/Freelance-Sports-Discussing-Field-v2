-- Add Teams and Associations category under Youth Hockey USA Talk
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
  'Teams and Associations',
  'Discussion about hockey teams, associations, leagues, and organizations in the USA',
  'teams-and-associations',
  '22222222-2222-2222-2222-222222222222',
  2,
  '#10b981',
  2,
  true
);