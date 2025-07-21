-- Add reporter IP address to reports table (admin_notes already exists)
ALTER TABLE public.reports 
ADD COLUMN IF NOT EXISTS reporter_ip_address INET;

-- Add index for IP-based queries
CREATE INDEX IF NOT EXISTS idx_reports_reporter_ip ON public.reports(reporter_ip_address);