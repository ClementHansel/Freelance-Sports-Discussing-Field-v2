-- Fix the overly permissive admin audit log RLS policy
-- Remove the existing permissive policy and replace with secure ones

DROP POLICY IF EXISTS "System can insert audit logs" ON public.admin_audit_log;

-- Create a more secure policy that only allows system functions to insert audit logs
-- This prevents direct inserts from client code
CREATE POLICY "Only system functions can insert audit logs" 
ON public.admin_audit_log 
FOR INSERT 
WITH CHECK (false); -- Blocks all direct inserts

-- Allow inserts only through security definer functions
-- Update the log_admin_action function to use security definer privileges
CREATE OR REPLACE FUNCTION public.log_admin_action(
  p_admin_user_id uuid,
  p_action_type text,
  p_target_type text,
  p_target_id uuid,
  p_target_details jsonb DEFAULT NULL
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only allow logged-in users who are admins to log actions
  IF auth.uid() IS NULL OR NOT has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Unauthorized: Only admins can log audit actions';
  END IF;

  -- Ensure the admin_user_id matches the current user
  IF p_admin_user_id != auth.uid() THEN
    RAISE EXCEPTION 'Invalid admin_user_id: Must match current user';
  END IF;

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