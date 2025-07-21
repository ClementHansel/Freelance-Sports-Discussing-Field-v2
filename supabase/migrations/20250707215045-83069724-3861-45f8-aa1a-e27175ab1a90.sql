-- Fix the vote score triggers to work with anonymous votes
CREATE OR REPLACE FUNCTION public.update_topic_vote_score()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
  UPDATE topics 
  SET vote_score = (
    SELECT COALESCE(SUM(vote_type), 0) 
    FROM topic_votes 
    WHERE topic_id = COALESCE(NEW.topic_id, OLD.topic_id)
  )
  WHERE id = COALESCE(NEW.topic_id, OLD.topic_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_post_vote_score()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
  UPDATE posts 
  SET vote_score = (
    SELECT COALESCE(SUM(vote_type), 0) 
    FROM post_votes 
    WHERE post_id = COALESCE(NEW.post_id, OLD.post_id)
  )
  WHERE id = COALESCE(NEW.post_id, OLD.post_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$function$;

-- Manually update the existing topic to fix the score
UPDATE topics 
SET vote_score = (
  SELECT COALESCE(SUM(vote_type), 0) 
  FROM topic_votes 
  WHERE topic_id = '2b39e7bd-5cfc-4af4-ac7f-7fe606e0a71f'
) 
WHERE id = '2b39e7bd-5cfc-4af4-ac7f-7fe606e0a71f';