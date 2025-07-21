-- Update banned words severity to properly block inappropriate content
UPDATE public.banned_words 
SET severity = 'ban' 
WHERE severity = 'moderate' 
AND category IN ('profanity', 'harassment')
AND word_pattern IN ('gay', 'Gay', 'faggot', 'retard', 'nigger', 'fuck', 'shit', 'bitch', 'asshole', 'cunt', 'slut', 'whore');

-- Also ensure any offensive terms are set to ban severity
UPDATE public.banned_words 
SET severity = 'ban'
WHERE category = 'profanity' 
AND severity != 'ban';