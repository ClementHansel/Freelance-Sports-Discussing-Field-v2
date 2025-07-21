-- Update RLS policies for reports table to allow anonymous reporting

-- Drop existing policies
DROP POLICY IF EXISTS "Users can create reports" ON public.reports;
DROP POLICY IF EXISTS "Users can view their own reports" ON public.reports;

-- Create new policies that allow anonymous reporting
CREATE POLICY "Users and anonymous can create reports" 
ON public.reports 
FOR INSERT 
WITH CHECK (
  -- Authenticated users must match their ID
  (auth.uid() IS NOT NULL AND auth.uid() = reporter_id) OR 
  -- Anonymous users can report with NULL reporter_id
  (auth.uid() IS NULL AND reporter_id IS NULL)
);

-- Allow users to view their own reports, but not anonymous reports
CREATE POLICY "Users can view their own reports" 
ON public.reports 
FOR SELECT 
USING (auth.uid() = reporter_id);

-- Moderators and admins can still view all reports (existing policy remains)
-- The "Moderators can view all reports" policy already exists and allows moderators to see everything