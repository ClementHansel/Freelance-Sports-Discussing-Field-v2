-- Add new columns to banned_words table for enhanced functionality
ALTER TABLE public.banned_words 
ADD COLUMN action text NOT NULL DEFAULT 'block' CHECK (action IN ('block', 'replace', 'warn')),
ADD COLUMN replacement_text text DEFAULT '*Not Allowed*';

-- Update match_type to include wildcard option
ALTER TABLE public.banned_words 
DROP CONSTRAINT IF EXISTS banned_words_match_type_check,
ADD CONSTRAINT banned_words_match_type_check CHECK (match_type IN ('exact', 'partial', 'regex', 'wildcard'));

-- Update existing records to have default action
UPDATE public.banned_words SET action = 'block' WHERE action IS NULL;

-- Enhanced check_banned_words function with wildcard support and replacement info
CREATE OR REPLACE FUNCTION public.check_banned_words(content_text text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  banned_word RECORD;
  matches jsonb := '[]';
  replacements jsonb := '{}';
  highest_severity TEXT := 'none';
  is_blocked BOOLEAN := false;
  wildcard_pattern TEXT;
BEGIN
  -- Check each active banned word
  FOR banned_word IN 
    SELECT word_pattern, severity, category, match_type, action, replacement_text, notes
    FROM public.banned_words 
    WHERE is_active = true 
    AND (expires_at IS NULL OR expires_at > now())
    ORDER BY severity DESC
  LOOP
    -- Check based on match type
    CASE banned_word.match_type
      WHEN 'exact' THEN
        IF lower(content_text) ~* ('\y' || lower(banned_word.word_pattern) || '\y') THEN
          matches := matches || jsonb_build_object(
            'word', banned_word.word_pattern,
            'severity', banned_word.severity,
            'category', banned_word.category,
            'match_type', 'exact',
            'action', banned_word.action,
            'replacement_text', banned_word.replacement_text
          );
          
          -- Store replacement info if action is replace
          IF banned_word.action = 'replace' THEN
            replacements := replacements || jsonb_build_object(
              banned_word.word_pattern, 
              COALESCE(banned_word.replacement_text, '*Not Allowed*')
            );
          END IF;
          
          IF banned_word.severity = 'ban' THEN
            highest_severity := 'ban';
            is_blocked := true;
          ELSIF banned_word.severity = 'moderate' AND highest_severity != 'ban' THEN
            highest_severity := 'moderate';
          ELSIF highest_severity = 'none' THEN
            highest_severity := 'warning';
          END IF;
        END IF;
        
      WHEN 'partial' THEN
        IF position(lower(banned_word.word_pattern) IN lower(content_text)) > 0 THEN
          matches := matches || jsonb_build_object(
            'word', banned_word.word_pattern,
            'severity', banned_word.severity,
            'category', banned_word.category,
            'match_type', 'partial',
            'action', banned_word.action,
            'replacement_text', banned_word.replacement_text
          );
          
          IF banned_word.action = 'replace' THEN
            replacements := replacements || jsonb_build_object(
              banned_word.word_pattern, 
              COALESCE(banned_word.replacement_text, '*Not Allowed*')
            );
          END IF;
          
          IF banned_word.severity = 'ban' THEN
            highest_severity := 'ban';
            is_blocked := true;
          ELSIF banned_word.severity = 'moderate' AND highest_severity != 'ban' THEN
            highest_severity := 'moderate';
          ELSIF highest_severity = 'none' THEN
            highest_severity := 'warning';
          END IF;
        END IF;
        
      WHEN 'wildcard' THEN
        -- Convert wildcard pattern to regex (e.g., "fuck*" becomes "fuck\w*")
        wildcard_pattern := replace(banned_word.word_pattern, '*', '\\w*');
        wildcard_pattern := '\y' || wildcard_pattern || '\y';
        
        IF content_text ~* wildcard_pattern THEN
          matches := matches || jsonb_build_object(
            'word', banned_word.word_pattern,
            'severity', banned_word.severity,
            'category', banned_word.category,
            'match_type', 'wildcard',
            'action', banned_word.action,
            'replacement_text', banned_word.replacement_text
          );
          
          IF banned_word.action = 'replace' THEN
            replacements := replacements || jsonb_build_object(
              banned_word.word_pattern, 
              COALESCE(banned_word.replacement_text, '*Not Allowed*')
            );
          END IF;
          
          IF banned_word.severity = 'ban' THEN
            highest_severity := 'ban';
            is_blocked := true;
          ELSIF banned_word.severity = 'moderate' AND highest_severity != 'ban' THEN
            highest_severity := 'moderate';
          ELSIF highest_severity = 'none' THEN
            highest_severity := 'warning';
          END IF;
        END IF;
        
      WHEN 'regex' THEN
        IF content_text ~* banned_word.word_pattern THEN
          matches := matches || jsonb_build_object(
            'word', banned_word.word_pattern,
            'severity', banned_word.severity,
            'category', banned_word.category,
            'match_type', 'regex',
            'action', banned_word.action,
            'replacement_text', banned_word.replacement_text
          );
          
          IF banned_word.action = 'replace' THEN
            replacements := replacements || jsonb_build_object(
              banned_word.word_pattern, 
              COALESCE(banned_word.replacement_text, '*Not Allowed*')
            );
          END IF;
          
          IF banned_word.severity = 'ban' THEN
            highest_severity := 'ban';
            is_blocked := true;
          ELSIF banned_word.severity = 'moderate' AND highest_severity != 'ban' THEN
            highest_severity := 'moderate';
          ELSIF highest_severity = 'none' THEN
            highest_severity := 'warning';
          END IF;
        END IF;
    END CASE;
  END LOOP;

  RETURN jsonb_build_object(
    'is_blocked', is_blocked,
    'highest_severity', highest_severity,
    'matches', matches,
    'replacements', replacements,
    'match_count', jsonb_array_length(matches)
  );
END;
$function$;

-- Create function to process and replace banned words in content
CREATE OR REPLACE FUNCTION public.process_banned_words(content_text text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  banned_word RECORD;
  processed_content TEXT := content_text;
  replacements_made jsonb := '[]';
  wildcard_pattern TEXT;
  replacement_text TEXT;
  found_matches TEXT[];
  match_text TEXT;
BEGIN
  -- First check if content should be blocked
  IF (SELECT (check_banned_words(content_text)->>'is_blocked')::boolean) THEN
    RETURN jsonb_build_object(
      'is_blocked', true,
      'processed_content', content_text,
      'replacements_made', '[]'::jsonb
    );
  END IF;

  -- Process replacements for non-blocking words
  FOR banned_word IN 
    SELECT word_pattern, match_type, action, replacement_text, severity
    FROM public.banned_words 
    WHERE is_active = true 
    AND (expires_at IS NULL OR expires_at > now())
    AND action = 'replace'
    AND severity != 'ban'
    ORDER BY LENGTH(word_pattern) DESC -- Process longer patterns first
  LOOP
    replacement_text := COALESCE(banned_word.replacement_text, '*Not Allowed*');
    
    CASE banned_word.match_type
      WHEN 'exact' THEN
        -- Case-insensitive exact word replacement
        IF processed_content ~* ('\y' || banned_word.word_pattern || '\y') THEN
          processed_content := regexp_replace(
            processed_content, 
            '\y' || banned_word.word_pattern || '\y', 
            replacement_text, 
            'gi'
          );
          replacements_made := replacements_made || jsonb_build_object(
            'pattern', banned_word.word_pattern,
            'replacement', replacement_text,
            'match_type', 'exact'
          );
        END IF;
        
      WHEN 'wildcard' THEN
        -- Convert wildcard to regex and replace
        wildcard_pattern := replace(banned_word.word_pattern, '*', '\\w*');
        wildcard_pattern := '\y' || wildcard_pattern || '\y';
        
        IF processed_content ~* wildcard_pattern THEN
          processed_content := regexp_replace(
            processed_content, 
            wildcard_pattern, 
            replacement_text, 
            'gi'
          );
          replacements_made := replacements_made || jsonb_build_object(
            'pattern', banned_word.word_pattern,
            'replacement', replacement_text,
            'match_type', 'wildcard'
          );
        END IF;
        
      WHEN 'partial' THEN
        -- Case-insensitive partial replacement
        IF position(lower(banned_word.word_pattern) IN lower(processed_content)) > 0 THEN
          processed_content := regexp_replace(
            processed_content, 
            banned_word.word_pattern, 
            replacement_text, 
            'gi'
          );
          replacements_made := replacements_made || jsonb_build_object(
            'pattern', banned_word.word_pattern,
            'replacement', replacement_text,
            'match_type', 'partial'
          );
        END IF;
        
      WHEN 'regex' THEN
        -- Regex replacement
        IF processed_content ~* banned_word.word_pattern THEN
          processed_content := regexp_replace(
            processed_content, 
            banned_word.word_pattern, 
            replacement_text, 
            'gi'
          );
          replacements_made := replacements_made || jsonb_build_object(
            'pattern', banned_word.word_pattern,
            'replacement', replacement_text,
            'match_type', 'regex'
          );
        END IF;
    END CASE;
  END LOOP;

  RETURN jsonb_build_object(
    'is_blocked', false,
    'processed_content', processed_content,
    'replacements_made', replacements_made,
    'replacements_count', jsonb_array_length(replacements_made)
  );
END;
$function$;