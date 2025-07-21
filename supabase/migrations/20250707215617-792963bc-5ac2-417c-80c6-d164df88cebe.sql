-- Fix the unique constraint issue for anonymous voting
-- The current constraint only works if anonymous_session_id is not null
-- We need to handle the case where users vote, then change their vote

-- First, let's manually trigger the vote score update for all topics
UPDATE topics SET vote_score = (
  SELECT COALESCE(SUM(vote_type), 0) 
  FROM topic_votes 
  WHERE topic_id = topics.id
);

-- Update posts too
UPDATE posts SET vote_score = (
  SELECT COALESCE(SUM(vote_type), 0) 
  FROM post_votes 
  WHERE post_id = posts.id
);