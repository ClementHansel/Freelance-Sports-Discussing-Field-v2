-- Add admin notes and reporter IP address to reports table
ALTER TABLE public.reports 
ADD COLUMN admin_notes TEXT,
ADD COLUMN reporter_ip_address INET;

-- Add index for IP-based queries
CREATE INDEX idx_reports_reporter_ip ON public.reports(reporter_ip_address);