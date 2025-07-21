-- Add proper foreign key constraints to prevent accidental cascading deletions
-- First, add the missing foreign key constraints

-- Add foreign key for posts.parent_post_id
ALTER TABLE public.posts 
ADD CONSTRAINT posts_parent_post_id_fkey 
FOREIGN KEY (parent_post_id) REFERENCES public.posts(id) ON DELETE SET NULL;

-- Add foreign key for posts.topic_id with RESTRICT to prevent topic deletion if posts exist
ALTER TABLE public.posts 
ADD CONSTRAINT posts_topic_id_fkey 
FOREIGN KEY (topic_id) REFERENCES public.topics(id) ON DELETE RESTRICT;

-- Add foreign key for topics.category_id with RESTRICT to prevent category deletion if topics exist
ALTER TABLE public.topics 
ADD CONSTRAINT topics_category_id_fkey 
FOREIGN KEY (category_id) REFERENCES public.categories(id) ON DELETE RESTRICT;

-- Create audit log table for tracking admin actions
CREATE TABLE public.admin_audit_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action_type TEXT NOT NULL, -- 'delete_post', 'delete_topic', 'ban_user', etc.
  target_type TEXT NOT NULL, -- 'post', 'topic', 'user'
  target_id UUID NOT NULL,
  target_details JSONB, -- Store additional details about what was deleted
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on audit log
ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;

-- Only admins can view and insert audit logs
CREATE POLICY "Admins can view audit logs" 
ON public.admin_audit_log 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::user_role));

CREATE POLICY "System can insert audit logs" 
ON public.admin_audit_log 
FOR INSERT 
WITH CHECK (true);

-- Add function to log admin actions
CREATE OR REPLACE FUNCTION public.log_admin_action(
  p_admin_user_id UUID,
  p_action_type TEXT,
  p_target_type TEXT,
  p_target_id UUID,
  p_target_details JSONB DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.admin_audit_log (
    admin_user_id,
    action_type,
    target_type,
    target_id,
    target_details
  ) VALUES (
    p_admin_user_id,
    p_action_type,
    p_target_type,
    p_target_id,
    p_target_details
  );
END;
$$;