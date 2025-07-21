-- Create banned_words table for content filtering
CREATE TABLE public.banned_words (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  word_pattern TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'moderate' CHECK (severity IN ('warning', 'moderate', 'ban')),
  category TEXT NOT NULL DEFAULT 'general' CHECK (category IN ('profanity', 'spam', 'harassment', 'general')),
  match_type TEXT NOT NULL DEFAULT 'exact' CHECK (match_type IN ('exact', 'partial', 'regex')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  notes TEXT
);

-- Create banned_ips table for IP blocking
CREATE TABLE public.banned_ips (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ip_address INET NOT NULL,
  ip_range CIDR,
  ban_type TEXT NOT NULL DEFAULT 'temporary' CHECK (ban_type IN ('temporary', 'permanent', 'shadowban')),
  reason TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  admin_notes TEXT,
  appeal_status TEXT DEFAULT 'none' CHECK (appeal_status IN ('none', 'pending', 'approved', 'denied'))
);

-- Create ip_whitelist table for trusted IPs
CREATE TABLE public.ip_whitelist (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ip_address INET NOT NULL,
  ip_range CIDR,
  description TEXT NOT NULL,
  bypass_level TEXT NOT NULL DEFAULT 'basic' CHECK (bypass_level IN ('basic', 'moderate', 'full')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Enable RLS on all new tables
ALTER TABLE public.banned_words ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.banned_ips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ip_whitelist ENABLE ROW LEVEL SECURITY;

-- RLS policies for banned_words
CREATE POLICY "Admins can manage banned words" 
ON public.banned_words 
FOR ALL 
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "System can read banned words" 
ON public.banned_words 
FOR SELECT 
USING (true);

-- RLS policies for banned_ips
CREATE POLICY "Admins can manage banned IPs" 
ON public.banned_ips 
FOR ALL 
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "System can read banned IPs" 
ON public.banned_ips 
FOR SELECT 
USING (true);

-- RLS policies for ip_whitelist
CREATE POLICY "Admins can manage IP whitelist" 
ON public.ip_whitelist 
FOR ALL 
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "System can read IP whitelist" 
ON public.ip_whitelist 
FOR SELECT 
USING (true);

-- Create indexes for performance
CREATE INDEX idx_banned_words_active ON public.banned_words(is_active) WHERE is_active = true;
CREATE INDEX idx_banned_words_category ON public.banned_words(category, is_active);
CREATE INDEX idx_banned_ips_active ON public.banned_ips(is_active) WHERE is_active = true;
CREATE INDEX idx_banned_ips_range ON public.banned_ips USING GIST(ip_range) WHERE ip_range IS NOT NULL;
CREATE INDEX idx_ip_whitelist_active ON public.ip_whitelist(is_active) WHERE is_active = true;
CREATE INDEX idx_ip_whitelist_range ON public.ip_whitelist USING GIST(ip_range) WHERE ip_range IS NOT NULL;

-- Enhanced content analysis function with banned words checking
CREATE OR REPLACE FUNCTION public.check_banned_words(content_text text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  banned_word RECORD;
  matches jsonb := '[]';
  highest_severity TEXT := 'none';
  is_blocked BOOLEAN := false;
BEGIN
  -- Check each active banned word
  FOR banned_word IN 
    SELECT word_pattern, severity, category, match_type 
    FROM public.banned_words 
    WHERE is_active = true 
    AND (expires_at IS NULL OR expires_at > now())
    ORDER BY severity DESC
  LOOP
    -- Check based on match type
    CASE banned_word.match_type
      WHEN 'exact' THEN
        IF lower(content_text) ~ ('\y' || lower(banned_word.word_pattern) || '\y') THEN
          matches := matches || jsonb_build_object(
            'word', banned_word.word_pattern,
            'severity', banned_word.severity,
            'category', banned_word.category,
            'match_type', 'exact'
          );
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
            'match_type', 'partial'
          );
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
            'match_type', 'regex'
          );
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
    'match_count', jsonb_array_length(matches)
  );
END;
$$;

-- IP blocking check function
CREATE OR REPLACE FUNCTION public.check_ip_banned(user_ip inet)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  banned_record RECORD;
  whitelist_record RECORD;
BEGIN
  -- First check if IP is whitelisted
  SELECT * INTO whitelist_record
  FROM public.ip_whitelist
  WHERE is_active = true
  AND (
    ip_address = user_ip OR 
    (ip_range IS NOT NULL AND user_ip << ip_range)
  )
  LIMIT 1;

  IF whitelist_record.id IS NOT NULL THEN
    RETURN jsonb_build_object(
      'is_banned', false,
      'is_whitelisted', true,
      'bypass_level', whitelist_record.bypass_level
    );
  END IF;

  -- Check if IP is banned
  SELECT * INTO banned_record
  FROM public.banned_ips
  WHERE is_active = true
  AND (expires_at IS NULL OR expires_at > now())
  AND (
    ip_address = user_ip OR 
    (ip_range IS NOT NULL AND user_ip << ip_range)
  )
  ORDER BY 
    CASE ban_type 
      WHEN 'permanent' THEN 1 
      WHEN 'temporary' THEN 2 
      WHEN 'shadowban' THEN 3 
    END
  LIMIT 1;

  IF banned_record.id IS NOT NULL THEN
    RETURN jsonb_build_object(
      'is_banned', true,
      'ban_type', banned_record.ban_type,
      'reason', banned_record.reason,
      'expires_at', banned_record.expires_at,
      'is_whitelisted', false
    );
  END IF;

  RETURN jsonb_build_object(
    'is_banned', false,
    'is_whitelisted', false
  );
END;
$$;

-- Update the existing content analysis function to include banned words
CREATE OR REPLACE FUNCTION public.analyze_content_for_spam(content_text text, content_type text DEFAULT 'post')
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  content_config jsonb;
  content_hash_var text;
  spam_indicators jsonb := '{}';
  is_spam boolean := false;
  confidence decimal(3,2) := 0.00;
  similar_count integer;
  normalized_content text;
  banned_words_result jsonb;
BEGIN
  -- Get content filtering configuration
  SELECT config_value INTO content_config 
  FROM public.spam_detection_config 
  WHERE config_key = 'content_filters' AND is_active = true;

  -- Normalize content for analysis
  normalized_content := lower(trim(regexp_replace(content_text, '\s+', ' ', 'g')));
  content_hash_var := encode(sha256(normalized_content::bytea), 'hex');

  -- Check banned words first
  banned_words_result := check_banned_words(content_text);
  
  IF (banned_words_result->>'is_blocked')::boolean THEN
    spam_indicators := spam_indicators || jsonb_build_object(
      'banned_words', banned_words_result->'matches',
      'highest_word_severity', banned_words_result->>'highest_severity'
    );
    confidence := confidence + 0.9;
    is_spam := true;
  ELSIF (banned_words_result->>'match_count')::integer > 0 THEN
    spam_indicators := spam_indicators || jsonb_build_object(
      'suspicious_words', banned_words_result->'matches'
    );
    CASE banned_words_result->>'highest_severity'
      WHEN 'moderate' THEN confidence := confidence + 0.6;
      WHEN 'warning' THEN confidence := confidence + 0.3;
    END CASE;
  END IF;

  -- Check minimum content length
  IF length(normalized_content) < COALESCE((content_config->>'min_content_length')::integer, 10) THEN
    spam_indicators := spam_indicators || jsonb_build_object('too_short', true);
    confidence := confidence + 0.3;
  END IF;

  -- Check for Lorem Ipsum patterns
  IF content_config IS NOT NULL AND EXISTS (
    SELECT 1 FROM jsonb_array_elements_text(content_config->'lorem_ipsum_patterns') AS pattern
    WHERE normalized_content LIKE '%' || pattern || '%'
  ) THEN
    spam_indicators := spam_indicators || jsonb_build_object('lorem_ipsum', true);
    confidence := confidence + 0.8;
    is_spam := true;
  END IF;

  -- Check for spam keywords
  IF content_config IS NOT NULL AND EXISTS (
    SELECT 1 FROM jsonb_array_elements_text(content_config->'spam_keywords') AS keyword
    WHERE normalized_content LIKE '%' || keyword || '%'
  ) THEN
    spam_indicators := spam_indicators || jsonb_build_object('spam_keywords', true);
    confidence := confidence + 0.6;
  END IF;

  -- Check for duplicate content
  SELECT COUNT(*) INTO similar_count
  FROM public.content_analysis ca
  WHERE ca.content_hash = content_hash_var
    AND ca.created_at > (now() - interval '24 hours');

  IF similar_count > 0 THEN
    spam_indicators := spam_indicators || jsonb_build_object('duplicate_content', true, 'duplicate_count', similar_count);
    confidence := confidence + (similar_count * 0.2);
  END IF;

  -- Determine if content is spam
  IF confidence >= 0.7 THEN
    is_spam := true;
  END IF;

  -- Store analysis results
  INSERT INTO public.content_analysis (
    content_hash, content_type, spam_indicators, is_spam, confidence_score
  ) VALUES (
    content_hash_var, content_type, spam_indicators, is_spam, LEAST(confidence, 1.00)
  );

  RETURN jsonb_build_object(
    'is_spam', is_spam,
    'confidence', LEAST(confidence, 1.00),
    'indicators', spam_indicators,
    'content_hash', content_hash_var,
    'banned_words_result', banned_words_result
  );
END;
$function$;

-- Create triggers for updating timestamps
CREATE TRIGGER update_banned_words_updated_at
  BEFORE UPDATE ON public.banned_words
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_banned_ips_updated_at
  BEFORE UPDATE ON public.banned_ips
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ip_whitelist_updated_at
  BEFORE UPDATE ON public.ip_whitelist
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();