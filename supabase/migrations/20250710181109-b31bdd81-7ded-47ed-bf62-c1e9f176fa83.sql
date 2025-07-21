-- Create moderation history table to track all status changes
CREATE TABLE public.moderation_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  content_id UUID NOT NULL,
  content_type TEXT NOT NULL CHECK (content_type IN ('post', 'topic')),
  old_status TEXT,
  new_status TEXT NOT NULL,
  moderator_id UUID,
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ip_address INET
);

-- Enable RLS on moderation history
ALTER TABLE public.moderation_history ENABLE ROW LEVEL SECURITY;

-- Create moderation appeals table for direct admin contact
CREATE TABLE public.moderation_appeals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  content_id UUID NOT NULL,
  content_type TEXT NOT NULL CHECK (content_type IN ('post', 'topic')),
  appellant_id UUID,
  appellant_email TEXT,
  appellant_ip INET,
  appeal_reason TEXT NOT NULL,
  content_context TEXT,
  admin_response TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'dismissed')),
  reviewed_by UUID,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on moderation appeals
ALTER TABLE public.moderation_appeals ENABLE ROW LEVEL SECURITY;

-- Create function to check if content is protected from re-moderation
CREATE OR REPLACE FUNCTION public.check_moderation_protection(
  p_content_id UUID,
  p_content_type TEXT
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  last_approval RECORD;
  protection_status JSONB;
BEGIN
  -- Get the most recent approval by a moderator/admin
  SELECT mh.*, p.username as moderator_name
  INTO last_approval
  FROM public.moderation_history mh
  LEFT JOIN public.profiles p ON mh.moderator_id = p.id
  WHERE mh.content_id = p_content_id 
    AND mh.content_type = p_content_type
    AND mh.new_status = 'approved'
    AND mh.moderator_id IS NOT NULL
  ORDER BY mh.created_at DESC
  LIMIT 1;

  IF last_approval IS NULL THEN
    -- No moderator approval found, not protected
    RETURN jsonb_build_object(
      'is_protected', false,
      'reason', 'No previous moderator approval found'
    );
  END IF;

  -- Content is protected
  RETURN jsonb_build_object(
    'is_protected', true,
    'approved_at', last_approval.created_at,
    'approved_by', last_approval.moderator_name,
    'moderator_id', last_approval.moderator_id,
    'reason', last_approval.reason
  );
END;
$$;

-- Create function to log moderation status changes
CREATE OR REPLACE FUNCTION public.log_moderation_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  content_type_val TEXT;
BEGIN
  -- Determine content type based on table
  IF TG_TABLE_NAME = 'posts' THEN
    content_type_val := 'post';
  ELSIF TG_TABLE_NAME = 'topics' THEN
    content_type_val := 'topic';
  END IF;

  -- Log the change if moderation_status changed
  IF OLD.moderation_status IS DISTINCT FROM NEW.moderation_status THEN
    INSERT INTO public.moderation_history (
      content_id,
      content_type,
      old_status,
      new_status,
      moderator_id,
      reason
    ) VALUES (
      NEW.id,
      content_type_val,
      OLD.moderation_status,
      NEW.moderation_status,
      auth.uid(),
      CASE 
        WHEN NEW.moderation_status = 'pending' THEN 'Content reported'
        WHEN NEW.moderation_status = 'approved' THEN 'Content approved by moderator'
        WHEN NEW.moderation_status = 'rejected' THEN 'Content rejected by moderator'
        ELSE 'Status changed'
      END
    );
  END IF;

  RETURN NEW;
END;
$$;

-- Create function to prevent re-moderation of protected content
CREATE OR REPLACE FUNCTION public.prevent_remoderation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  protection_info JSONB;
  content_type_val TEXT;
BEGIN
  -- Determine content type
  IF TG_TABLE_NAME = 'posts' THEN
    content_type_val := 'post';
  ELSIF TG_TABLE_NAME = 'topics' THEN
    content_type_val := 'topic';
  END IF;

  -- Only check if status is being changed to 'pending'
  IF NEW.moderation_status = 'pending' AND OLD.moderation_status != 'pending' THEN
    protection_info := check_moderation_protection(NEW.id, content_type_val);
    
    -- If content is protected and user is not admin/moderator, prevent change
    IF (protection_info->>'is_protected')::boolean = true THEN
      -- Allow admins and moderators to override protection
      IF NOT (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'moderator')) THEN
        RAISE EXCEPTION 'This content was previously reviewed and approved by moderators on %. Please use the appeal system if you believe this is in error.', 
          (protection_info->>'approved_at')::timestamp;
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Create triggers for logging moderation changes
CREATE TRIGGER log_post_moderation_changes
  AFTER UPDATE ON public.posts
  FOR EACH ROW
  EXECUTE FUNCTION public.log_moderation_change();

CREATE TRIGGER log_topic_moderation_changes  
  AFTER UPDATE ON public.topics
  FOR EACH ROW
  EXECUTE FUNCTION public.log_moderation_change();

-- Create triggers to prevent re-moderation
CREATE TRIGGER prevent_post_remoderation
  BEFORE UPDATE ON public.posts
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_remoderation();

CREATE TRIGGER prevent_topic_remoderation
  BEFORE UPDATE ON public.topics  
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_remoderation();

-- RLS Policies for moderation_history
CREATE POLICY "Moderators can view moderation history" 
ON public.moderation_history 
FOR SELECT 
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'moderator'));

CREATE POLICY "System can insert moderation history" 
ON public.moderation_history 
FOR INSERT 
WITH CHECK (true);

-- RLS Policies for moderation_appeals
CREATE POLICY "Moderators can view all appeals" 
ON public.moderation_appeals 
FOR ALL 
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'moderator'));

CREATE POLICY "Users can view their own appeals" 
ON public.moderation_appeals 
FOR SELECT 
USING (auth.uid() = appellant_id);

CREATE POLICY "Anyone can create appeals" 
ON public.moderation_appeals 
FOR INSERT 
WITH CHECK (true);

-- Migrate existing approved content to create protection
INSERT INTO public.moderation_history (content_id, content_type, old_status, new_status, reason)
SELECT 
  id,
  'post',
  'pending',
  'approved',
  'Migrated existing approved content'
FROM public.posts 
WHERE moderation_status = 'approved';

INSERT INTO public.moderation_history (content_id, content_type, old_status, new_status, reason)
SELECT 
  id, 
  'topic',
  'pending',
  'approved',
  'Migrated existing approved content'
FROM public.topics 
WHERE moderation_status = 'approved';