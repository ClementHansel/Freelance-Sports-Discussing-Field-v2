-- Create the new topic "General Minor Hockey Talk USA"
INSERT INTO public.topics (
  title,
  content,
  category_id,
  slug,
  author_id,
  moderation_status
) VALUES (
  'General Minor Hockey Talk USA',
  'Welcome to the general discussion area for minor hockey in the USA! Share your experiences, ask questions, and connect with other hockey families across America.

This is the place to discuss:
- Youth hockey experiences across different states
- Travel hockey vs. house league discussions
- Equipment recommendations and reviews
- Tournament experiences and recommendations
- Coaching tips and strategies
- Parent perspectives on minor hockey
- College hockey pathways
- And any other general hockey topics!

Please keep discussions respectful and constructive. Let''s build a supportive community for American hockey families!',
  '22222222-2222-2222-2222-222222222222',
  'general-minor-hockey-talk-usa',
  NULL,
  'approved'
);