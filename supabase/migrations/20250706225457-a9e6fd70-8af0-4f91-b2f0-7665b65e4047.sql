-- Add a new "Important" forum under Main Forums
INSERT INTO public.categories (
  name,
  slug,
  description,
  color,
  level,
  sort_order,
  is_active
) VALUES (
  'Important',
  'important',
  'Important announcements and discussions that everyone should see',
  '#dc2626',
  1,
  0,
  true
);