-- Add DELETE policy for reports table to allow moderators to delete reports
CREATE POLICY "Moderators can delete reports" 
ON public.reports 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'::user_role) OR has_role(auth.uid(), 'moderator'::user_role));