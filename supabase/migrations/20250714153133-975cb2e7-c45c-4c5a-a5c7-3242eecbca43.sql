-- Add new category "Teams & associations" under Youth Hockey Canada Talk
INSERT INTO public.categories (
  name,
  slug,
  description,
  color,
  level,
  parent_category_id,
  sort_order,
  is_active
) VALUES (
  'Teams & associations',
  'teams-associations',
  'Discussions about youth hockey teams, associations, leagues, and organizations across Canada',
  '#10b981',
  2,
  '11111111-1111-1111-1111-111111111111',
  10,
  true
);