-- Add 'closed' status to reports table
ALTER TABLE public.reports 
DROP CONSTRAINT IF EXISTS reports_status_check;

ALTER TABLE public.reports 
ADD CONSTRAINT reports_status_check 
CHECK (status IN ('pending', 'reviewed', 'resolved', 'dismissed', 'closed'));

-- Create index for better performance on status filtering
CREATE INDEX IF NOT EXISTS idx_reports_status_created ON public.reports(status, created_at DESC);